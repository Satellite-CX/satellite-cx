import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { adminDB } from "../client";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(adminDB, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      // Enable teams feature
      teams: {
        enabled: true,
        maximumTeams: 10,
        allowRemovingAllTeams: false,
      },
      // Enable dynamic access control
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 20,
      },
      // Organization limits
      organizationLimit: 5,
      membershipLimit: 100,
      invitationLimit: 100,
      invitationExpiresIn: 48 * 60 * 60, // 48 hours in seconds
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: false,
      // Email configuration (you'll need to implement this)
      async sendInvitationEmail(data) {
        // TODO: Implement email sending logic
        console.log("Sending invitation email:", data);
        // Example implementation:
        // await sendEmail({
        //   to: data.email,
        //   subject: `Invitation to join ${data.organization.name}`,
        //   template: 'invitation',
        //   data: {
        //     organizationName: data.organization.name,
        //     inviterName: data.inviter.user.name,
        //     inviteLink: `https://yourapp.com/accept-invitation/${data.id}`,
        //   }
        // });
      },
      // Organization hooks
      organizationHooks: {
        afterCreateOrganization: async ({ organization, member, user }) => {
          console.log(
            `Organization ${organization.name} created by ${user.email}`
          );
        },
        afterAddMember: async ({ member, user, organization }) => {
          console.log(
            `${user.email} added to organization ${organization.name}`
          );
        },
        afterCreateInvitation: async ({
          invitation,
          inviter,
          organization,
        }) => {
          console.log(
            `Invitation sent to ${invitation.email} for organization ${organization.name}`
          );
        },
        afterAcceptInvitation: async ({
          invitation,
          member,
          user,
          organization,
        }) => {
          console.log(
            `${user.email} accepted invitation to join ${organization.name}`
          );
        },
      },
    }),
  ],
});
