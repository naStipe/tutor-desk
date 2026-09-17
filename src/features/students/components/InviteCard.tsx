"use client";

import { useTransition, useState } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { inputClassName } from "../../../components/Field";
import { generateStudentInviteAction } from "../actions";
import type { PortalRole } from "../data";

const ROLE_LABELS: Record<PortalRole, string> = {
  learner: "Learner",
  guardian: "Guardian",
  payer: "Payer",
};

const ROLE_OPTIONS: PortalRole[] = ["learner", "guardian", "payer"];

export function InviteCard({
  studentId,
  members,
  pendingInvites,
}: {
  studentId: string;
  members: { id: string; role: string }[];
  pendingInvites: { id: string; role: string; email: string | null }[];
}) {
  const [role, setRole] = useState<PortalRole>("learner");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    setCopied(false);
    setLink(null);
    startTransition(async () => {
      const result = await generateStudentInviteAction(studentId, role);
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
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Portal access</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Invite the student, a parent, or anyone else who should see this student's schedule,
          homework, or balance. Each person accepts their own link.
        </p>
      </div>

      {members.length > 0 && (
        <ul className="space-y-1">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between text-sm">
              <span className="text-ink">{ROLE_LABELS[member.role as PortalRole]}</span>
              <span className="text-ink-subtle">Linked</span>
            </li>
          ))}
        </ul>
      )}

      {pendingInvites.length > 0 && (
        <ul className="space-y-1">
          {pendingInvites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between text-sm">
              <span className="text-ink">{ROLE_LABELS[invite.role as PortalRole]}</span>
              <span className="text-ink-subtle">Invite pending</span>
            </li>
          ))}
        </ul>
      )}

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
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as PortalRole)}
            className={inputClassName}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
          <Button type="button" onClick={handleGenerate} disabled={pending} className="shrink-0">
            {pending ? "Generating…" : "Generate invite link"}
          </Button>
        </div>
      )}
    </Card>
  );
}
