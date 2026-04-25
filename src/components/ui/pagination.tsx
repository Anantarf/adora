import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];

  // Generate page numbers to show
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push("ellipsis");
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }
    
    pages.push(totalPages);
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 mt-8", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center size-9 rounded-xl border border-border/50 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors"
      >
        <span className="sr-only">Halaman sebelumnya</span>
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((page, idx) => {
          if (page === "ellipsis") {
            return (
              <div key={`ellipsis-${idx}`} className="flex items-center justify-center size-9 text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </div>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "inline-flex items-center justify-center size-9 rounded-xl text-sm font-semibold transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center size-9 rounded-xl border border-border/50 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors"
      >
        <span className="sr-only">Halaman selanjutnya</span>
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
