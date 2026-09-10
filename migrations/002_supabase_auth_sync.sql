-- Migration: 002_supabase_auth_sync.sql
-- Description: Sync Supabase Auth users to public.users and establish Row Level Security (RLS)
-- Database: PostgreSQL / Supabase

-- 1. Ensure public.users references auth.users if available
-- Note: In Supabase, the auth schema owns auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        -- Add foreign key constraint to link public.users to auth.users if not present
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_users_auth_users'
        ) THEN
            ALTER TABLE public.users 
            ADD CONSTRAINT fk_users_auth_users 
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Trigger Function: Automatically insert or update public.users on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind Trigger to auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT OR UPDATE ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 4. Enable Row Level Security (RLS) on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for authenticated users
-- Users policy: users can read and edit their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Documents policy: users can manage their own documents
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents"
    ON public.documents FOR ALL
    USING (auth.uid() = owner_id);

-- Conversations policy: users can view and manage their own chats
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage own conversations"
    ON public.ai_conversations FOR ALL
    USING (auth.uid() = user_id);

-- AI Messages policy: users can manage messages belonging to their conversations
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can manage messages in their conversations"
    ON public.ai_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE public.ai_conversations.id = public.ai_messages.conversation_id
            AND public.ai_conversations.user_id = auth.uid()
        )
    );

-- Conversion jobs policy
DROP POLICY IF EXISTS "Users can manage own jobs" ON public.conversion_jobs;
CREATE POLICY "Users can manage own jobs"
    ON public.conversion_jobs FOR ALL
    USING (auth.uid() = user_id);

-- Workspaces policy
DROP POLICY IF EXISTS "Users can manage own workspaces" ON public.workspaces;
CREATE POLICY "Users can manage own workspaces"
    ON public.workspaces FOR ALL
    USING (auth.uid() = owner_id);

-- API keys policy
DROP POLICY IF EXISTS "Users can manage own api keys" ON public.api_keys;
CREATE POLICY "Users can manage own api keys"
    ON public.api_keys FOR ALL
    USING (auth.uid() = user_id);
