-- Comprehensive Row Level Security (RLS) Policies
-- This migration ensures users can only access their own data and workspace data they have permission to view

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of workspace members" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can update workspace details" ON public.workspaces;
DROP POLICY IF EXISTS "Only owners can delete workspaces" ON public.workspaces;

DROP POLICY IF EXISTS "Users can view projects in their workspaces" ON public.projects;
DROP POLICY IF EXISTS "Workspace members can create projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view tasks in their workspace projects" ON public.tasks;
DROP POLICY IF EXISTS "Workspace members can create tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view comments in accessible tasks" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON public.comments;

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can view profiles of other workspace members
CREATE POLICY "Users can view workspace member profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm1
            JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
            WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
        )
    );

-- Users can insert their own profile (for manual creation if needed)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================
-- WORKSPACES TABLE POLICIES
-- =============================================================================

-- Users can view workspaces they are members of
CREATE POLICY "Members can view workspaces" ON public.workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_id = workspaces.id AND user_id = auth.uid()
        )
    );

-- Users can create new workspaces (they become owners)
CREATE POLICY "Users can create workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Only owners and admins can update workspaces
CREATE POLICY "Owners and admins can update workspaces" ON public.workspaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_id = workspaces.id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners can delete workspaces
CREATE POLICY "Only owners can delete workspaces" ON public.workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- =============================================================================
-- WORKSPACE_MEMBERS TABLE POLICIES
-- =============================================================================

-- Users can view members of workspaces they belong to
CREATE POLICY "Members can view workspace members" ON public.workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Only owners and admins can add new members
CREATE POLICY "Owners and admins can add members" ON public.workspace_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- Only owners and admins can update member roles
CREATE POLICY "Owners and admins can update members" ON public.workspace_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- Owners and admins can remove members, users can remove themselves
CREATE POLICY "Members can be removed by admins or themselves" ON public.workspace_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- PROJECTS TABLE POLICIES
-- =============================================================================

-- Users can view projects in workspaces they belong to
CREATE POLICY "Members can view workspace projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can create projects
CREATE POLICY "Members can create projects" ON public.projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can update projects
CREATE POLICY "Members can update projects" ON public.projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Only owners and admins can delete projects
CREATE POLICY "Owners and admins can delete projects" ON public.projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = projects.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- TASKS TABLE POLICIES
-- =============================================================================

-- Users can view tasks in projects they have access to
CREATE POLICY "Members can view workspace tasks" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can create tasks
CREATE POLICY "Members can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id AND wm.user_id = auth.uid()
        ) AND created_by = auth.uid()
    );

-- Users can update tasks in their workspaces
CREATE POLICY "Members can update workspace tasks" ON public.tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id AND wm.user_id = auth.uid()
        )
    );

-- Task creators, assignees, and workspace admins can delete tasks
CREATE POLICY "Creators, assignees, and admins can delete tasks" ON public.tasks
    FOR DELETE USING (
        created_by = auth.uid() OR 
        assignee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- SUBTASKS TABLE POLICIES
-- =============================================================================

-- Users can view subtasks if they can view the parent task
CREATE POLICY "Members can view subtasks" ON public.subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = subtasks.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can create subtasks for tasks they can access
CREATE POLICY "Members can create subtasks" ON public.subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = subtasks.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can update subtasks for tasks they can access
CREATE POLICY "Members can update subtasks" ON public.subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = subtasks.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can delete subtasks for tasks they can access
CREATE POLICY "Members can delete subtasks" ON public.subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = subtasks.task_id AND wm.user_id = auth.uid()
        )
    );

-- =============================================================================
-- COMMENTS TABLE POLICIES
-- =============================================================================

-- Users can view comments on tasks they can access
CREATE POLICY "Members can view task comments" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = comments.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can create comments on tasks they can access
CREATE POLICY "Members can create comments" ON public.comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = comments.task_id AND wm.user_id = auth.uid()
        ) AND author_id = auth.uid()
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (author_id = auth.uid());

-- Users can delete their own comments, or admins can delete any comments
CREATE POLICY "Users can delete own comments or admins can delete any" ON public.comments
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = comments.task_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- TAGS TABLE POLICIES
-- =============================================================================

-- Users can view tags in workspaces they belong to
CREATE POLICY "Members can view workspace tags" ON public.tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = tags.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can create tags
CREATE POLICY "Members can create tags" ON public.tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = tags.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Workspace members can update tags
CREATE POLICY "Members can update tags" ON public.tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = tags.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Only owners and admins can delete tags
CREATE POLICY "Owners and admins can delete tags" ON public.tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = tags.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- TASK_TAGS TABLE POLICIES
-- =============================================================================

-- Users can view task-tag relationships for tasks they can access
CREATE POLICY "Members can view task tags" ON public.task_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = task_tags.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can create task-tag relationships for tasks they can access
CREATE POLICY "Members can create task tags" ON public.task_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = task_tags.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can delete task-tag relationships for tasks they can access
CREATE POLICY "Members can delete task tags" ON public.task_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = task_tags.task_id AND wm.user_id = auth.uid()
        )
    );

-- =============================================================================
-- ATTACHMENTS TABLE POLICIES
-- =============================================================================

-- Users can view attachments for tasks they can access
CREATE POLICY "Members can view task attachments" ON public.attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = attachments.task_id AND wm.user_id = auth.uid()
        )
    );

-- Users can upload attachments to tasks they can access
CREATE POLICY "Members can upload attachments" ON public.attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = attachments.task_id AND wm.user_id = auth.uid()
        ) AND uploaded_by = auth.uid()
    );

-- Users can delete their own attachments, or admins can delete any attachments
CREATE POLICY "Users can delete own attachments or admins can delete any" ON public.attachments
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = attachments.task_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- TIME_ENTRIES TABLE POLICIES
-- =============================================================================

-- Users can view their own time entries and time entries for tasks they can access
CREATE POLICY "Users can view time entries" ON public.time_entries
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = time_entries.task_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- Users can create time entries for tasks they can access
CREATE POLICY "Members can create time entries" ON public.time_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = time_entries.task_id AND wm.user_id = auth.uid()
        ) AND user_id = auth.uid()
    );

-- Users can update their own time entries
CREATE POLICY "Users can update own time entries" ON public.time_entries
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own time entries
CREATE POLICY "Users can delete own time entries" ON public.time_entries
    FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- ACTIVITY_LOGS TABLE POLICIES
-- =============================================================================

-- Users can view activity logs for entities they have access to
CREATE POLICY "Users can view relevant activity logs" ON public.activity_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        (entity_type = 'workspace' AND EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = entity_id::uuid AND wm.user_id = auth.uid()
        )) OR
        (entity_type = 'project' AND EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE p.id = entity_id::uuid AND wm.user_id = auth.uid()
        )) OR
        (entity_type = 'task' AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = entity_id::uuid AND wm.user_id = auth.uid()
        ))
    );

-- Activity logs are created by the system, not directly by users
-- But we'll allow INSERT for system operations
CREATE POLICY "System can create activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- No updates or deletes allowed on activity logs (audit trail integrity)
-- Only allow SELECT and INSERT operations

-- =============================================================================
-- ENSURE ALL TABLES HAVE RLS ENABLED
-- =============================================================================

-- Enable RLS on all tables (some may already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Grant authenticated users access to the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Helper function to check if user is workspace member
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = $1 AND user_id = COALESCE($2, auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is workspace admin
CREATE OR REPLACE FUNCTION public.is_workspace_admin(workspace_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = $1 
    AND user_id = COALESCE($2, auth.uid()) 
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;