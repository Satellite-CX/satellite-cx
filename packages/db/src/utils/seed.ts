import { reset, seed } from "drizzle-seed";
import { adminDB } from "../client";
import * as schema from "../schema";

export interface TestData {
  organization: { id: string };
  user: { id: string };
}

export async function seedDatabase(testData?: TestData) {
  if (!testData) {
    return await seed(adminDB, schema);
  }

  return await seed(adminDB, schema).refine((f) => ({
    statuses: {
      count: 4,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        id: f.valuesFromArray({ values: ["status-open", "status-pending", "status-resolved", "status-closed"], isUnique: true }),
        name: f.valuesFromArray({ values: ["Open", "Pending", "Resolved", "Closed"], isUnique: true }),
        icon: f.valuesFromArray({ values: ["📋", "⏳", "✅", "🔒"], isUnique: true }),
        color: f.valuesFromArray({ values: ["blue", "yellow", "green", "red"], isUnique: true }),
      },
    },
    priorities: {
      count: 4,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        id: f.valuesFromArray({ values: ["priority-low", "priority-medium", "priority-high", "priority-urgent"], isUnique: true }),
        name: f.valuesFromArray({ values: ["Low", "Medium", "High", "Urgent"], isUnique: true }),
        icon: f.valuesFromArray({ values: ["🟢", "🟡", "🟠", "🔴"], isUnique: true }),
        color: f.valuesFromArray({ values: ["green", "yellow", "orange", "red"], isUnique: true }),
      },
    },
    customers: {
      count: 1,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        id: f.default({ defaultValue: "test-customer-1" }),
        name: f.default({ defaultValue: "Test Customer" }),
        email: f.default({ defaultValue: "customer@test.com" }),
        phone: f.default({ defaultValue: "123-456-7890" }),
      },
    },
    tickets: {
      count: 5,
      columns: {
        organizationId: f.default({ defaultValue: testData.organization.id }),
        customerId: f.default({ defaultValue: "test-customer-1" }),
        assigneeId: f.default({ defaultValue: testData.user.id }),
        subject: f.loremIpsum(),
        description: f.loremIpsum(),
        status: f.valuesFromArray({ values: ["status-open", "status-pending", "status-resolved", "status-closed"] }),
        priority: f.valuesFromArray({ values: ["priority-low", "priority-medium", "priority-high", "priority-urgent"] }),
      },
    },
  }));
}

export async function resetDatabase() {
  return await reset(adminDB, schema);
}
