import { faker } from "@faker-js/faker";
import { auth } from "@repo/auth";
import { adminDB } from "@repo/db/client";
import { members, organizations, teamMembers, teams } from "@repo/db/schema";
import { API_KEY_PREFIX } from "../../auth/src/plugins/api-key";

export async function generateTestData() {
  const signup = await auth.api.signUpEmail({
    body: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      image: faker.image.url(),
    },
  });

  const { user } = signup;

  const organization = await adminDB
    .insert(organizations)
    .values({
      id: faker.string.uuid(),
      name: faker.company.name(),
      slug: faker.string.uuid(),
      createdAt: new Date(),
      logo: faker.image.url(),
    })
    .returning()
    .then((rows) => rows[0]!);

  const member = await adminDB
    .insert(members)
    .values({
      id: faker.string.uuid(),
      userId: user!.id,
      organizationId: organization!.id,
      role: "member",
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]!);

  const team = await adminDB
    .insert(teams)
    .values({
      id: faker.string.uuid(),
      name: faker.company.name(),
      organizationId: organization!.id,
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]!);

  const teamMember = await adminDB
    .insert(teamMembers)
    .values({
      id: faker.string.uuid(),
      teamId: team!.id,
      userId: user!.id,
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]!);

  const apiKey = await auth.api.createApiKey({
    body: {
      name: faker.lorem.word(),
      expiresIn: 60 * 60 * 24 * 7,
      userId: user!.id,
      prefix: API_KEY_PREFIX,
    },
  });

  return { user, organization, member, team, teamMember, apiKey: apiKey.key };
}
