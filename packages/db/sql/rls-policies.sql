-- Enable Row Level Security on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can only view their own tenants" ON tenants;

-- Create RLS policy for tenants table
CREATE POLICY "Users can only view their own tenants" ON tenants 
FOR SELECT 
USING (id = COALESCE(current_setting('auth.tenant_id', TRUE)::integer, -1));