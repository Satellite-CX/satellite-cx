import { reset, seed } from "drizzle-seed";
import { adminDB } from "../client";
import * as schema from "../schema";

export async function seedDatabase() {
  return await seed(adminDB, schema);
}

export async function resetDatabase() {
  return await reset(adminDB, schema);
}
