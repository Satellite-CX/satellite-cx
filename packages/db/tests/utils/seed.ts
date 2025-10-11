import { reset, seed } from "drizzle-seed";
import { adminDB } from "@repo/db/client";
import * as schema from "@repo/db/schema";
import { faker } from "@faker-js/faker";

export interface TestData {
  organization: { id: string };
  user: { id: string };
}

export interface SeedOptions {
  testData?: TestData;
  ticketCount?: number;
  customerCount?: number;
  statusCount?: number;
  priorityCount?: number;
}

function generateStatuses(count: number = 4) {
  const statusNames = faker.helpers
    .shuffle([
      "New",
      "Open",
      "In Progress",
      "Pending",
      "Waiting",
      "Resolved",
      "Closed",
      "Cancelled",
    ])
    .slice(0, count);

  const statusIcons = faker.helpers
    .shuffle(["📋", "🔓", "⚡", "⏳", "⏰", "✅", "🔒", "❌", "🎯", "📝"])
    .slice(0, count);

  const statusColors = faker.helpers
    .shuffle([
      "blue",
      "green",
      "yellow",
      "orange",
      "red",
      "purple",
      "gray",
      "teal",
    ])
    .slice(0, count);

  return Array.from({ length: count }, (_, i) => ({
    id: `status-${faker.string.alphanumeric(8)}`,
    name: statusNames[i],
    icon: statusIcons[i],
    color: statusColors[i],
  }));
}

function generatePriorities(count: number = 4) {
  const priorityNames = faker.helpers
    .shuffle([
      "Low",
      "Normal",
      "Medium",
      "High",
      "Urgent",
      "Critical",
      "Blocker",
    ])
    .slice(0, count);

  const priorityIcons = faker.helpers
    .shuffle(["🟢", "🔵", "🟡", "🟠", "🔴", "🔥", "💥", "⚠️", "🚨"])
    .slice(0, count);

  const priorityColors = faker.helpers
    .shuffle(["green", "blue", "yellow", "orange", "red", "purple", "gray"])
    .slice(0, count);

  return Array.from({ length: count }, (_, i) => ({
    id: `priority-${faker.string.alphanumeric(8)}`,
    name: priorityNames[i],
    icon: priorityIcons[i],
    color: priorityColors[i],
  }));
}

export async function seedDatabase(options?: TestData | SeedOptions) {
  const testData =
    options && "organization" in options
      ? options
      : (options as SeedOptions)?.testData;
  const ticketCount = (options as SeedOptions)?.ticketCount ?? 5;
  const customerCount = (options as SeedOptions)?.customerCount ?? 1;
  const statusCount = (options as SeedOptions)?.statusCount ?? 4;
  const priorityCount = (options as SeedOptions)?.priorityCount ?? 4;
  if (!testData) {
    return await seed(adminDB, schema);
  }

  const seedValue = testData.organization.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  faker.seed(seedValue);

  const statusData = generateStatuses(statusCount);
  const priorityData = generatePriorities(priorityCount);

  return await seed(adminDB, schema).refine((f) => ({
    statuses: {
      count: statusCount,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        id: f.valuesFromArray({
          values: statusData.map((s) => s.id),
          isUnique: true,
        }),
        name: f.valuesFromArray({
          values: statusData.map((s) => s.name),
          isUnique: true,
        }),
        icon: f.valuesFromArray({
          values: statusData.map((s) => s.icon),
          isUnique: true,
        }),
        color: f.valuesFromArray({
          values: statusData.map((s) => s.color),
          isUnique: true,
        }),
      },
    },
    priorities: {
      count: priorityCount,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        id: f.valuesFromArray({
          values: priorityData.map((p) => p.id),
          isUnique: true,
        }),
        name: f.valuesFromArray({
          values: priorityData.map((p) => p.name),
          isUnique: true,
        }),
        icon: f.valuesFromArray({
          values: priorityData.map((p) => p.icon),
          isUnique: true,
        }),
        color: f.valuesFromArray({
          values: priorityData.map((p) => p.color),
          isUnique: true,
        }),
      },
    },
    customers: {
      count: customerCount,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        id: f.valuesFromArray({
          values: Array.from(
            { length: customerCount },
            (_, i) => `test-customer-${i + 1}`
          ),
          isUnique: true,
        }),
        name: f.default({ defaultValue: "Test Customer" }),
        email: f.valuesFromArray({
          values: Array.from(
            { length: customerCount },
            (_, i) => `customer${i + 1}@test.com`
          ),
          isUnique: true,
        }),
        phone: f.default({ defaultValue: "123-456-7890" }),
      },
    },
    tickets: {
      count: ticketCount,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        customerId: f.default({ defaultValue: "test-customer-1" }),
        assigneeId: f.default({ defaultValue: testData.user.id }),
        subject: f.loremIpsum(),
        description: f.loremIpsum(),
        status: f.valuesFromArray({
          values: statusData.map((s) => s.id),
        }),
        priority: f.valuesFromArray({
          values: priorityData.map((p) => p.id),
        }),
      },
    },
  }));
}

export async function resetDatabase() {
  return await reset(adminDB, schema);
}
