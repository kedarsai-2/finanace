import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReportShell({
  title,
  description,
  onExportCsv,
  filters,
  children,
}: {
  title: string;
  description?: string;
  onExportCsv: () => void;
  filters: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/reports">
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>
      </Button>

      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportCsv}>
              <Download className="mr-2 h-4 w-4" /> CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section className="mb-4 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-end gap-3">{filters}</div>
      </section>

      {children}
    </div>
  );
}
