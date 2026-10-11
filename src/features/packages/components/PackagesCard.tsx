import { Card } from "../../../components/Card";
import { ConfirmSubmitForm } from "../../../components/ConfirmSubmitForm";
import { formatMoney } from "../../../lib/formatting";
import { createPackageAction, deletePackageAction } from "../actions";
import type { PackageBalance } from "../balance";
import type { PackageWithBalance } from "../data";
import { PackageForm } from "./PackageForm";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3 py-2">
      <p className="text-xs text-ink-subtle">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

export function PackagesCard({
  studentId,
  packages,
  totals,
  locale,
  defaultCurrency,
}: {
  studentId: string;
  packages: PackageWithBalance[];
  totals: PackageBalance;
  locale: string;
  defaultCurrency: string;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Lesson packages</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Prepaid sets of lessons, for example 10 lessons at a lower price. New and upcoming lessons
          are marked paid automatically while the student has lessons left. A lesson is{" "}
          <span className="font-medium text-ink">booked</span> when it is scheduled and only{" "}
          <span className="font-medium text-ink">used</span> once it has happened, so a cancelled
          lesson gives its credit back.
        </p>
      </div>

      {packages.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Remaining" value={totals.remaining} />
            <Stat label="Booked" value={totals.booked} />
            <Stat label="Used" value={totals.used} />
            <Stat label="Bought" value={totals.total} />
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {packages.map((pkg) => (
              <li
                key={pkg.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {pkg.total_lessons} lessons
                    {pkg.price !== null && pkg.currency
                      ? ` · ${formatMoney(pkg.price, pkg.currency, locale)}`
                      : ""}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {pkg.remaining} left · {pkg.booked} booked · {pkg.used} used ·{" "}
                    {new Date(pkg.purchased_at).toLocaleDateString(locale)}
                    {pkg.note ? ` · ${pkg.note}` : ""}
                  </p>
                </div>
                <ConfirmSubmitForm
                  action={deletePackageAction}
                  confirmMessage="Delete this package? Its upcoming lessons become unpaid again. Lessons already held stay paid."
                  label="Delete"
                >
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <input type="hidden" name="studentId" value={studentId} />
                </ConfirmSubmitForm>
              </li>
            ))}
          </ul>
        </>
      )}

      <PackageForm
        action={createPackageAction}
        studentId={studentId}
        defaultCurrency={defaultCurrency}
      />
    </Card>
  );
}
