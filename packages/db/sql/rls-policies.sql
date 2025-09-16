-- TENANTS RLS POLICIES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can only view their own tenant
DROP POLICY IF EXISTS "Everyone can only view their own tenant" ON tenants;
CREATE POLICY "Everyone can only view their own tenant" ON tenants 
FOR SELECT 
USING (id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1));

-- RLS Policy: Only admins can edit their own tenant
DROP POLICY IF EXISTS "Only admins can edit their own tenant" ON tenants;
CREATE POLICY "Only admins can edit their own tenant" ON tenants
FOR UPDATE
USING (
  id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1)
  AND COALESCE(current_setting('auth.role', TRUE), '') = 'admin'
)
WITH CHECK (
  id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1)
  AND COALESCE(current_setting('auth.role', TRUE), '') = 'admin'
);

-- RLS Policy: Only admins can delete their own tenant
DROP POLICY IF EXISTS "Only admins can delete their own tenant" ON tenants;
CREATE POLICY "Only admins can delete their own tenant" ON tenants
FOR DELETE
USING (
  id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1)
  AND COALESCE(current_setting('auth.role', TRUE), '') = 'admin'
);

-- USERS RLS POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can only view users in their own tenant
DROP POLICY IF EXISTS "Everyone can only view users in their own tenant" ON users;
CREATE POLICY "Everyone can only view users in their own tenant" ON users
FOR SELECT
USING (tenant_id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1));
