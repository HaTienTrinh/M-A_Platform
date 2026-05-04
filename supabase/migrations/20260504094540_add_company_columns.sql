-- Since the companies table does not exist, we create it from scratch with all the correct columns

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  registration_country TEXT,
  founded_year INT,
  industry TEXT,
  products_services TEXT,
  target_market TEXT,
  employees_count TEXT,
  owner_founder_percent INT DEFAULT 0 NOT NULL,
  owner_investor_percent INT DEFAULT 0 NOT NULL,
  owner_esop_percent INT DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'active',
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT ownership_sum_100 CHECK (owner_founder_percent + owner_investor_percent + owner_esop_percent = 100)
);

CREATE TABLE IF NOT EXISTS public.company_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  version INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_versions ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY "Users can insert their own company" 
ON public.companies FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company" 
ON public.companies FOR UPDATE TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all companies" 
ON public.companies FOR SELECT TO authenticated 
USING (true);

-- Policies for company_versions
CREATE POLICY "Users can insert their own company versions" 
ON public.company_versions FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own company versions" 
ON public.company_versions FOR SELECT TO authenticated 
USING (auth.uid() = user_id);
