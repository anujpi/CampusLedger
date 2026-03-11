export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-fade-in">
      <div className="table-wrapper">
        <div className="table-header px-4 py-3.5 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 bg-muted-foreground/10 rounded-full flex-1 animate-pulse" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-4 flex gap-4 border-t border-border">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3.5 bg-muted rounded-full flex-1 animate-pulse" style={{ animationDelay: `${(r * cols + c) * 50}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 border-l-[3px] border-l-muted card-elevated">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
            <div className="h-2.5 w-16 bg-muted rounded-full animate-pulse" />
          </div>
          <div className="h-7 w-28 bg-muted rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        </div>
      ))}
    </div>
  );
}
