import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { adminDB } from "../src/client";
import {
  invitations,
  members,
  organizationRoles,
  organizations,
  sessions,
  teamMembers,
  teams,
  users,
} from "../src/schema";

describe("Organization Schema Tests", () => {
  let testUserId: string;
  let testOrganizationId: string;
  let testTeamId: string;

  beforeEach(async () => {
    // Create a test user
    testUserId = nanoid();
    await adminDB.insert(users).values({
      id: testUserId,
      name: "Test User",
      email: `test-${nanoid()}@example.com`,
      emailVerified: true,
    });

    // Create a test organization
    testOrganizationId = nanoid();
    await adminDB.insert(organizations).values({
      id: testOrganizationId,
      name: "Test Organization",
      slug: "test-org",
      logo: "https://example.com/logo.png",
      metadata: JSON.stringify({ plan: "pro" }),
      createdAt: new Date(),
    });

    // Create a test team
    testTeamId = nanoid();
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
    await adminDB
      .delete(members)
      .where(eq(members.organizationId, testOrganizationId));
    await adminDB
      .delete(invitations)
      .where(eq(invitations.organizationId, testOrganizationId));
    await adminDB
      .delete(organizationRoles)
      .where(eq(organizationRoles.organizationId, testOrganizationId));
    await adminDB
      .delete(organizations)
      .where(eq(organizations.id, testOrganizationId));
    await adminDB.delete(users).where(eq(users.id, testUserId));
  });

  describe("Organization CRUD Operations", () => {
    it("should create an organization", async () => {
      const orgId = nanoid();
      const orgData = {
        id: orgId,
        name: "New Organization",
        slug: "new-org",
        logo: "https://example.com/new-logo.png",
        metadata: JSON.stringify({ plan: "basic" }),
        createdAt: new Date(),
      };

      await adminDB.insert(organizations).values(orgData);

      const result = await adminDB
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("New Organization");
      expect(result[0]!.slug).toBe("new-org");
      expect(result[0]!.logo).toBe("https://example.com/new-logo.png");
      expect(JSON.parse(result[0]!.metadata!)).toEqual({ plan: "basic" });

      // Clean up
      await adminDB.delete(organizations).where(eq(organizations.id, orgId));
    });

    it("should read an organization", async () => {
      const result = await adminDB
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrganizationId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Test Organization");
      expect(result[0]!.slug).toBe("test-org");
    });

    it("should update an organization", async () => {
      const updatedName = "Updated Organization";
      const updatedSlug = "updated-org";
      const updatedLogo = "https://example.com/updated-logo.png";
      const updatedMetadata = JSON.stringify({ plan: "enterprise" });

      await adminDB
        .update(organizations)
        .set({
          name: updatedName,
          slug: updatedSlug,
          logo: updatedLogo,
          metadata: updatedMetadata,
        })
        .where(eq(organizations.id, testOrganizationId));

      const result = await adminDB
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrganizationId))
        .limit(1);

      expect(result[0]!.name).toBe(updatedName);
      expect(result[0]!.slug).toBe(updatedSlug);
      expect(result[0]!.logo).toBe(updatedLogo);
      expect(JSON.parse(result[0]!.metadata!)).toEqual({ plan: "enterprise" });
    });

    it("should delete an organization", async () => {
      const orgId = nanoid();
      await adminDB.insert(organizations).values({
        id: orgId,
        name: "To Delete",
        slug: "to-delete",
        createdAt: new Date(),
      });

      await adminDB.delete(organizations).where(eq(organizations.id, orgId));

      const result = await adminDB
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId));

      expect(result).toHaveLength(0);
    });
  });

  describe("Member Operations", () => {
    it("should add a member to an organization", async () => {
      const memberId = nanoid();
      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: testOrganizationId,
        role: "admin",
        createdAt: new Date(),
      });

      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.userId).toBe(testUserId);
      expect(result[0]!.organizationId).toBe(testOrganizationId);
      expect(result[0]!.role).toBe("admin");

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberId));
    });

    it("should list members of an organization", async () => {
      // Add multiple members
      const member1Id = nanoid();
      const member2Id = nanoid();

      await adminDB.insert(members).values([
        {
          id: member1Id,
          userId: testUserId,
          organizationId: testOrganizationId,
          role: "admin",
          createdAt: new Date(),
        },
        {
          id: member2Id,
          userId: testUserId,
          organizationId: testOrganizationId,
          role: "member",
          createdAt: new Date(),
        },
      ]);

      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.organizationId, testOrganizationId))
        .orderBy(members.createdAt);

      expect(result).toHaveLength(2);
      const roles = result.map((r) => r.role);
      expect(roles).toContain("member");
      expect(roles).toContain("admin");

      // Clean up
      await adminDB
        .delete(members)
        .where(eq(members.organizationId, testOrganizationId));
    });

    it("should update member role", async () => {
      const memberId = nanoid();
      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: testOrganizationId,
        role: "member",
        createdAt: new Date(),
      });

      await adminDB
        .update(members)
        .set({ role: "admin" })
        .where(eq(members.id, memberId));

      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      expect(result[0]!.role).toBe("admin");

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberId));
    });

    it("should remove a member from an organization", async () => {
      const memberId = nanoid();
      await adminDB.insert(members).values({
        id: memberId,
        userId: testUserId,
        organizationId: testOrganizationId,
        role: "member",
        createdAt: new Date(),
      });

      await adminDB.delete(members).where(eq(members.id, memberId));

      const result = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId));

      expect(result).toHaveLength(0);
    });
  });

  describe("Invitation Workflow", () => {
    it("should create an invitation", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: "invited@example.com",
        organizationId: testOrganizationId,
        inviterId: testUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      const result = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.email).toBe("invited@example.com");
      expect(result[0]!.status).toBe("pending");
      expect(result[0]!.role).toBe("member");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should accept an invitation", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: "invited@example.com",
        organizationId: testOrganizationId,
        inviterId: testUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      // Accept invitation
      await adminDB
        .update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invitationId));

      const result = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(result[0]!.status).toBe("accepted");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should reject an invitation", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: "invited@example.com",
        organizationId: testOrganizationId,
        inviterId: testUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      // Reject invitation
      await adminDB
        .update(invitations)
        .set({ status: "rejected" })
        .where(eq(invitations.id, invitationId));

      const result = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(result[0]!.status).toBe("rejected");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should cancel an invitation", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: "invited@example.com",
        organizationId: testOrganizationId,
        inviterId: testUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      // Cancel invitation
      await adminDB
        .update(invitations)
        .set({ status: "cancelled" })
        .where(eq(invitations.id, invitationId));

      const result = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(result[0]!.status).toBe("cancelled");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should list invitations for an organization", async () => {
      const invitation1Id = nanoid();
      const invitation2Id = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values([
        {
          id: invitation1Id,
          email: `invited1-${nanoid()}@example.com`,
          organizationId: testOrganizationId,
          inviterId: testUserId,
          role: "member",
          status: "pending",
          expiresAt,
        },
        {
          id: invitation2Id,
          email: `invited2-${nanoid()}@example.com`,
          organizationId: testOrganizationId,
          inviterId: testUserId,
          role: "admin",
          status: "pending",
          expiresAt,
        },
      ]);

      const result = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.organizationId, testOrganizationId));

      expect(result).toHaveLength(2);
      const emails = result.map((r) => r.email);
      const roles = result.map((r) => r.role);
      expect(emails).toHaveLength(2);
      expect(roles).toContain("member");
      expect(roles).toContain("admin");

      // Clean up
      await adminDB
        .delete(invitations)
        .where(eq(invitations.organizationId, testOrganizationId));
    });
  });

  describe("Team Operations", () => {
    it("should create a team", async () => {
      const teamId = nanoid();
      const teamData = {
        id: teamId,
        name: "New Team",
        organizationId: testOrganizationId,
        createdAt: new Date(),
      };

      await adminDB.insert(teams).values(teamData);

      const result = await adminDB
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("New Team");
      expect(result[0]!.organizationId).toBe(testOrganizationId);

      // Clean up
      await adminDB.delete(teams).where(eq(teams.id, teamId));
    });

    it("should update a team", async () => {
      const updatedName = "Updated Team";
      const updatedAt = new Date();

      await adminDB
        .update(teams)
        .set({
          name: updatedName,
          updatedAt,
        })
        .where(eq(teams.id, testTeamId));

      const result = await adminDB
        .select()
        .from(teams)
        .where(eq(teams.id, testTeamId))
        .limit(1);

      expect(result[0]!.name).toBe(updatedName);
      expect(result[0]!.updatedAt).toEqual(updatedAt);
    });

    it("should delete a team", async () => {
      const teamId = nanoid();
      await adminDB.insert(teams).values({
        id: teamId,
        name: "To Delete",
        organizationId: testOrganizationId,
        createdAt: new Date(),
      });

      await adminDB.delete(teams).where(eq(teams.id, teamId));

      const result = await adminDB
        .select()
        .from(teams)
        .where(eq(teams.id, teamId));

      expect(result).toHaveLength(0);
    });

    it("should add a member to a team", async () => {
      const teamMemberId = nanoid();
      await adminDB.insert(teamMembers).values({
        id: teamMemberId,
        teamId: testTeamId,
        userId: testUserId,
        createdAt: new Date(),
      });

      const result = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, teamMemberId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.teamId).toBe(testTeamId);
      expect(result[0]!.userId).toBe(testUserId);

      // Clean up
      await adminDB.delete(teamMembers).where(eq(teamMembers.id, teamMemberId));
    });

    it("should remove a member from a team", async () => {
      const teamMemberId = nanoid();
      await adminDB.insert(teamMembers).values({
        id: teamMemberId,
        teamId: testTeamId,
        userId: testUserId,
        createdAt: new Date(),
      });

      await adminDB.delete(teamMembers).where(eq(teamMembers.id, teamMemberId));

      const result = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, teamMemberId));

      expect(result).toHaveLength(0);
    });

    it("should list team members", async () => {
      const teamMember1Id = nanoid();
      const teamMember2Id = nanoid();

      await adminDB.insert(teamMembers).values([
        {
          id: teamMember1Id,
          teamId: testTeamId,
          userId: testUserId,
          createdAt: new Date(),
        },
        {
          id: teamMember2Id,
          teamId: testTeamId,
          userId: testUserId,
          createdAt: new Date(),
        },
      ]);

      const result = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, testTeamId))
        .orderBy(teamMembers.createdAt);

      expect(result).toHaveLength(2);

      // Clean up
      await adminDB
        .delete(teamMembers)
        .where(eq(teamMembers.teamId, testTeamId));
    });
  });

  describe("Organization Roles and Permissions", () => {
    it("should create an organization role", async () => {
      const roleId = nanoid();
      await adminDB.insert(organizationRoles).values({
        id: roleId,
        organizationId: testOrganizationId,
        role: "custom-role",
        permission: JSON.stringify({ project: ["create", "update"] }),
      });

      const result = await adminDB
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.id, roleId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0]!.role).toBe("custom-role");
      expect(JSON.parse(result[0]!.permission)).toEqual({
        project: ["create", "update"],
      });

      // Clean up
      await adminDB
        .delete(organizationRoles)
        .where(eq(organizationRoles.id, roleId));
    });

    it("should update an organization role", async () => {
      const roleId = nanoid();
      await adminDB.insert(organizationRoles).values({
        id: roleId,
        organizationId: testOrganizationId,
        role: "custom-role",
        permission: JSON.stringify({ project: ["create"] }),
      });

      const updatedPermission = JSON.stringify({
        project: ["create", "update", "delete"],
      });
      await adminDB
        .update(organizationRoles)
        .set({ permission: updatedPermission })
        .where(eq(organizationRoles.id, roleId));

      const result = await adminDB
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.id, roleId))
        .limit(1);

      expect(JSON.parse(result[0]!.permission)).toEqual({
        project: ["create", "update", "delete"],
      });

      // Clean up
      await adminDB
        .delete(organizationRoles)
        .where(eq(organizationRoles.id, roleId));
    });

    it("should delete an organization role", async () => {
      const roleId = nanoid();
      await adminDB.insert(organizationRoles).values({
        id: roleId,
        organizationId: testOrganizationId,
        role: "custom-role",
        permission: JSON.stringify({ project: ["create"] }),
      });

      await adminDB
        .delete(organizationRoles)
        .where(eq(organizationRoles.id, roleId));

      const result = await adminDB
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.id, roleId));

      expect(result).toHaveLength(0);
    });

    it("should list organization roles", async () => {
      const role1Id = nanoid();
      const role2Id = nanoid();

      await adminDB.insert(organizationRoles).values([
        {
          id: role1Id,
          organizationId: testOrganizationId,
          role: "role-1",
          permission: JSON.stringify({ project: ["create"] }),
        },
        {
          id: role2Id,
          organizationId: testOrganizationId,
          role: "role-2",
          permission: JSON.stringify({ project: ["update"] }),
        },
      ]);

      const result = await adminDB
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.organizationId, testOrganizationId))
        .orderBy(organizationRoles.createdAt);

      expect(result).toHaveLength(2);
      const roles = result.map((r) => r.role);
      expect(roles).toContain("role-1");
      expect(roles).toContain("role-2");

      // Clean up
      await adminDB
        .delete(organizationRoles)
        .where(eq(organizationRoles.organizationId, testOrganizationId));
    });
  });

  describe("Session Active Organization/Team", () => {
    it("should set active organization in session", async () => {
      const sessionId = nanoid();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt,
        token: "test-token",
        userId: testUserId,
        activeOrganizationId: testOrganizationId,
      });

      const result = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(result[0]!.activeOrganizationId).toBe(testOrganizationId);

      // Clean up
      await adminDB.delete(sessions).where(eq(sessions.id, sessionId));
    });

    it("should set active team in session", async () => {
      const sessionId = nanoid();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt,
        token: "test-token",
        userId: testUserId,
        activeOrganizationId: testOrganizationId,
        activeTeamId: testTeamId,
      });

      const result = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(result[0]!.activeTeamId).toBe(testTeamId);

      // Clean up
      await adminDB.delete(sessions).where(eq(sessions.id, sessionId));
    });

    it("should update active organization in session", async () => {
      const sessionId = nanoid();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt,
        token: "test-token",
        userId: testUserId,
        activeOrganizationId: testOrganizationId,
      });

      const newOrgId = nanoid();
      await adminDB
        .update(sessions)
        .set({ activeOrganizationId: newOrgId })
        .where(eq(sessions.id, sessionId));

      const result = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(result[0]!.activeOrganizationId).toBe(newOrgId);

      // Clean up
      await adminDB.delete(sessions).where(eq(sessions.id, sessionId));
    });
  });
});
