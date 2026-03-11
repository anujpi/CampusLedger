import { cn } from "@/lib/utils";

type FeeStatus = "PENDING" | "PAID" | "DELAYED";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface StatusBadgeProps {
  status: FeeStatus | TicketStatus;
  className?: string;
}

const config: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-status-pending-bg text-status-pending ring-status-pending/20" },
  PAID: { label: "Paid", classes: "bg-status-paid-bg text-status-paid ring-status-paid/20" },
  DELAYED: { label: "Delayed", classes: "bg-status-delayed-bg text-status-delayed ring-status-delayed/20" },
  OPEN: { label: "Open", classes: "bg-status-open-bg text-status-open ring-status-open/20" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-status-in-progress-bg text-status-in-progress ring-status-in-progress/20" },
  RESOLVED: { label: "Resolved", classes: "bg-status-resolved-bg text-status-resolved ring-status-resolved/20" },
  CLOSED: { label: "Closed", classes: "bg-status-closed-bg text-status-closed ring-status-closed/20" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = config[status] || { label: status, classes: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", c.classes, className)}>
      {c.label}
    </span>
  );
}
