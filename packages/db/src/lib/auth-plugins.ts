import { apiKey, organization } from "better-auth/plugins";

type Plugins = [ReturnType<typeof apiKey>, ReturnType<typeof organization>];

export const plugins: Plugins = [
  apiKey({
    defaultPrefix: "scx_",
  }),
  organization({
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
    organizationLimit: 5,
    membershipLimit: 100,
    invitationLimit: 100,
    invitationExpiresIn: 48 * 60 * 60, // 48 hours
    cancelPendingInvitationsOnReInvite: true,
    requireEmailVerificationOnInvitation: false,
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
        console.log(`${user.email} added to organization ${organization.name}`);
      },
      afterCreateInvitation: async ({ invitation, inviter, organization }) => {
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
];
