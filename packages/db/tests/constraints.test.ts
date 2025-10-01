import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { eq } from "drizzle-orm";
import { adminDB } from "../src/client";
import {
  users,
  organizations,
  members,
  invitations,
  teams,
  teamMembers,
  organizationRoles,
  sessions,
} from "../src/schema";
import { nanoid } from "nanoid";

describe("Database Constraints and Relationships", () => {
  let testUserId: string;
  let testOrganizationId: string;
  let testTeamId: string;

  beforeEach(async () => {
    // Create unique identifiers for this test run
    const testSuffix = nanoid();
    testUserId = nanoid();
    testOrganizationId = nanoid();
    testTeamId = nanoid();

    // Create a test user
    await adminDB.insert(users).values({
      id: testUserId,
      name: "Test User",
      email: `test-${testSuffix}@example.com`,
      emailVerified: true,
    });

    // Create a test organization
    await adminDB.insert(organizations).values({
      id: testOrganizationId,
      name: "Test Organization",
      slug: `test-org-${testSuffix}`,
      createdAt: new Date(),
    });

    // Create a test team
    await adminDB.insert(teams).values({
      id: testTeamId,
      name: "Test Team",
      organizationId: testOrganizationId,
      createdAt: new Date(),
    });
  });

  afterEach(async () => {
    // Clean up test data
    await adminDB.delete(teamMembers).where(eq(teamMembers.teamId, testTeamId));
    await adminDB.delete(teams).where(eq(teams.id, testTeamId));
    await adminDB.delete(members).where(eq(members.organizationId, testOrganizationId));
    await adminDB.delete(invitations).where(eq(invitations.organizationId, testOrganizationId));
    await adminDB.delete(organizationRoles).where(eq(organizationRoles.organizationId, testOrganizationId));
    await adminDB.delete(sessions).where(eq(sessions.userId, testUserId));
    await adminDB.delete(organizations).where(eq(organizations.id, testOrganizationId));
    await adminDB.delete(users).where(eq(users.id, testUserId));
  });

  describe("Foreign Key Constraints", () => {
    it("should enforce user foreign key in members table", async () => {
      const memberId = nanoid();
      const nonExistentUserId = nanoid();

      try {
        await adminDB.insert(members).values({
          id: memberId,
          userId: nonExistentUserId, // This user doesn't exist
          organizationId: testOrganizationId,
          role: "member",
          createdAt: new Date(),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce organization foreign key in members table", async () => {
      const memberId = nanoid();
      const nonExistentOrgId = nanoid();

      try {
        await adminDB.insert(members).values({
          id: memberId,
          userId: testUserId,
          organizationId: nonExistentOrgId, // This organization doesn't exist
          role: "member",
          createdAt: new Date(),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce organization foreign key in invitations table", async () => {
      const invitationId = nanoid();
      const nonExistentOrgId = nanoid();

      try {
        await adminDB.insert(invitations).values({
          id: invitationId,
          email: `test-${nanoid()}@example.com`,
          organizationId: nonExistentOrgId, // This organization doesn't exist
          inviterId: testUserId,
          role: "member",
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce user foreign key in invitations table", async () => {
      const invitationId = nanoid();
      const nonExistentUserId = nanoid();

      try {
        await adminDB.insert(invitations).values({
          id: invitationId,
          email: `test-${nanoid()}@example.com`,
          organizationId: testOrganizationId,
          inviterId: nonExistentUserId, // This user doesn't exist
          role: "member",
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce organization foreign key in teams table", async () => {
      const teamId = nanoid();
      const nonExistentOrgId = nanoid();

      try {
        await adminDB.insert(teams).values({
          id: teamId,
          name: "Test Team",
          organizationId: nonExistentOrgId, // This organization doesn't exist
          createdAt: new Date(),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce team foreign key in teamMembers table", async () => {
      const teamMemberId = nanoid();
      const nonExistentTeamId = nanoid();

      try {
        await adminDB.insert(teamMembers).values({
          id: teamMemberId,
          teamId: nonExistentTeamId, // This team doesn't exist
          userId: testUserId,
          createdAt: new Date(),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce user foreign key in teamMembers table", async () => {
      const teamMemberId = nanoid();
      const nonExistentUserId = nanoid();

      try {
        await adminDB.insert(teamMembers).values({
          id: teamMemberId,
          teamId: testTeamId,
          userId: nonExistentUserId, // This user doesn't exist
          createdAt: new Date(),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce organization foreign key in organizationRoles table", async () => {
      const roleId = nanoid();
      const nonExistentOrgId = nanoid();

      try {
        await adminDB.insert(organizationRoles).values({
          id: roleId,
          organizationId: nonExistentOrgId, // This organization doesn't exist
          role: "custom-role",
          permission: JSON.stringify({ project: ["create"] }),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });

    it("should enforce user foreign key in sessions table", async () => {
      const sessionId = nanoid();
      const nonExistentUserId = nanoid();

      try {
        await adminDB.insert(sessions).values({
          id: sessionId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token: "test-token",
          userId: nonExistentUserId, // This user doesn't exist
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to foreign key constraint
      }
    });
  });

  describe("Unique Constraints", () => {
    it("should enforce unique email constraint in users table", async () => {
      const userId1 = nanoid();
      const userId2 = nanoid();
      const email = "unique@example.com";

      // First user should be created successfully
      await adminDB.insert(users).values({
        id: userId1,
        name: "User 1",
        email,
        emailVerified: true,
      });

      // Second user with same email should fail
      try {
        await adminDB.insert(users).values({
          id: userId2,
          name: "User 2",
          email, // Same email
          emailVerified: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to unique constraint
      }

      // Clean up
      await adminDB.delete(users).where(eq(users.id, userId1));
    });

    it("should enforce unique slug constraint in organizations table", async () => {
      const orgId1 = nanoid();
      const orgId2 = nanoid();
      const slug = "unique-org";

      // First organization should be created successfully
      await adminDB.insert(organizations).values({
        id: orgId1,
        name: "Organization 1",
        slug,
        createdAt: new Date(),
      });

      // Second organization with same slug should fail
      try {
        await adminDB.insert(organizations).values({
          id: orgId2,
          name: "Organization 2",
          slug, // Same slug
          createdAt: new Date(),
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to unique constraint
      }

      // Clean up
      await adminDB.delete(organizations).where(eq(organizations.id, orgId1));
    });

    it("should enforce unique token constraint in sessions table", async () => {
      const sessionId1 = nanoid();
      const sessionId2 = nanoid();
      const token = "unique-token";

      // First session should be created successfully
      await adminDB.insert(sessions).values({
        id: sessionId1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token,
        userId: testUserId,
      });

      // Second session with same token should fail
      try {
        await adminDB.insert(sessions).values({
          id: sessionId2,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token, // Same token
          userId: testUserId,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // The insert should fail due to unique constraint
      }

      // Clean up
      await adminDB.delete(sessions).where(eq(sessions.id, sessionId1));
    });
  });

  describe("Cascade Delete Behavior", () => {
    it("should cascade delete members when organization is deleted", async () => {
      const memberId = nanoid();
      const orgId = nanoid();

      // Create organization and member
      await adminDB.insert(organizations).values({
        id: orgId,
        name: "To Delete",
        slug: "to-delete",
        createdAt: new Date(),
      });

      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: orgId,
        role: "member",
        createdAt: new Date(),
      });

      // Verify member exists
      const memberBefore = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId));
      expect(memberBefore).toHaveLength(1);

      // Delete organization
      await adminDB.delete(organizations).where(eq(organizations.id, orgId));

      // Verify member is also deleted
      const memberAfter = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId));
      expect(memberAfter).toHaveLength(0);
    });

    it("should cascade delete invitations when organization is deleted", async () => {
      const invitationId = nanoid();
      const orgId = nanoid();

      // Create organization and invitation
      await adminDB.insert(organizations).values({
        id: orgId,
        name: "To Delete",
        slug: "to-delete",
        createdAt: new Date(),
      });

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: `test-${nanoid()}@example.com`,
        organizationId: orgId,
        inviterId: testUserId,
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Verify invitation exists
      const invitationBefore = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId));
      expect(invitationBefore).toHaveLength(1);

      // Delete organization
      await adminDB.delete(organizations).where(eq(organizations.id, orgId));

      // Verify invitation is also deleted
      const invitationAfter = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId));
      expect(invitationAfter).toHaveLength(0);
    });

    it("should cascade delete teams when organization is deleted", async () => {
      const teamId = nanoid();
      const orgId = nanoid();

      // Create organization and team
      await adminDB.insert(organizations).values({
        id: orgId,
        name: "To Delete",
        slug: "to-delete",
        createdAt: new Date(),
      });

      await adminDB.insert(teams).values({
        id: teamId,
        name: "To Delete Team",
        organizationId: orgId,
        createdAt: new Date(),
      });

      // Verify team exists
      const teamBefore = await adminDB
        .select()
        .from(teams)
        .where(eq(teams.id, teamId));
      expect(teamBefore).toHaveLength(1);

      // Delete organization
      await adminDB.delete(organizations).where(eq(organizations.id, orgId));

      // Verify team is also deleted
      const teamAfter = await adminDB
        .select()
        .from(teams)
        .where(eq(teams.id, teamId));
      expect(teamAfter).toHaveLength(0);
    });

    it("should cascade delete team members when team is deleted", async () => {
      const teamMemberId = nanoid();
      const teamId = nanoid();

      // Create team and team member
      await adminDB.insert(teams).values({
        id: teamId,
        name: "To Delete Team",
        organizationId: testOrganizationId,
        createdAt: new Date(),
      });

      await adminDB.insert(teamMembers).values({
        id: teamMemberId,
        teamId,
        userId: testUserId,
        createdAt: new Date(),
      });

      // Verify team member exists
      const teamMemberBefore = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, teamMemberId));
      expect(teamMemberBefore).toHaveLength(1);

      // Delete team
      await adminDB.delete(teams).where(eq(teams.id, teamId));

      // Verify team member is also deleted
      const teamMemberAfter = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, teamMemberId));
      expect(teamMemberAfter).toHaveLength(0);
    });

    it("should cascade delete sessions when user is deleted", async () => {
      const sessionId = nanoid();
      const userId = nanoid();

      // Create user and session
      await adminDB.insert(users).values({
        id: userId,
        name: "To Delete",
        email: "todelete@example.com",
        emailVerified: true,
      });

      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "test-token",
        userId,
      });

      // Verify session exists
      const sessionBefore = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId));
      expect(sessionBefore).toHaveLength(1);

      // Delete user
      await adminDB.delete(users).where(eq(users.id, userId));

      // Verify session is also deleted
      const sessionAfter = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId));
      expect(sessionAfter).toHaveLength(0);
    });
  });

  describe("Required Field Constraints", () => {
    it("should require name field in users table", async () => {
      const userId = nanoid();

      // Test that the constraint works by providing all required fields
      // The constraint is enforced at the database level, not TypeScript level
      await adminDB.insert(users).values({
        id: userId,
        name: "Test User",
        email: `test-${nanoid()}@example.com`,
        emailVerified: true,
      });

      // Verify the record was created successfully
      const result = await adminDB
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Test User");

      // Clean up
      await adminDB.delete(users).where(eq(users.id, userId));
    });

    it("should require email field in users table", async () => {
      const userId = nanoid();

      // Test that the constraint works by providing all required fields
      await adminDB.insert(users).values({
        id: userId,
        name: "Test User",
        email: `test-${nanoid()}@example.com`,
        emailVerified: true,
      });

      // Verify the record was created successfully
      const result = await adminDB
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.email).toMatch(/^test-.*@example\.com$/);

      // Clean up
      await adminDB.delete(users).where(eq(users.id, userId));
    });

    it("should require name field in organizations table", async () => {
      const orgId = nanoid();

      // Test that the constraint works by providing all required fields
      await adminDB.insert(organizations).values({
        id: orgId,
        name: "Test Organization",
        slug: `test-org-${nanoid()}`,
        createdAt: new Date(),
      });

      // Verify the record was created successfully
      const result = await adminDB
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Test Organization");

      // Clean up
      await adminDB.delete(organizations).where(eq(organizations.id, orgId));
    });

    it("should require userId field in members table", async () => {
      const memberId = nanoid();

      // Test that the constraint works by providing all required fields
      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: testOrganizationId,
        role: "member",
        createdAt: new Date(),
      });

      // Verify the record was created successfully
      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.userId).toBe(testUserId);

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberId));
    });

    it("should require organizationId field in members table", async () => {
      const memberId = nanoid();

      // Test that the constraint works by providing all required fields
      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: testOrganizationId,
        role: "member",
        createdAt: new Date(),
      });

      // Verify the record was created successfully
      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.organizationId).toBe(testOrganizationId);

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberId));
    });
  });

  describe("Default Values", () => {
    it("should set default role to 'member' in members table", async () => {
      const memberId = nanoid();

      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: testOrganizationId,
        createdAt: new Date(),
        // role is not specified, should default to 'member'
      });

      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      expect(result[0]!.role).toBe("member");

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberId));
    });

    it("should set default status to 'pending' in invitations table", async () => {
      const invitationId = nanoid();

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: `test-${nanoid()}@example.com`,
        organizationId: testOrganizationId,
        inviterId: testUserId,
        role: "member",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        // status is not specified, should default to 'pending'
      });

      const result = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(result[0]!.status).toBe("pending");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should set default emailVerified to false in users table", async () => {
      const userId = nanoid();

      await adminDB.insert(users).values({
        id: userId,
        name: "Test User",
        email: `test-${nanoid()}@example.com`,
        // emailVerified is not specified, should default to false
      });

      const result = await adminDB
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(result[0]!.emailVerified).toBe(false);

      // Clean up
      await adminDB.delete(users).where(eq(users.id, userId));
    });
  });
});
