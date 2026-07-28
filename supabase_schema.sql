-- =================================================================
-- Study Dashboard - Supabase PostgreSQL Schema & RLS Setup Script
-- 可以在 Supabase Dashboard 的 SQL Editor 中直接貼上並執行
-- =================================================================

-- 1. Profiles 表格 (使用者個人檔案)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  current_preset_mode TEXT DEFAULT 'senior',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_preset_mode TEXT DEFAULT 'senior';

-- 2. Groups 表格 (學習群組)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Group Members 表格 (群組成員名單)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' or 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 4. Group Join Requests 表格 (群組加入申請審核)
CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 5. Subjects 表格 (學習科目)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- 個人看板用
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,   -- 群組看板用
  preset_mode TEXT DEFAULT 'senior',                             -- 預設學制模式隔離
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS preset_mode TEXT DEFAULT 'senior';

-- 6. Ranges 表格 (單元範圍)
CREATE TABLE IF NOT EXISTS public.ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Resource Links 表格 (學習資源連結)
CREATE TABLE IF NOT EXISTS public.resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  range_id UUID NOT NULL REFERENCES public.ranges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 啟用 Row Level Security (RLS) 權限防護
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- Profiles RLS Policies
-- -----------------------------------------------------------------
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------------------
-- Groups RLS Policies
-- -----------------------------------------------------------------
CREATE POLICY "Groups viewable by authenticated users"
  ON public.groups FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
  ON public.groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups"
  ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- -----------------------------------------------------------------
-- Group Members RLS Policies
-- -----------------------------------------------------------------
CREATE POLICY "Group members viewable by authenticated users"
  ON public.group_members FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert group members"
  ON public.group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Group members can delete members"
  ON public.group_members FOR DELETE USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------
-- Group Join Requests RLS Policies
-- -----------------------------------------------------------------
CREATE POLICY "Join requests viewable by authenticated users"
  ON public.group_join_requests FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create join requests"
  ON public.group_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update join requests"
  ON public.group_join_requests FOR UPDATE USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------
-- Subjects RLS Policies (個人獨立與群組成員平權編輯)
-- -----------------------------------------------------------------
CREATE POLICY "Subjects select policy"
  ON public.subjects FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Subjects insert policy"
  ON public.subjects FOR INSERT WITH CHECK (
    (user_id = auth.uid()) OR 
    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Subjects update policy"
  ON public.subjects FOR UPDATE USING (
    (user_id = auth.uid()) OR 
    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Subjects delete policy"
  ON public.subjects FOR DELETE USING (
    (user_id = auth.uid()) OR 
    (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  );

-- -----------------------------------------------------------------
-- Ranges RLS Policies
-- -----------------------------------------------------------------
CREATE POLICY "Ranges select policy"
  ON public.ranges FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subjects s 
      WHERE s.id = ranges.subject_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Ranges insert policy"
  ON public.ranges FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s 
      WHERE s.id = ranges.subject_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Ranges update policy"
  ON public.ranges FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.subjects s 
      WHERE s.id = ranges.subject_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Ranges delete policy"
  ON public.ranges FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.subjects s 
      WHERE s.id = ranges.subject_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

-- -----------------------------------------------------------------
-- Resource Links RLS Policies
-- -----------------------------------------------------------------
CREATE POLICY "Resource links select policy"
  ON public.resource_links FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ranges r 
      JOIN public.subjects s ON s.id = r.subject_id 
      WHERE r.id = resource_links.range_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Resource links insert policy"
  ON public.resource_links FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ranges r 
      JOIN public.subjects s ON s.id = r.subject_id 
      WHERE r.id = resource_links.range_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Resource links update policy"
  ON public.resource_links FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ranges r 
      JOIN public.subjects s ON s.id = r.subject_id 
      WHERE r.id = resource_links.range_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Resource links delete policy"
  ON public.resource_links FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ranges r 
      JOIN public.subjects s ON s.id = r.subject_id 
      WHERE r.id = resource_links.range_id AND (
        (s.user_id = auth.uid()) OR 
        (s.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
      )
    )
  );

-- =================================================================
-- 啟用 Supabase Realtime 即時同步廣播 (Publication)
-- =================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects, public.ranges, public.resource_links, public.group_join_requests, public.group_members;
