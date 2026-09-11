-- Migration: 003_default_workspace_and_chat.sql
-- Description: Auto-create default workspace for users on sign-up and configure chat persistence
-- Database: PostgreSQL / Supabase

-- 1. Update trigger to automatically create a default workspace when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insert or update user profile
    INSERT INTO public.users (
        id,
        email,
        full_name,
        avatar_url,
        tier,
        monthly_ai_tokens_used,
        monthly_pages_processed,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            ''
        ),
        'free',
        0,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE 
            WHEN public.users.full_name IS NULL OR public.users.full_name = '' 
            THEN EXCLUDED.full_name 
            ELSE public.users.full_name 
        END,
        avatar_url = CASE 
            WHEN public.users.avatar_url IS NULL OR public.users.avatar_url = '' 
            THEN EXCLUDED.avatar_url 
            ELSE public.users.avatar_url 
        END,
        updated_at = CURRENT_TIMESTAMP;

    -- 2. Create default workspace if user does not already have one
    IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE owner_id = NEW.id) THEN
        INSERT INTO public.workspaces (name, owner_id)
        VALUES ('Personal Workspace', NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill default workspace for any existing registered users who do not have one yet
INSERT INTO public.workspaces (name, owner_id)
SELECT 'Personal Workspace', u.id
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.workspaces w WHERE w.owner_id = u.id
);

-- 3. Ensure document_id in ai_conversations is nullable (for free-floating or browser-only document chats)
ALTER TABLE public.ai_conversations 
ALTER COLUMN document_id DROP NOT NULL;

-- 4. Strengthen Row Level Security policies with WITH CHECK for Inserts & Updates

-- Workspaces RLS
DROP POLICY IF EXISTS "Users can manage own workspaces" ON public.workspaces;
CREATE POLICY "Users can manage own workspaces"
    ON public.workspaces FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- AI Conversations RLS
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage own conversations"
    ON public.ai_conversations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- AI Messages RLS
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can manage messages in their conversations"
    ON public.ai_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE public.ai_conversations.id = public.ai_messages.conversation_id
            AND public.ai_conversations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE public.ai_conversations.id = public.ai_messages.conversation_id
            AND public.ai_conversations.user_id = auth.uid()
        )
    );
