-- /supabase/migrations/20260503_consolidated_schema.sql
-- 1. ENUMS
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'advisor', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE deal_status AS ENUM ('draft', 'submitted', 'under_review', 'active', 'under_offer', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE nda_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE kyc_submission_status AS ENUM ('pending', 'under_review', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE file_permission_level AS ENUM ('view_only', 'download', 'edit'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE legal_doc_type AS ENUM ('nda', 'loi', 'spa'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE legal_doc_status AS ENUM ('draft', 'pending_signature', 'fully_signed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE meeting_status AS ENUM ('proposed', 'confirmed', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE meeting_format AS ENUM ('video', 'in_person'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE attendee_response AS ENUM ('pending', 'accepted', 'declined'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE message_type AS ENUM ('text', 'file', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'countered'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    country TEXT,
    role user_role DEFAULT 'buyer' NOT NULL,
    kyc_status kyc_status DEFAULT 'pending' NOT NULL,
    company_name TEXT,
    company_website TEXT,
    company_industry TEXT,
    company_description TEXT,
    founded_year INT,
    employees_count TEXT,
    tax_id TEXT,
    registration_country TEXT,
    products_services TEXT,
    target_market TEXT,
    owner_founder_percent INT,
    owner_investor_percent INT,
    owner_esop_percent INT,
    profile_visibility TEXT DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    is_2fa_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    founder_pct NUMERIC(5,2) DEFAULT 0 NOT NULL,
    investor_pct NUMERIC(5,2) DEFAULT 0 NOT NULL,
    esop_pct NUMERIC(5,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT ownership_sum_100 CHECK (founder_pct + investor_pct + esop_pct = 100)
);

CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT,
    city TEXT,
    deal_type TEXT NOT NULL,
    revenue_min NUMERIC,
    revenue_max NUMERIC,
    revenue_y1 NUMERIC,
    revenue_y2 NUMERIC,
    revenue_y3 NUMERIC,
    ebitda_min NUMERIC,
    ebitda_max NUMERIC,
    ebitda NUMERIC,
    net_profit NUMERIC,
    growth_rate NUMERIC,
    currency TEXT DEFAULT 'USD',
    valuation NUMERIC,
    valuation_min NUMERIC,
    valuation_max NUMERIC,
    equity_pct NUMERIC,
    min_ticket NUMERIC,
    description TEXT NOT NULL,
    market_position TEXT NOT NULL,
    reason TEXT,
    future_plans TEXT,
    strengths JSONB,
    ownership_structure JSONB,
    status deal_status DEFAULT 'draft' NOT NULL,
    view_count INTEGER DEFAULT 0 NOT NULL,
    trending_score INTEGER DEFAULT 0,
    flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deal_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    year TEXT NOT NULL,
    revenue NUMERIC NOT NULL,
    ebitda NUMERIC NOT NULL,
    ebitda_margin NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.nda_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status nda_status DEFAULT 'pending' NOT NULL,
    signed_name TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(deal_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS public.saved_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, deal_id)
);

CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    id_document_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    business_license_url TEXT,
    shareholder_list_url TEXT,
    status kyc_submission_status DEFAULT 'pending' NOT NULL,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dataroom_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    folder TEXT NOT NULL DEFAULT 'General',
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    size BIGINT NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dataroom_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES public.dataroom_files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission_level file_permission_level DEFAULT 'view_only' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(file_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.dataroom_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES public.dataroom_files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_profile_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    doc_type legal_doc_type NOT NULL,
    template_data JSONB,
    pdf_url TEXT,
    signed_pdf_url TEXT,
    status legal_doc_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    signer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    signer_name TEXT NOT NULL,
    signer_role TEXT NOT NULL,
    ip_address TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    proposer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_mins INT NOT NULL,
    format meeting_format DEFAULT 'video' NOT NULL,
    google_meet_link TEXT,
    calendar_event_id TEXT,
    status meeting_status DEFAULT 'proposed' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    response attendee_response DEFAULT 'pending' NOT NULL,
    UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    msg_type message_type DEFAULT 'text' NOT NULL,
    file_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    submitter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    valuation NUMERIC NOT NULL,
    equity_pct NUMERIC NOT NULL,
    conditions TEXT,
    message TEXT,
    status offer_status DEFAULT 'pending' NOT NULL,
    parent_offer_id UUID REFERENCES public.offers(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('dataroom', 'dataroom', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('deal_documents', 'deal_documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-documents', 'legal-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_files', 'chat_files', false) ON CONFLICT DO NOTHING;

-- 4. ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nda_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataroom_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataroom_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataroom_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. REALTIME PUBLICATIONS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 6. VIEWS AND FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'buyer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_deal_view(deal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.deals SET view_count = view_count + 1 WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.recalculate_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.deals d
  SET trending_score = (
    (SELECT COUNT(*) * 3 FROM public.dataroom_activity a WHERE a.deal_id = d.id AND a.created_at > now() - interval '24 hours') +
    (SELECT COUNT(*) * 10 FROM public.nda_requests n WHERE n.deal_id = d.id AND n.created_at > now() - interval '48 hours') +
    (SELECT COUNT(*) * 5 FROM public.saved_deals s WHERE s.deal_id = d.id AND s.created_at > now() - interval '72 hours')
  )
  WHERE d.status = 'active'; -- FIX 3: Changed 'published' to 'active'
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP VIEW IF EXISTS public.offer_metadata;
CREATE VIEW public.offer_metadata AS
SELECT id, deal_id, submitter_id, status, parent_offer_id, created_at
FROM public.offers;

NOTIFY pgrst, reload_schema;
