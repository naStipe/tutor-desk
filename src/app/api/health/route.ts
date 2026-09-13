import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "TutorDesk",
    milestone: "TD-001S",
    service: "project-foundation",
    timestamp: new Date().toISOString(),
  });
}
