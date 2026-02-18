import type { ReactNode } from "react";

type Props = {
  title: string;
  value: ReactNode;
  hint?: string;
};

export function StatusCard({ title, value, hint }: Props) {
  return (
    <article className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      {hint ? <div className="card-hint">{hint}</div> : null}
    </article>
  );
}
