import { describe, expect, it, vi } from "vitest";
import { deleteTutorAccount } from "../features/account/delete";
import { deleteAccountSchema, emailsMatch } from "../features/account/schemas";

describe("deleteAccountSchema", () => {
  it("trims and requires the confirmation email", () => {
    expect(deleteAccountSchema.safeParse({ confirmEmail: "  a@b.co " }).data).toEqual({
      confirmEmail: "a@b.co",
    });
    expect(deleteAccountSchema.safeParse({ confirmEmail: "   " }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmEmail: null }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmEmail: "a".repeat(400) }).success).toBe(false);
  });

  it("ignores any extra id sent by the client", () => {
    const parsed = deleteAccountSchema.parse({ confirmEmail: "a@b.co", userId: "other" });
    expect(parsed).toEqual({ confirmEmail: "a@b.co" });
  });
});

describe("emailsMatch", () => {
  it("matches ignoring case and surrounding spaces", () => {
    expect(emailsMatch(" Tutor@Example.com ", "tutor@example.com")).toBe(true);
  });
  it("rejects other or missing emails", () => {
    expect(emailsMatch("other@example.com", "tutor@example.com")).toBe(false);
    expect(emailsMatch("tutor@example.com", null)).toBe(false);
    expect(emailsMatch("", "")).toBe(false);
  });
});

function fakeAdmin(options: {
  paths?: string[];
  listError?: boolean;
  removeError?: boolean;
  deleteError?: boolean;
}) {
  const eq = vi.fn(async () => ({
    data: options.listError
      ? null
      : (options.paths ?? []).map((storage_path) => ({ storage_path })),
    error: options.listError ? { message: "boom" } : null,
  }));
  const remove = vi.fn(async () => ({ error: options.removeError ? { message: "boom" } : null }));
  const deleteUser = vi.fn(async () => ({
    error: options.deleteError ? { message: "boom" } : null,
  }));
  const admin = {
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })),
    storage: { from: vi.fn(() => ({ remove })) },
    auth: { admin: { deleteUser } },
  };
  // biome-ignore lint/suspicious/noExplicitAny: minimal fake of the Supabase client
  return { admin: admin as any, eq, remove, deleteUser };
}

describe("deleteTutorAccount", () => {
  it("removes files filtered by tutor id, then deletes the auth user", async () => {
    const paths = Array.from({ length: 250 }, (_, i) => `u1/h/${i}-f.pdf`);
    const { admin, eq, remove, deleteUser } = fakeAdmin({ paths });
    await deleteTutorAccount(admin, "u1");
    expect(eq).toHaveBeenCalledWith("tutor_id", "u1");
    expect(remove).toHaveBeenCalledTimes(3);
    expect(deleteUser).toHaveBeenCalledWith("u1");
    expect(remove.mock.invocationCallOrder[2]).toBeLessThan(deleteUser.mock.invocationCallOrder[0]);
  });

  it("deletes the user when there are no files", async () => {
    const { admin, remove, deleteUser } = fakeAdmin({});
    await deleteTutorAccount(admin, "u1");
    expect(remove).not.toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledTimes(1);
  });

  it("deletes nothing when listing or removing files fails", async () => {
    for (const options of [{ listError: true }, { paths: ["u1/a"], removeError: true }]) {
      const { admin, deleteUser } = fakeAdmin(options);
      await expect(deleteTutorAccount(admin, "u1")).rejects.toThrow();
      expect(deleteUser).not.toHaveBeenCalled();
    }
  });

  it("throws a generic error when the auth delete fails", async () => {
    const { admin } = fakeAdmin({ deleteError: true });
    await expect(deleteTutorAccount(admin, "u1")).rejects.toThrow("Couldn't delete the account.");
  });
});
