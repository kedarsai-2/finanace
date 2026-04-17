import { ReactNode } from "react";

interface Props {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ step, title, description, children }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <header className="mb-6 flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
          {step}
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
