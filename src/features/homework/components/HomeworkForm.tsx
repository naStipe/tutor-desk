"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { DatePicker } from "../../../components/DatePicker";
import { Field, inputClassName } from "../../../components/Field";
import { Select } from "../../../components/Select";
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
  const [studentId, setStudentId] = useState(defaultValues?.studentId ?? students[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(defaultValues?.subjectId ?? "");
  const [lessonId, setLessonId] = useState(defaultValues?.lessonId ?? "");
  const [dueDate, setDueDate] = useState(defaultValues?.dueDate ?? "");

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

      <Field label="Title" htmlFor="title" hint="Optional" errors={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={defaultValues?.title}
          className={inputClassName}
        />
      </Field>

      <Field label="Student" htmlFor="studentId" required errors={state.fieldErrors?.studentId}>
        <Select
          id="studentId"
          name="studentId"
          value={studentId}
          onChange={setStudentId}
          placeholder="Select a student"
          options={students.map((student) => ({ value: student.id, label: student.name }))}
        />
      </Field>

      <Field
        label="Subject"
        htmlFor="subjectId"
        hint="Optional"
        errors={state.fieldErrors?.subjectId}
      >
        <Select
          id="subjectId"
          name="subjectId"
          value={subjectId}
          onChange={setSubjectId}
          options={[
            { value: "", label: "No subject" },
            ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
          ]}
        />
      </Field>

      <Field
        label="Linked lesson"
        htmlFor="lessonId"
        hint="Optional"
        errors={state.fieldErrors?.lessonId}
      >
        <Select
          id="lessonId"
          name="lessonId"
          value={lessonId}
          onChange={setLessonId}
          options={[
            { value: "", label: "No linked lesson" },
            ...lessons.map((lesson) => ({ value: lesson.id, label: lesson.label })),
          ]}
        />
      </Field>

      <Field label="Due date" htmlFor="dueDate" hint="Optional" errors={state.fieldErrors?.dueDate}>
        <DatePicker id="dueDate" name="dueDate" value={dueDate} onChange={setDueDate} />
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
