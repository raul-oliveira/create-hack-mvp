-- Church Leader Assistant Database Schema
-- Generated from Prisma schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    inchurch_api_key VARCHAR(255),
    inchurch_secret VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaders table
CREATE TABLE leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supabase_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    inchurch_member_id VARCHAR(255),
    tone_config JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, supabase_user_id)
);

-- People table (Liderados)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
    inchurch_member_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255),
    birth_date DATE,
    marital_status VARCHAR(50),
    address JSONB,
    profile_data JSONB DEFAULT '{}',
    sync_source VARCHAR(50) DEFAULT 'manual',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, inchurch_member_id)
);

-- People changes table (Change Detection)
CREATE TABLE people_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    change_type VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    urgency_score INTEGER,
    ai_analysis JSONB
);

-- Initiatives table
CREATE TABLE initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    change_id UUID REFERENCES people_changes(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    suggested_message TEXT,
    edited_message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    whatsapp_clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initiative feedback table
CREATE TABLE initiative_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL UNIQUE REFERENCES initiatives(id) ON DELETE CASCADE,
    outcome VARCHAR(100) NOT NULL,
    notes TEXT,
    response_received BOOLEAN DEFAULT false,
    follow_up_needed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs table
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_people_leader_org ON people(leader_id, organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_initiatives_status_leader ON initiatives(status, leader_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_initiatives_due_date ON initiatives(due_date) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_people_changes_processed ON people_changes(processed_at, person_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_logs_org_date ON sync_logs(organization_id, started_at DESC);

-- Partial index for pending initiatives
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_initiatives 
  ON initiatives(leader_id, created_at DESC) 
  WHERE status = 'pending';

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Organizations - Admin only for now
CREATE POLICY "Organizations access" ON organizations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Leaders can access their own data
CREATE POLICY "Leaders can access their own data" ON leaders
  FOR ALL USING (supabase_user_id = auth.uid());

-- People access restricted to assigned leader within organization
CREATE POLICY "Leaders can access their people" ON people
  FOR ALL USING (
    leader_id IN (
      SELECT id FROM leaders WHERE supabase_user_id = auth.uid()
    )
  );

-- People changes follow people access
CREATE POLICY "Leaders can access people changes" ON people_changes
  FOR ALL USING (
    person_id IN (
      SELECT p.id FROM people p
      JOIN leaders l ON p.leader_id = l.id
      WHERE l.supabase_user_id = auth.uid()
    )
  );

-- Initiatives access restricted to assigned leader
CREATE POLICY "Leaders can access their initiatives" ON initiatives
  FOR ALL USING (
    leader_id IN (
      SELECT id FROM leaders WHERE supabase_user_id = auth.uid()
    )
  );

-- Initiative feedback follows initiatives access
CREATE POLICY "Leaders can access initiative feedback" ON initiative_feedback
  FOR ALL USING (
    initiative_id IN (
      SELECT i.id FROM initiatives i
      JOIN leaders l ON i.leader_id = l.id
      WHERE l.supabase_user_id = auth.uid()
    )
  );

-- Sync logs restricted to organization
CREATE POLICY "Leaders can access sync logs" ON sync_logs
  FOR ALL USING (
    organization_id IN (
      SELECT l.organization_id FROM leaders l
      WHERE l.supabase_user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaders_updated_at BEFORE UPDATE ON leaders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON initiatives 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();