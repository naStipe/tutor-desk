import { redirect } from "next/navigation";
import { StudentsListView } from "../../../features/students/components/StudentsListView";
import { listActiveStudents } from "../../../features/students/data";
import { studentSearchQuerySchema } from "../../../features/students/schemas";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const highlight = first(params.highlight);
  const parsedQuery = studentSearchQuerySchema.safeParse(first(params.q));
  const q = parsedQuery.success ? parsedQuery.data : undefined;

  const students = await cachedForTutor(
    "students-active",
    [user.id, q ?? ""],
    [tutorTag("students", user.id)],
    30,
    () => listActiveStudents(client, { q }),
  );

  return <StudentsListView students={students} highlight={highlight} query={q ?? ""} />;
}
