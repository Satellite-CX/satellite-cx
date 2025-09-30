import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
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

describe("Complete Organization Workflow Tests", () => {
  let ownerUserId: string;
  let adminUserId: string;
  let memberUserId: string;
  let organizationId: string;
  let teamId: string;
  let ownerSessionId: string;
  let adminSessionId: string;
  let memberSessionId: string;

  beforeEach(async () => {
    // Create users
    ownerUserId = nanoid();
    adminUserId = nanoid();
    memberUserId = nanoid();

    await adminDB.insert(users).values([
      {
        id: ownerUserId,
        name: "Owner User",
        email: "owner@example.com",
        emailVerified: true,
      },
      {
        id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        emailVerified: true,
      },
      {
        id: memberUserId,
        name: "Member User",
        email: "member@example.com",
        emailVerified: true,
      },
    ]);

    // Create organization
    organizationId = nanoid();
    await adminDB.insert(organizations).values({
      id: organizationId,
      name: "Test Organization",
      slug: "test-org",
      logo: "https://example.com/logo.png",
      metadata: JSON.stringify({ plan: "pro" }),
      createdAt: new Date(),
    });

    // Create team
    teamId = nanoid();
    await adminDB.insert(teams).values({
      id: teamId,
      name: "Development Team",
      organizationId: organizationId,
      createdAt: new Date(),
    });

    // Create sessions
    ownerSessionId = nanoid();
    adminSessionId = nanoid();
    memberSessionId = nanoid();

    await adminDB.insert(sessions).values([
      {
        id: ownerSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "owner-token",
        userId: ownerUserId,
        activeOrganizationId: organizationId,
        activeTeamId: teamId,
      },
      {
        id: adminSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "admin-token",
        userId: adminUserId,
        activeOrganizationId: organizationId,
        activeTeamId: teamId,
      },
      {
        id: memberSessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "member-token",
        userId: memberUserId,
        activeOrganizationId: organizationId,
        activeTeamId: teamId,
      },
    ]);
  });

  afterEach(async () => {
    // Clean up in reverse order
    await adminDB.delete(sessions).where(eq(sessions.userId, ownerUserId));
    await adminDB.delete(sessions).where(eq(sessions.userId, adminUserId));
    await adminDB.delete(sessions).where(eq(sessions.userId, memberUserId));
    await adminDB.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    await adminDB.delete(teams).where(eq(teams.id, teamId));
    await adminDB
      .delete(members)
      .where(eq(members.organizationId, organizationId));
    await adminDB
      .delete(invitations)
      .where(eq(invitations.organizationId, organizationId));
    await adminDB
      .delete(organizationRoles)
      .where(eq(organizationRoles.organizationId, organizationId));
    await adminDB
      .delete(organizations)
      .where(eq(organizations.id, organizationId));
    await adminDB.delete(users).where(eq(users.id, ownerUserId));
    await adminDB.delete(users).where(eq(users.id, adminUserId));
    await adminDB.delete(users).where(eq(users.id, memberUserId));
  });

  describe("Organization Creation and Setup", () => {
    it("should create organization with owner as first member", async () => {
      // Add owner as member
      const ownerMemberId = nanoid();
      await adminDB.insert(members).values({
        id: ownerMemberId,
        userId: ownerUserId,
        organizationId: organizationId,
        role: "owner",
        createdAt: new Date(),
      });

      // Verify owner is member
      const ownerMember = await adminDB
        .select()
        .from(members)
        .where(
          and(
            eq(members.userId, ownerUserId),
            eq(members.organizationId, organizationId)
          )
        )
        .limit(1);

      expect(ownerMember).toHaveLength(1);
      expect(ownerMember[0]!.role).toBe("owner");

      // Clean up
      await adminDB.delete(members).where(eq(members.id, ownerMemberId));
    });

    it("should create default organization roles", async () => {
      const ownerRoleId = nanoid();
      const adminRoleId = nanoid();
      const memberRoleId = nanoid();

      await adminDB.insert(organizationRoles).values([
        {
          id: ownerRoleId,
          organizationId: organizationId,
          role: "owner",
          permission: JSON.stringify({
            organization: ["update", "delete"],
            member: ["create", "update", "delete"],
            invitation: ["create", "cancel"],
            team: ["create", "update", "delete"],
          }),
        },
        {
          id: adminRoleId,
          organizationId: organizationId,
          role: "admin",
          permission: JSON.stringify({
            organization: ["update"],
            member: ["create", "update", "delete"],
            invitation: ["create", "cancel"],
            team: ["create", "update", "delete"],
          }),
        },
        {
          id: memberRoleId,
          organizationId: organizationId,
          role: "member",
          permission: JSON.stringify({
            organization: [],
            member: [],
            invitation: [],
            team: [],
          }),
        },
      ]);

      const roles = await adminDB
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.organizationId, organizationId))
        .orderBy(organizationRoles.role);

      expect(roles).toHaveLength(3);
      expect(roles[0]!.role).toBe("admin");
      expect(roles[1]!.role).toBe("member");
      expect(roles[2]!.role).toBe("owner");

      // Clean up
      await adminDB
        .delete(organizationRoles)
        .where(eq(organizationRoles.organizationId, organizationId));
    });
  });

  describe("Member Management Workflow", () => {
    it("should add admin member to organization", async () => {
      const adminMemberId = nanoid();
      await adminDB.insert(members).values({
        id: adminMemberId,
        userId: adminUserId,
        organizationId: organizationId,
        role: "admin",
        createdAt: new Date(),
      });

      const adminMember = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, adminMemberId))
        .limit(1);

      expect(adminMember).toHaveLength(1);
      expect(adminMember[0]!.role).toBe("admin");
      expect(adminMember[0]!.userId).toBe(adminUserId);

      // Clean up
      await adminDB.delete(members).where(eq(members.id, adminMemberId));
    });

    it("should add member to organization", async () => {
      const memberMemberId = nanoid();
      await adminDB.insert(members).values({
        id: memberMemberId,
        userId: memberUserId,
        organizationId: organizationId,
        role: "member",
        createdAt: new Date(),
      });

      const memberMember = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberMemberId))
        .limit(1);

      expect(memberMember).toHaveLength(1);
      expect(memberMember[0]!.role).toBe("member");
      expect(memberMember[0]!.userId).toBe(memberUserId);

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberMemberId));
    });

    it("should update member role", async () => {
      const memberId = nanoid();
      await adminDB.insert(members).values({
        id: memberId,
        userId: memberUserId,
        organizationId: organizationId,
        role: "member",
        createdAt: new Date(),
      });

      // Update role to admin
      await adminDB
        .update(members)
        .set({ role: "admin" })
        .where(eq(members.id, memberId));

      const updatedMember = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      expect(updatedMember[0]!.role).toBe("admin");

      // Clean up
      await adminDB.delete(members).where(eq(members.id, memberId));
    });

    it("should remove member from organization", async () => {
      const memberId = nanoid();
      await adminDB.insert(members).values({
        id: memberId,
        userId: memberUserId,
        organizationId: organizationId,
        role: "member",
        createdAt: new Date(),
      });

      await adminDB.delete(members).where(eq(members.id, memberId));

      const deletedMember = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, memberId));

      expect(deletedMember).toHaveLength(0);
    });
  });

  describe("Invitation Workflow", () => {
    it("should create invitation for new user", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: `newuser-${nanoid()}@example.com`,
        organizationId: organizationId,
        inviterId: ownerUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      const invitation = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(invitation).toHaveLength(1);
      expect(invitation[0]!.email).toMatch(/^newuser-.*@example\.com$/);
      expect(invitation[0]!.status).toBe("pending");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should accept invitation and create member", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create invitation
      await adminDB.insert(invitations).values({
        id: invitationId,
        email: `newuser-${nanoid()}@example.com`,
        organizationId: organizationId,
        inviterId: ownerUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      // Accept invitation
      await adminDB
        .update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invitationId));

      // Create new user and member
      const newUserId = nanoid();
      await adminDB.insert(users).values({
        id: newUserId,
        name: "New User",
        email: `newuser-${nanoid()}@example.com`,
        emailVerified: true,
      });

      const newMemberId = nanoid();
      await adminDB.insert(members).values({
        id: newMemberId,
        userId: newUserId,
        organizationId: organizationId,
        role: "member",
        createdAt: new Date(),
      });

      // Verify member was created
      const newMember = await adminDB
        .select()
        .from(members)
        .where(eq(members.id, newMemberId))
        .limit(1);

      expect(newMember).toHaveLength(1);
      expect(newMember[0]!.role).toBe("member");

      // Clean up
      await adminDB.delete(members).where(eq(members.id, newMemberId));
      await adminDB.delete(users).where(eq(users.id, newUserId));
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should reject invitation", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: `newuser-${nanoid()}@example.com`,
        organizationId: organizationId,
        inviterId: ownerUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      // Reject invitation
      await adminDB
        .update(invitations)
        .set({ status: "rejected" })
        .where(eq(invitations.id, invitationId));

      const rejectedInvitation = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(rejectedInvitation[0]!.status).toBe("rejected");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });

    it("should cancel invitation", async () => {
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await adminDB.insert(invitations).values({
        id: invitationId,
        email: `newuser-${nanoid()}@example.com`,
        organizationId: organizationId,
        inviterId: ownerUserId,
        role: "member",
        status: "pending",
        expiresAt,
      });

      // Cancel invitation
      await adminDB
        .update(invitations)
        .set({ status: "cancelled" })
        .where(eq(invitations.id, invitationId));

      const cancelledInvitation = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      expect(cancelledInvitation[0]!.status).toBe("cancelled");

      // Clean up
      await adminDB.delete(invitations).where(eq(invitations.id, invitationId));
    });
  });

  describe("Team Management Workflow", () => {
    it("should add member to team", async () => {
      const teamMemberId = nanoid();
      await adminDB.insert(teamMembers).values({
        id: teamMemberId,
        teamId: teamId,
        userId: memberUserId,
        createdAt: new Date(),
      });

      const teamMember = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, teamMemberId))
        .limit(1);

      expect(teamMember).toHaveLength(1);
      expect(teamMember[0]!.teamId).toBe(teamId);
      expect(teamMember[0]!.userId).toBe(memberUserId);

      // Clean up
      await adminDB.delete(teamMembers).where(eq(teamMembers.id, teamMemberId));
    });

    it("should remove member from team", async () => {
      const teamMemberId = nanoid();
      await adminDB.insert(teamMembers).values({
        id: teamMemberId,
        teamId: teamId,
        userId: memberUserId,
        createdAt: new Date(),
      });

      await adminDB.delete(teamMembers).where(eq(teamMembers.id, teamMemberId));

      const deletedTeamMember = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, teamMemberId));

      expect(deletedTeamMember).toHaveLength(0);
    });

    it("should list team members", async () => {
      const teamMember1Id = nanoid();
      const teamMember2Id = nanoid();

      await adminDB.insert(teamMembers).values([
        {
          id: teamMember1Id,
          teamId: teamId,
          userId: adminUserId,
          createdAt: new Date(),
        },
        {
          id: teamMember2Id,
          teamId: teamId,
          userId: memberUserId,
          createdAt: new Date(),
        },
      ]);

      const teamMembersList = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId))
        .orderBy(teamMembers.createdAt);

      expect(teamMembersList).toHaveLength(2);
      const userIds = teamMembersList.map((tm) => tm.userId);
      expect(userIds).toContain(memberUserId);
      expect(userIds).toContain(adminUserId);

      // Clean up
      await adminDB.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    });
  });

  describe("Session Management", () => {
    it("should set active organization in session", async () => {
      const sessionId = nanoid();
      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "test-session-token",
        userId: ownerUserId,
        activeOrganizationId: organizationId,
      });

      const session = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(session[0]!.activeOrganizationId).toBe(organizationId);

      await adminDB.delete(sessions).where(eq(sessions.id, sessionId));
    });

    it("should set active team in session", async () => {
      const sessionId = nanoid();
      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "test-session-token",
        userId: ownerUserId,
        activeOrganizationId: organizationId,
        activeTeamId: teamId,
      });

      const session = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(session[0]!.activeTeamId).toBe(teamId);

      await adminDB.delete(sessions).where(eq(sessions.id, sessionId));
    });

    it("should update active organization in session", async () => {
      const sessionId = nanoid();
      await adminDB.insert(sessions).values({
        id: sessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: "test-session-token",
        userId: ownerUserId,
        activeOrganizationId: organizationId,
      });

      const newOrgId = nanoid();
      await adminDB
        .update(sessions)
        .set({ activeOrganizationId: newOrgId })
        .where(eq(sessions.id, sessionId));

      const updatedSession = await adminDB
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(updatedSession[0]!.activeOrganizationId).toBe(newOrgId);

      // Clean up
      await adminDB.delete(sessions).where(eq(sessions.id, sessionId));
    });
  });

  describe("Complete Organization Lifecycle", () => {
    it("should handle complete organization setup and teardown", async () => {
      // 1. Create organization with owner
      const ownerMemberId = nanoid();
      await adminDB.insert(members).values({
        id: ownerMemberId,
        userId: ownerUserId,
        organizationId: organizationId,
        role: "owner",
        createdAt: new Date(),
      });

      // 2. Add admin member
      const adminMemberId = nanoid();
      await adminDB.insert(members).values({
        id: adminMemberId,
        userId: adminUserId,
        organizationId: organizationId,
        role: "admin",
        createdAt: new Date(),
      });

      // 3. Add regular member
      const memberMemberId = nanoid();
      await adminDB.insert(members).values({
        id: memberMemberId,
        userId: memberUserId,
        organizationId: organizationId,
        role: "member",
        createdAt: new Date(),
      });

      // 4. Add members to team
      const teamMember1Id = nanoid();
      const teamMember2Id = nanoid();
      await adminDB.insert(teamMembers).values([
        {
          id: teamMember1Id,
          teamId: teamId,
          userId: adminUserId,
          createdAt: new Date(),
        },
        {
          id: teamMember2Id,
          teamId: teamId,
          userId: memberUserId,
          createdAt: new Date(),
        },
      ]);

      // 5. Create invitation
      const invitationId = nanoid();
      await adminDB.insert(invitations).values({
        id: invitationId,
        email: "invited@example.com",
        organizationId: organizationId,
        inviterId: ownerUserId,
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // 6. Create organization roles
      const ownerRoleId = nanoid();
      const adminRoleId = nanoid();
      const memberRoleId = nanoid();
      await adminDB.insert(organizationRoles).values([
        {
          id: ownerRoleId,
          organizationId: organizationId,
          role: "owner",
          permission: JSON.stringify({ organization: ["update", "delete"] }),
        },
        {
          id: adminRoleId,
          organizationId: organizationId,
          role: "admin",
          permission: JSON.stringify({ organization: ["update"] }),
        },
        {
          id: memberRoleId,
          organizationId: organizationId,
          role: "member",
          permission: JSON.stringify({ organization: [] }),
        },
      ]);

      // Verify all data exists
      const membersList = await adminDB
        .select()
        .from(members)
        .where(eq(members.organizationId, organizationId));
      expect(membersList).toHaveLength(3);

      const teamMembersList = await adminDB
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));
      expect(teamMembersList).toHaveLength(2);

      const invitationsList = await adminDB
        .select()
        .from(invitations)
        .where(eq(invitations.organizationId, organizationId));
      expect(invitationsList).toHaveLength(1);

      const roles = await adminDB
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.organizationId, organizationId));
      expect(roles).toHaveLength(3);

      // Clean up everything
      await adminDB.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
      await adminDB
        .delete(members)
        .where(eq(members.organizationId, organizationId));
      await adminDB
        .delete(invitations)
        .where(eq(invitations.organizationId, organizationId));
      await adminDB
        .delete(organizationRoles)
        .where(eq(organizationRoles.organizationId, organizationId));
    });
  });
});
