-- Enhanced profile creation trigger for seamless user onboarding
-- This migration improves upon the basic profile creation trigger

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an enhanced function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_workspace_id UUID;
BEGIN
    -- Create user profile with data from auth metadata
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        username,
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Create a default personal workspace for the new user
    INSERT INTO public.workspaces (
        name,
        description,
        owner_id
    ) VALUES (
        'Personal Workspace',
        'Your personal workspace for managing tasks and projects',
        NEW.id
    ) RETURNING id INTO default_workspace_id;

    -- Add user as owner of their personal workspace
    INSERT INTO public.workspace_members (
        workspace_id,
        user_id,
        role
    ) VALUES (
        default_workspace_id,
        NEW.id,
        'owner'
    );

    -- Create a default "Getting Started" project
    INSERT INTO public.projects (
        name,
        description,
        workspace_id,
        color
    ) VALUES (
        'Getting Started',
        'Welcome to your task management app! This project contains some sample tasks to help you get started.',
        default_workspace_id,
        '#10B981'
    );

    -- Log the user creation activity
    INSERT INTO public.activity_logs (
        entity_type,
        entity_id,
        action,
        changes,
        user_id
    ) VALUES (
        'user',
        NEW.id,
        'created',
        jsonb_build_object(
            'email', NEW.email,
            'signup_method', COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
            'created_at', NEW.created_at
        ),
        NEW.id
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle user profile updates
CREATE OR REPLACE FUNCTION public.handle_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = timezone('utc'::text, now());
    
    -- Log profile update activity
    INSERT INTO public.activity_logs (
        entity_type,
        entity_id,
        action,
        changes,
        user_id
    ) VALUES (
        'profile',
        NEW.id,
        'updated',
        jsonb_build_object(
            'old_values', to_jsonb(OLD),
            'new_values', to_jsonb(NEW)
        ),
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_profile_update();

-- Create function to handle user deletion (cleanup)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Log user deletion
    INSERT INTO public.activity_logs (
        entity_type,
        entity_id,
        action,
        changes,
        user_id
    ) VALUES (
        'user',
        OLD.id,
        'deleted',
        jsonb_build_object(
            'email', OLD.email,
            'deleted_at', timezone('utc'::text, now())
        ),
        OLD.id
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();

-- Grant necessary permissions for the auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Additional RLS policies for better security
-- Allow users to view other users' basic profile info in shared workspaces
CREATE POLICY "Users can view profiles of workspace members" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm1
            JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
            WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
        )
    );

-- Allow users to insert their own profile (for manual profile creation if needed)
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Add policy for workspace members to view workspace details
CREATE POLICY "Members can update workspace details" ON public.workspaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Add policy for workspace deletion (only owners)
CREATE POLICY "Only owners can delete workspaces" ON public.workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- Comments and other related policies
CREATE POLICY "Users can view comments in accessible tasks" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = comments.task_id AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on accessible tasks" ON public.comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE t.id = comments.task_id AND wm.user_id = auth.uid()
        ) AND author_id = auth.uid()
    );

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;