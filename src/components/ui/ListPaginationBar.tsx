import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ListPaginationBar({
  page,
  totalPages,
  totalCount,
  rangeFrom,
  rangeTo,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  rangeFrom: number;
  rangeTo: number;
  onPageChange: (p: number) => void;
  className?: string;
}) {
  if (totalCount === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {rangeFrom}–{rangeTo}
        </span>{" "}
        of {totalCount.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-28 text-center text-sm tabular-nums text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
