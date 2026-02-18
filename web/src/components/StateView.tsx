import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function StateView({ title, subtitle, action }: Props) {
  return (
    <div className="state-view">
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
      {action}
    </div>
  );
}
