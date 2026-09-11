import { describe, it, expect } from "vitest";
import { user, session, account, verification } from "../db/schema/auth";
import { getTableColumns } from "drizzle-orm";

describe("Database Auth Schema Definition", () => {
  it("should have all required fields on the user table", () => {
    const columns = getTableColumns(user);
    expect(columns.id).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.email).toBeDefined();
    expect(columns.emailVerified).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("should have all required fields on the session table", () => {
    const columns = getTableColumns(session);
    expect(columns.id).toBeDefined();
    expect(columns.token).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.expiresAt).toBeDefined();
  });

  it("should have all required fields on the account table", () => {
    const columns = getTableColumns(account);
    expect(columns.id).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.accountId).toBeDefined();
    expect(columns.providerId).toBeDefined();
  });

  it("should have all required fields on the verification table", () => {
    const columns = getTableColumns(verification);
    expect(columns.id).toBeDefined();
    expect(columns.identifier).toBeDefined();
    expect(columns.value).toBeDefined();
    expect(columns.expiresAt).toBeDefined();
  });
});
