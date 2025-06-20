import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushChange {
  table: string;
  id: string;
  created?: any;
  updated?: any;
  deleted?: boolean;
}

interface PushRequest {
  changes: PushChange[];
  lastPulledAt: number;
}

interface PushResponse {
  experimentalRejectedIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const pushRequest: PushRequest = await req.json()
    const { changes } = pushRequest
    
    const rejectedIds: string[] = []
    
    // Process changes in a transaction-like manner
    for (const change of changes) {
      try {
        const { table, id, created, updated, deleted } = change
        
        // Validate user has permission to modify this record
        if (!await hasPermission(supabaseClient, user.id, table, id, created || updated)) {
          rejectedIds.push(id)
          continue
        }
        
        if (deleted) {
          // Handle deletion
          const { error } = await supabaseClient
            .from(table)
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error(`Delete error for ${table}:${id}:`, error)
            rejectedIds.push(id)
          }
        } else if (created) {
          // Handle creation
          const recordToInsert = { ...created }
          delete recordToInsert.id // Remove local ID
          
          // Map special fields
          if (recordToInsert.server_id) {
            recordToInsert.id = recordToInsert.server_id
            delete recordToInsert.server_id
          } else {
            recordToInsert.id = id
          }
          
          // Convert timestamps
          if (recordToInsert.created_at) {
            recordToInsert.created_at = new Date(recordToInsert.created_at).toISOString()
          }
          if (recordToInsert.updated_at) {
            recordToInsert.updated_at = new Date(recordToInsert.updated_at).toISOString()
          }
          if (recordToInsert.due_date) {
            recordToInsert.due_date = new Date(recordToInsert.due_date).toISOString()
          }
          if (recordToInsert.completed_at) {
            recordToInsert.completed_at = new Date(recordToInsert.completed_at).toISOString()
          }
          if (recordToInsert.joined_at) {
            recordToInsert.joined_at = new Date(recordToInsert.joined_at).toISOString()
          }
          if (recordToInsert.start_time) {
            recordToInsert.start_time = new Date(recordToInsert.start_time).toISOString()
          }
          if (recordToInsert.end_time) {
            recordToInsert.end_time = new Date(recordToInsert.end_time).toISOString()
          }
          
          // Remove sync-related fields
          delete recordToInsert.synced_at
          delete recordToInsert.is_dirty
          
          const { error } = await supabaseClient
            .from(table)
            .insert(recordToInsert)
          
          if (error) {
            console.error(`Insert error for ${table}:${id}:`, error)
            rejectedIds.push(id)
          }
        } else if (updated) {
          // Handle update
          const recordToUpdate = { ...updated }
          delete recordToUpdate.id
          delete recordToUpdate.server_id
          
          // Convert timestamps
          if (recordToUpdate.created_at) {
            recordToUpdate.created_at = new Date(recordToUpdate.created_at).toISOString()
          }
          if (recordToUpdate.updated_at) {
            recordToUpdate.updated_at = new Date(recordToUpdate.updated_at).toISOString()
          }
          if (recordToUpdate.due_date) {
            recordToUpdate.due_date = new Date(recordToUpdate.due_date).toISOString()
          }
          if (recordToUpdate.completed_at) {
            recordToUpdate.completed_at = new Date(recordToUpdate.completed_at).toISOString()
          }
          if (recordToUpdate.joined_at) {
            recordToUpdate.joined_at = new Date(recordToUpdate.joined_at).toISOString()
          }
          if (recordToUpdate.start_time) {
            recordToUpdate.start_time = new Date(recordToUpdate.start_time).toISOString()
          }
          if (recordToUpdate.end_time) {
            recordToUpdate.end_time = new Date(recordToUpdate.end_time).toISOString()
          }
          
          // Remove sync-related fields
          delete recordToUpdate.synced_at
          delete recordToUpdate.is_dirty
          
          const { error } = await supabaseClient
            .from(table)
            .update(recordToUpdate)
            .eq('id', id)
          
          if (error) {
            console.error(`Update error for ${table}:${id}:`, error)
            rejectedIds.push(id)
          }
        }
      } catch (error) {
        console.error(`Error processing change ${change.table}:${change.id}:`, error)
        rejectedIds.push(change.id)
      }
    }
    
    const response: PushResponse = rejectedIds.length > 0 ? { experimentalRejectedIds: rejectedIds } : {}
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Sync push error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function hasPermission(supabaseClient: any, userId: string, table: string, recordId: string, record?: any): Promise<boolean> {
  try {
    // Get user's accessible workspaces
    const { data: userWorkspaces } = await supabaseClient
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', userId)
    
    const workspaceIds = userWorkspaces?.map(w => w.workspace_id) || []
    const adminWorkspaceIds = userWorkspaces?.filter(w => ['owner', 'admin'].includes(w.role)).map(w => w.workspace_id) || []
    
    switch (table) {
      case 'profiles':
        // Users can only modify their own profile
        return recordId === userId || record?.id === userId
      
      case 'workspaces':
        // Check if user is owner of the workspace
        if (record) {
          return record.owner_id === userId
        }
        const { data: workspace } = await supabaseClient
          .from('workspaces')
          .select('owner_id')
          .eq('id', recordId)
          .single()
        return workspace?.owner_id === userId
      
      case 'workspace_members':
        // Check if user is admin/owner of the workspace
        if (record) {
          return adminWorkspaceIds.includes(record.workspace_id)
        }
        const { data: membership } = await supabaseClient
          .from('workspace_members')
          .select('workspace_id')
          .eq('id', recordId)
          .single()
        return membership ? adminWorkspaceIds.includes(membership.workspace_id) : false
      
      case 'projects':
        // Check if user is member of the workspace
        if (record) {
          return workspaceIds.includes(record.workspace_id)
        }
        const { data: project } = await supabaseClient
          .from('projects')
          .select('workspace_id')
          .eq('id', recordId)
          .single()
        return project ? workspaceIds.includes(project.workspace_id) : false
      
      case 'tasks':
        // Check if user has access to the project
        if (record) {
          const { data: taskProject } = await supabaseClient
            .from('projects')
            .select('workspace_id')
            .eq('id', record.project_id)
            .single()
          return taskProject ? workspaceIds.includes(taskProject.workspace_id) : false
        }
        const { data: task } = await supabaseClient
          .from('tasks')
          .select('project_id')
          .eq('id', recordId)
          .single()
        if (!task) return false
        
        const { data: taskProjectExisting } = await supabaseClient
          .from('projects')
          .select('workspace_id')
          .eq('id', task.project_id)
          .single()
        return taskProjectExisting ? workspaceIds.includes(taskProjectExisting.workspace_id) : false
      
      case 'subtasks':
      case 'comments':
      case 'attachments':
      case 'time_entries':
        // Check if user has access to the task
        const taskIdField = 'task_id'
        let taskId = record?.[taskIdField]
        
        if (!taskId) {
          const { data: relatedRecord } = await supabaseClient
            .from(table)
            .select(taskIdField)
            .eq('id', recordId)
            .single()
          taskId = relatedRecord?.[taskIdField]
        }
        
        if (!taskId) return false
        
        const { data: relatedTask } = await supabaseClient
          .from('tasks')
          .select('project_id')
          .eq('id', taskId)
          .single()
        
        if (!relatedTask) return false
        
        const { data: relatedProject } = await supabaseClient
          .from('projects')
          .select('workspace_id')
          .eq('id', relatedTask.project_id)
          .single()
        
        return relatedProject ? workspaceIds.includes(relatedProject.workspace_id) : false
      
      case 'tags':
        // Check if user has access to the workspace
        if (record) {
          return workspaceIds.includes(record.workspace_id)
        }
        const { data: tag } = await supabaseClient
          .from('tags')
          .select('workspace_id')
          .eq('id', recordId)
          .single()
        return tag ? workspaceIds.includes(tag.workspace_id) : false
      
      case 'task_tags':
        // Check if user has access to both the task and tag
        if (record) {
          // Check tag access
          const { data: tagForTaskTag } = await supabaseClient
            .from('tags')
            .select('workspace_id')
            .eq('id', record.tag_id)
            .single()
          
          if (!tagForTaskTag || !workspaceIds.includes(tagForTaskTag.workspace_id)) {
            return false
          }
          
          // Check task access
          const { data: taskForTaskTag } = await supabaseClient
            .from('tasks')
            .select('project_id')
            .eq('id', record.task_id)
            .single()
          
          if (!taskForTaskTag) return false
          
          const { data: projectForTaskTag } = await supabaseClient
            .from('projects')
            .select('workspace_id')
            .eq('id', taskForTaskTag.project_id)
            .single()
          
          return projectForTaskTag ? workspaceIds.includes(projectForTaskTag.workspace_id) : false
        }
        return false
      
      case 'activity_logs':
        // Users can only create activity logs for their own actions
        return record?.user_id === userId
      
      default:
        return false
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}