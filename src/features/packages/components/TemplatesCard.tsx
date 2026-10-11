import { Card } from "../../../components/Card";
import { ConfirmSubmitForm } from "../../../components/ConfirmSubmitForm";
import { formatMoney } from "../../../lib/formatting";
import { createPackageTemplateAction, deletePackageTemplateAction } from "../actions";
import type { PackageTemplate } from "../data";
import { TemplateForm } from "./TemplateForm";

/** Settings card: the tutor's fixed packages, applied to students from their Billing tab. */
export function TemplatesCard({
  templates,
  locale,
  defaultCurrency,
}: {
  templates: PackageTemplate[];
  locale: string;
  defaultCurrency: string;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Lesson packages</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Fixed sets of lessons you sell, for example 10 lessons at a lower price. Add a student to
          a package from the Billing tab of their page.
        </p>
      </div>

      {templates.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{template.name}</p>
                <p className="text-xs text-ink-muted">
                  {template.total_lessons} lessons
                  {template.price !== null && template.currency
                    ? ` · ${formatMoney(template.price, template.currency, locale)}`
                    : ""}
                </p>
              </div>
              <ConfirmSubmitForm
                action={deletePackageTemplateAction}
                confirmMessage="Delete this package? Students who already have it keep their lessons."
                label="Delete"
              >
                <input type="hidden" name="templateId" value={template.id} />
              </ConfirmSubmitForm>
            </li>
          ))}
        </ul>
      )}

      <TemplateForm action={createPackageTemplateAction} defaultCurrency={defaultCurrency} />
    </Card>
  );
}
