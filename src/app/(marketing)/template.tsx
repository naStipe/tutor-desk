import type { ReactNode } from "react";

export default function MarketingTemplate({ children }: { children: ReactNode }) {
  return <div className="td-page-enter">{children}</div>;
}
