import type { ReactNode } from "react";

export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <header className="admin-heading">
    <div><h1>{title}</h1><p>{description}</p></div>
    {actions && <div className="admin-heading-actions">{actions}</div>}
  </header>;
}
