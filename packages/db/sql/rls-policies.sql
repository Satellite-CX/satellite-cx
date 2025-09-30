-- ==============================================
-- BASIC ORGANIZATION ISOLATION RLS POLICIES
-- ==============================================

-- Enable RLS on all tables that need organization isolation
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE status ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- ORGANIZATION ISOLATION POLICIES
-- ==============================================

-- Organizations: Users can only access organizations they belong to
-- Note: This policy allows users to see organizations they belong to
DROP POLICY IF EXISTS "Organization isolation" ON organizations;
CREATE POLICY "Organization isolation" ON organizations
FOR ALL
USING (
  id IN (
    SELECT organization_id
    FROM members
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Members: Users can only access members of their organizations
-- Note: This policy allows users to see all members in organizations they belong to
-- We use auth.organization_id context to avoid circular dependency
DROP POLICY IF EXISTS "Organization isolation" ON members;
CREATE POLICY "Organization isolation" ON members
FOR ALL
USING (
  organization_id = COALESCE(current_setting('auth.organization_id', TRUE), '')
);

-- Teams: Users can only access teams in their organizations
DROP POLICY IF EXISTS "Organization isolation" ON teams;
CREATE POLICY "Organization isolation" ON teams
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Team Members: Users can only access team members in their organizations
DROP POLICY IF EXISTS "Organization isolation" ON team_members;
CREATE POLICY "Organization isolation" ON team_members
FOR ALL
USING (
  team_id IN (
    SELECT t.id 
    FROM teams t
    JOIN members m ON t.organization_id = m.organization_id
    WHERE m.user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Invitations: Users can only access invitations for their organizations
DROP POLICY IF EXISTS "Organization isolation" ON invitations;
CREATE POLICY "Organization isolation" ON invitations
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Organization Roles: Users can only access roles for their organizations
DROP POLICY IF EXISTS "Organization isolation" ON organization_roles;
CREATE POLICY "Organization isolation" ON organization_roles
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Customer: Users can only access customers from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON customer;
CREATE POLICY "Organization isolation" ON customer
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Ticket: Users can only access tickets from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON ticket;
CREATE POLICY "Organization isolation" ON ticket
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Ticket Audit: Users can only access ticket audits from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON ticket_audit;
CREATE POLICY "Organization isolation" ON ticket_audit
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Comment: Users can only access comments from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON comment;
CREATE POLICY "Organization isolation" ON comment
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Attachment: Users can only access attachments from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON attachment;
CREATE POLICY "Organization isolation" ON attachment
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Tag: Users can only access tags from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON tag;
CREATE POLICY "Organization isolation" ON tag
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Ticket Tag: Users can only access ticket tags from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON ticket_tag;
CREATE POLICY "Organization isolation" ON ticket_tag
FOR ALL
USING (
  ticket_id IN (
    SELECT t.id 
    FROM ticket t
    JOIN members m ON t.organization_id = m.organization_id
    WHERE m.user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Status: Users can only access statuses from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON status;
CREATE POLICY "Organization isolation" ON status
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);

-- Priority: Users can only access priorities from their organizations
DROP POLICY IF EXISTS "Organization isolation" ON priority;
CREATE POLICY "Organization isolation" ON priority
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = COALESCE(current_setting('auth.user_id', TRUE), '')
  )
);
