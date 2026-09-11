import { describe, it, expect } from "vitest";
import { GET } from "../app/api/health/route";

describe("Health Check Route Handler", () => {
  it("should return a 200 response with correct health payload", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.app).toBe("TutorDesk");
    expect(body.milestone).toBe("TD-000");
    expect(body.timestamp).toBeDefined();
  });
});
