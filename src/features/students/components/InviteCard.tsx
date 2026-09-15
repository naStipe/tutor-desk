"use client";

import { useTransition, useState } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { inputClassName } from "../../../components/Field";
import { generateStudentInviteAction } from "../actions";

export function InviteCard({ studentId, linked }: { studentId: string; linked: boolean }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (linked) {
    return (
      <Card>
        <h2 className="text-sm font-semibold text-ink">Student portal</h2>
        <p className="mt-1 text-sm text-ink-muted">
          This student has linked their own account and can sign in to see their schedule and
          homework.
        </p>
      </Card>
    );
  }

  function handleGenerate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await generateStudentInviteAction(studentId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setLink(`${window.location.origin}/invite/${result.token}`);
    });
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink">Student portal</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Generate a one-time link so this student can create their own account and see their
          schedule and homework.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {link ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input readOnly value={link} className={inputClassName} />
            <Button type="button" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-ink-subtle">Expires in 7 days and can only be used once.</p>
        </div>
      ) : (
        <Button type="button" onClick={handleGenerate} disabled={pending}>
          {pending ? "Generating…" : "Generate invite link"}
        </Button>
      )}
    </Card>
  );
}
