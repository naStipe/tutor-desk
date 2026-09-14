import { redirect } from "next/navigation";

export default async function StudentViewIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student } = await searchParams;
  redirect(`/dashboard/student-view/schedule${student ? `?student=${student}` : ""}`);
}
