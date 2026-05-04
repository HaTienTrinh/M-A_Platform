-- /supabase/migrations/20260504_add_missing_columns.sql
-- Migration to add missing columns identified in Phase A analysis

-- Add ai_summary to deals table
-- Referenced in: /app/api/ai/summary/route.ts
-- Purpose: Store AI-generated deal summaries (3 paragraphs: thesis/financials/risk)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add mentioned_user_ids to messages table  
-- Referenced in: /components/negotiate/ChatThread.tsx
-- Purpose: Track which users were @mentioned in chat messages for notifications
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[];

-- Add trending_score to deals if not exists (should already exist from consolidated schema)
-- Purpose: Calculate trending deals based on recent activity
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS trending_score INTEGER NOT NULL DEFAULT 0;

-- Add featured flag to deals if not exists
-- Purpose: Allow admins to feature specific deals on homepage
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Create index on ai_summary for faster full-text search (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_deals_ai_summary_gin ON public.deals USING gin(to_tsvector('english', ai_summary));

-- Create index on mentioned_user_ids for faster notification queries
CREATE INDEX IF NOT EXISTS idx_messages_mentioned_user_ids ON public.messages USING gin(mentioned_user_ids);

-- Create index on featured deals for homepage queries
CREATE INDEX IF NOT EXISTS idx_deals_featured ON public.deals(featured) WHERE featured = true;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- REMINDER: Add to .env.local (not SQL, manual action required):
-- ============================================================================
-- NEXT_PUBLIC_APP_URL=http://localhost:3000
-- (or your production URL: https://your-domain.com)
