# Database Schema Tests

This directory contains comprehensive tests for the database schema, focusing on the organization plugin functionality from Better Auth.

## Test Structure

### Core Test Files

- **`organization.test.ts`** - Tests for organization CRUD operations, member management, invitation workflows, team operations, and organization roles
- **`constraints.test.ts`** - Tests for database constraints, foreign key relationships, unique constraints, cascade delete behavior, and required field validation
- **`rls.test.ts`** - Tests for Row Level Security (RLS) policies, role-based access control, and data isolation between organizations
- **`workflow.test.ts`** - End-to-end workflow tests covering complete organization lifecycle scenarios

### Supporting Files

- **`setup.ts`** - Global test setup and teardown configuration
- **`test.config.ts`** - Test configuration and environment variable validation
- **`README.md`** - This documentation file

## Test Coverage

### Organization Management
- ✅ Organization CRUD operations
- ✅ Organization metadata handling
- ✅ Organization slug uniqueness validation

### Member Management
- ✅ Adding members to organizations
- ✅ Removing members from organizations
- ✅ Updating member roles (owner, admin, member)
- ✅ Listing organization members
- ✅ Member role validation

### Invitation System
- ✅ Creating invitations for new users
- ✅ Accepting invitations (creates new member)
- ✅ Rejecting invitations
- ✅ Canceling invitations
- ✅ Invitation expiration handling
- ✅ Invitation status tracking

### Team Management
- ✅ Creating teams within organizations
- ✅ Updating team information
- ✅ Deleting teams
- ✅ Adding members to teams
- ✅ Removing members from teams
- ✅ Listing team members

### Organization Roles & Permissions
- ✅ Creating custom organization roles
- ✅ Updating role permissions
- ✅ Deleting organization roles
- ✅ Listing organization roles
- ✅ Permission validation

### Database Constraints
- ✅ Foreign key constraint enforcement
- ✅ Unique constraint validation
- ✅ Required field validation
- ✅ Default value assignment
- ✅ Cascade delete behavior

### Row Level Security (RLS)
- ✅ Admin role access control
- ✅ Member role access control
- ✅ Owner role access control
- ✅ Organization data isolation
- ✅ RLS transaction behavior
- ✅ No active organization scenarios

### Complete Workflows
- ✅ Organization creation and setup
- ✅ Member invitation and onboarding
- ✅ Team creation and management
- ✅ Role assignment and updates
- ✅ Session management with active organization/team
- ✅ Complete organization lifecycle

## Running Tests

### Prerequisites

1. Ensure your database is running and accessible
2. Set up the required environment variables in `.env`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/database
   RLS_CLIENT_DATABASE_URL=postgresql://user:password@localhost:5432/database
   ENABLE_RLS=true
   ```

### Running All Tests

```bash
# Run all tests using pnpm workspace filter (recommended)
pnpm run test --filter @repo/db

# Run tests directly with bun
bun test

# Run tests with verbose output
bun test --verbose

# Run tests with coverage
bun test --coverage

# Use the test runner script with pnpm workspace
bun run scripts/run-tests.ts --pnpm

# Use the test runner script directly
bun run scripts/run-tests.ts
```

### Running Specific Test Files

```bash
# Run organization tests only
bun test organization.test.ts

# Run constraint tests only
bun test constraints.test.ts

# Run RLS tests only
bun test rls.test.ts

# Run workflow tests only
bun test workflow.test.ts
```

### Running Specific Test Suites

```bash
# Run only organization CRUD tests
bun test --grep "Organization CRUD Operations"

# Run only member management tests
bun test --grep "Member Operations"

# Run only invitation workflow tests
bun test --grep "Invitation Workflow"

# Run only RLS tests
bun test --grep "Row Level Security"
```

## Test Data Management

### Automatic Cleanup

All tests include automatic cleanup of test data:
- Each test creates its own test data with unique IDs
- Test data is cleaned up after each test
- Global setup/teardown ensures clean database state

### Test Isolation

- Tests run sequentially to avoid database conflicts
- Each test uses unique identifiers (nanoid)
- No shared test data between tests
- Proper foreign key constraint testing

## Database Schema Validation

The tests validate the following schema components:

### Tables
- `users` - User accounts and authentication
- `organizations` - Organization entities
- `members` - Organization membership
- `invitations` - Pending organization invitations
- `teams` - Teams within organizations
- `team_members` - Team membership
- `organization_roles` - Custom organization roles
- `sessions` - User sessions with active organization/team

### Relationships
- User → Members (one-to-many)
- Organization → Members (one-to-many)
- Organization → Teams (one-to-many)
- Team → Team Members (one-to-many)
- Organization → Invitations (one-to-many)
- Organization → Organization Roles (one-to-many)
- User → Sessions (one-to-many)

### Constraints
- Foreign key constraints with cascade delete
- Unique constraints on email, slug, token
- Required field constraints
- Default value assignments

## RLS Policy Testing

The RLS tests verify that:
- Users can only access data from their active organization
- Role-based permissions are enforced
- Data isolation between organizations is maintained
- Transaction context preserves RLS settings
- Proper error handling for unauthorized access

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Include setup and teardown for each test
- Clean up test data after each test

### Error Handling
- Test both success and failure scenarios
- Validate error messages and types
- Test constraint violations
- Test RLS policy enforcement

### Performance
- Use efficient database queries
- Minimize test data creation
- Clean up resources promptly
- Avoid unnecessary database operations

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Ensure database is running
   - Check network connectivity

2. **RLS Policy Errors**
   - Verify RLS is enabled in database
   - Check RLS_CLIENT_DATABASE_URL
   - Ensure RLS policies are applied

3. **Test Data Conflicts**
   - Tests should use unique identifiers
   - Clean up test data after each test
   - Run tests sequentially

4. **Permission Errors**
   - Verify database user has required permissions
   - Check RLS user configuration
   - Ensure proper role assignments

### Debug Mode

Run tests with debug output:
```bash
bun test --verbose --reporter=verbose
```

### Database State Inspection

If tests fail, you can inspect the database state:
```sql
-- Check organization data
SELECT * FROM organizations;

-- Check member data
SELECT * FROM members;

-- Check invitation data
SELECT * FROM invitations;

-- Check team data
SELECT * FROM teams;

-- Check RLS policies
SELECT * FROM pg_policies;
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include proper setup and teardown
3. Use descriptive test names
4. Add appropriate assertions
5. Clean up test data
6. Update this README if needed

## Test Maintenance

- Review tests when schema changes
- Update tests when adding new features
- Ensure tests cover edge cases
- Maintain test performance
- Keep tests readable and maintainable
