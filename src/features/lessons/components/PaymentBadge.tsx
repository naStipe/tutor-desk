import { Badge, type BadgeTone } from "../../../components/Badge";
import type { PaymentStatus } from "../schemas";

const PAYMENT_TONES: Record<PaymentStatus, BadgeTone> = {
  unpaid: "warning",
  paid: "brand",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
};

export function PaymentBadge({ status }: { status: PaymentStatus | string }) {
  const key = (status in PAYMENT_TONES ? status : "unpaid") as PaymentStatus;
  return <Badge tone={PAYMENT_TONES[key]}>{PAYMENT_LABELS[key]}</Badge>;
}
