import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "../../../../components/Avatar";
import { PageHeader } from "../../../../components/PageHeader";
import { StudentTabs } from "../../../../features/students/components/StudentTabs";
import { getStudent } from "../../../../features/students/data";
import { getTutorFormatSettings } from "../../../../features/tutor-profile/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(value: string, timeZone: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
  });
}

export default async function StudentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const { timeZone, locale } = await getTutorFormatSettings(supabase, student.tutor_id);
  const isArchived = student.archived_at !== null;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={student.name}
        description={
          isArchived
            ? `Archived ${formatDate(student.archived_at as string, timeZone, locale)}`
            : `Added ${formatDate(student.created_at, timeZone, locale)}`
        }
        avatar={<Avatar name={student.name} />}
        actions={
          <Link href="/dashboard/students" className="text-sm text-ink-muted hover:text-ink">
            &larr; Back to students
          </Link>
        }
      />

      <StudentTabs studentId={id} />

      {children}
    </div>
  );
}
