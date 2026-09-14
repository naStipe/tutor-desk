"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import {
  deleteHomeworkAttachmentAction,
  uploadHomeworkAttachmentAction,
  type AttachmentActionState,
} from "../actions";

const initialState: AttachmentActionState = {};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Uploading…" : "Upload file"}
    </Button>
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type AttachmentRow = {
  id: string;
  file_name: string;
  size_bytes: number | null;
  content_type: string | null;
  url: string | null;
};

export function AttachmentsCard({
  homeworkId,
  attachments,
}: {
  homeworkId: string;
  attachments: AttachmentRow[];
}) {
  const [state, formAction] = useActionState(uploadHomeworkAttachmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      {attachments.length === 0 ? (
        <p className="text-sm text-ink-subtle">No files attached yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-3 py-2">
              {attachment.url ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium text-brand hover:text-brand-strong"
                >
                  {attachment.file_name}
                </a>
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
                  {attachment.file_name}
                </span>
              )}
              <span className="shrink-0 text-xs text-ink-subtle">
                {formatSize(attachment.size_bytes)}
              </span>
              <form action={deleteHomeworkAttachmentAction}>
                <input type="hidden" name="id" value={attachment.id} />
                <input type="hidden" name="homeworkId" value={homeworkId} />
                <button
                  type="submit"
                  className="shrink-0 text-xs text-ink-subtle hover:text-danger"
                  aria-label={`Remove ${attachment.file_name}`}
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {state.error && (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="homeworkId" value={homeworkId} />
        <input
          type="file"
          name="file"
          required
          className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-surface-muted"
        />
        <UploadButton />
      </form>
    </div>
  );
}
