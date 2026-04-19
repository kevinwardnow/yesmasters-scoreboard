-- ============================================================
-- YesMasters Scoreboard — New Tables for Marketing Feature
-- Run this in: https://supabase.com/dashboard/project/gtooleybynljnszietom/sql/new
-- ============================================================

-- Goals table (stores annual goals per agent)
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scoreboard_id UUID REFERENCES scoreboards(id) ON DELETE CASCADE UNIQUE,
  pro_days INTEGER DEFAULT 200,
  hours_practiced INTEGER DEFAULT 200,
  hours_prospected INTEGER DEFAULT 400,
  quality_conversations INTEGER DEFAULT 800,
  added_to_pc INTEGER DEFAULT 200,
  new_leads INTEGER DEFAULT 100,
  open_house_events INTEGER DEFAULT 20,
  listing_appts_set INTEGER DEFAULT 100,
  listing_appts_held INTEGER DEFAULT 80,
  listings_taken INTEGER DEFAULT 50,
  listings_sold INTEGER DEFAULT 45,
  buyer_rep INTEGER DEFAULT 30,
  buyer_sales INTEGER DEFAULT 25,
  earned_income DECIMAL(10,2) DEFAULT 200000,
  sales_closed INTEGER DEFAULT 30,
  paid_income DECIMAL(10,2) DEFAULT 180000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing entries (monthly ad performance data)
CREATE TABLE IF NOT EXISTS marketing_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scoreboard_id UUID REFERENCES scoreboards(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  ad_spend DECIMAL(10,2) DEFAULT 0,
  total_optins INTEGER DEFAULT 0,
  conversations INTEGER DEFAULT 0,
  agreements_signed INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  gci_from_ads DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scoreboard_id, month)
);

-- Marketing settings (coach enables/disables per agent)
CREATE TABLE IF NOT EXISTS marketing_settings (
  scoreboard_id UUID REFERENCES scoreboards(id) ON DELETE CASCADE PRIMARY KEY,
  enabled BOOLEAN DEFAULT FALSE,
  enabled_by UUID REFERENCES profiles(id),
  enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RLS Policies — Goals
-- ============================================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Agents can read/write their own goals
CREATE POLICY "agents_manage_own_goals" ON goals
  USING (
    scoreboard_id IN (
      SELECT id FROM scoreboards WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    scoreboard_id IN (
      SELECT id FROM scoreboards WHERE profile_id = auth.uid()
    )
  );

-- Coaches can read all goals
CREATE POLICY "coaches_read_all_goals" ON goals
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

-- ============================================================
-- RLS Policies — Marketing Entries
-- ============================================================
ALTER TABLE marketing_entries ENABLE ROW LEVEL SECURITY;

-- Agents can read/write their own marketing entries
CREATE POLICY "agents_manage_own_marketing" ON marketing_entries
  USING (
    scoreboard_id IN (
      SELECT id FROM scoreboards WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    scoreboard_id IN (
      SELECT id FROM scoreboards WHERE profile_id = auth.uid()
    )
  );

-- Coaches can read all marketing entries
CREATE POLICY "coaches_read_all_marketing" ON marketing_entries
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

-- ============================================================
-- RLS Policies — Marketing Settings
-- ============================================================
ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;

-- Agents can read their own settings
CREATE POLICY "agents_read_own_marketing_settings" ON marketing_settings
  FOR SELECT
  USING (
    scoreboard_id IN (
      SELECT id FROM scoreboards WHERE profile_id = auth.uid()
    )
  );

-- Coaches can read and write all marketing settings
CREATE POLICY "coaches_manage_all_marketing_settings" ON marketing_settings
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );
