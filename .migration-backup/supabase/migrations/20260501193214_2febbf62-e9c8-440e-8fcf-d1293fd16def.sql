-- Roles enum + table (separate from profiles for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  mood_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_cover TEXT,
  mood TEXT,
  emoji TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.buddy_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_cover TEXT,
  total_pages INT NOT NULL DEFAULT 300,
  spoiler_page INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.buddy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buddy_read_id UUID NOT NULL REFERENCES public.buddy_reads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_page INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buddy_read_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_members ENABLE ROW LEVEL SECURITY;

-- Security definer role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- profiles: any authenticated user can view, only owner can write
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_roles: users can view their own roles only
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- activity: any signed-in user can read; owner can insert/delete
CREATE POLICY "Activity viewable by authenticated"
  ON public.activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own activity"
  ON public.activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own activity"
  ON public.activity FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- buddy_reads: owner full control; members can view
CREATE POLICY "Buddy reads viewable by members"
  ON public.buddy_reads FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.buddy_members m WHERE m.buddy_read_id = buddy_reads.id AND m.user_id = auth.uid())
  );
CREATE POLICY "Users create own buddy reads"
  ON public.buddy_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates buddy read"
  ON public.buddy_reads FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner deletes buddy read"
  ON public.buddy_reads FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- buddy_members: members can view co-members in same room; users manage own membership
CREATE POLICY "Members view co-members"
  ON public.buddy_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.buddy_members m2 WHERE m2.buddy_read_id = buddy_members.buddy_read_id AND m2.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.buddy_reads r WHERE r.id = buddy_members.buddy_read_id AND r.owner_id = auth.uid())
  );
CREATE POLICY "Users join as self"
  ON public.buddy_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress"
  ON public.buddy_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users leave own membership"
  ON public.buddy_members FOR DELETE TO authenticated USING (auth.uid() = user_id);