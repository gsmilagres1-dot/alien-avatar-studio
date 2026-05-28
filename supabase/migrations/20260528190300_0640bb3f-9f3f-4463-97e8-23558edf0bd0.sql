-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Payment transactions (1 credit per paid R$2.99)
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'brl',
  status TEXT NOT NULL DEFAULT 'pending',
  credits_granted INTEGER NOT NULL DEFAULT 1,
  credits_remaining INTEGER NOT NULL DEFAULT 1,
  env TEXT NOT NULL DEFAULT 'sandbox',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pay select" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
-- writes happen via webhook (service_role) and server fns (service_role); no client INSERT/UPDATE policies

-- Identities (final saved)
CREATE TABLE public.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  human_name TEXT NOT NULL,
  birthdate DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male','female','undefined')),
  planet_id TEXT NOT NULL,
  ship_category TEXT CHECK (ship_category IN ('esportiva','offroad','corrida')),
  alien_name TEXT NOT NULL,
  species TEXT NOT NULL,
  id_number TEXT NOT NULL,
  rank TEXT NOT NULL,
  license_class TEXT NOT NULL,
  galactic_birth TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  ship_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identities TO authenticated;
GRANT ALL ON public.identities TO service_role;
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own id select" ON public.identities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own id insert" ON public.identities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own id update" ON public.identities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own id delete" ON public.identities FOR DELETE USING (auth.uid() = user_id);

-- Avatar drafts (up to 3 per payment)
CREATE TABLE public.avatar_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  avatar_url TEXT NOT NULL,
  variant_index INTEGER NOT NULL DEFAULT 1,
  prompt_seed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avatar_drafts TO authenticated;
GRANT ALL ON public.avatar_drafts TO service_role;
ALTER TABLE public.avatar_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own drafts select" ON public.avatar_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own drafts insert" ON public.avatar_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own drafts delete" ON public.avatar_drafts FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_identities_updated BEFORE UPDATE ON public.identities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('alien-avatars','alien-avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'alien-avatars');
CREATE POLICY "avatars user upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='alien-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars user update" ON storage.objects FOR UPDATE USING (bucket_id='alien-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars user delete" ON storage.objects FOR DELETE USING (bucket_id='alien-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);