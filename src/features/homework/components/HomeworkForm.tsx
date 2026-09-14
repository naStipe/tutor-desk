"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import type { HomeworkActionState } from "../actions";

const initialState: HomeworkActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

type LessonOption = { id: string; label: string };

type HomeworkFormProps = {
  action: (state: HomeworkActionState, formData: FormData) => Promise<HomeworkActionState>;
  homeworkId?: string;
  students: { id: string; name: string }[];
  lessons: LessonOption[];
  subjects: { id: string; name: string }[];
  defaultValues?: {
    studentId: string;
    lessonId: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    links: string;
  };
  submitLabel: string;
  pendingLabel: string;
};

export function HomeworkForm({
  action,
  homeworkId,
  students,
  lessons,
  subjects,
  defaultValues,
  submitLabel,
  pendingLabel,
}: HomeworkFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {homeworkId && <input type="hidden" name="id" value={homeworkId} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <Field label="Title" htmlFor="title" required errors={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={defaultValues?.title}
          className={inputClassName}
        />
      </Field>

      <Field label="Student" htmlFor="studentId" required errors={state.fieldErrors?.studentId}>
        <select
          id="studentId"
          name="studentId"
          defaultValue={defaultValues?.studentId ?? students[0]?.id ?? ""}
          className={inputClassName}
        >
          {students.length === 0 && (
            <option value="" disabled>
              Select a student
            </option>
          )}
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Subject"
        htmlFor="subjectId"
        hint="Optional"
        errors={state.fieldErrors?.subjectId}
      >
        <select
          id="subjectId"
          name="subjectId"
          defaultValue={defaultValues?.subjectId ?? ""}
          className={inputClassName}
        >
          <option value="">No subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Linked lesson"
        htmlFor="lessonId"
        hint="Optional"
        errors={state.fieldErrors?.lessonId}
      >
        <select
          id="lessonId"
          name="lessonId"
          defaultValue={defaultValues?.lessonId ?? ""}
          className={inputClassName}
        >
          <option value="">No linked lesson</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Due date" htmlFor="dueDate" hint="Optional" errors={state.fieldErrors?.dueDate}>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={defaultValues?.dueDate}
          className={inputClassName}
        />
      </Field>

      <Field
        label="Notes"
        htmlFor="description"
        hint="Optional"
        errors={state.fieldErrors?.description}
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className={inputClassName}
        />
      </Field>

      <Field
        label="Links"
        htmlFor="links"
        hint="Optional — one per line, e.g. Worksheet | https://example.com/file.pdf"
        errors={state.fieldErrors?.links}
      >
        <textarea
          id="links"
          name="links"
          rows={3}
          placeholder={"Worksheet | https://example.com/worksheet.pdf\nhttps://example.com/video"}
          defaultValue={defaultValues?.links}
          className={inputClassName}
        />
      </Field>

      <div className="pt-2">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}
