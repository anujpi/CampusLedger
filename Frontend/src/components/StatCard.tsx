export function StatCard({
  label,
  value,
  borderColor,
}: {
  label: string;
  value: string;
  borderColor: "blue" | "amber" | "green" | "red";
}) {
  const accentClasses: Record<string, { border: string; bg: string; dot: string }> = {
    blue: { border: "border-l-stat-blue", bg: "bg-stat-blue/5", dot: "bg-stat-blue" },
    amber: { border: "border-l-stat-amber", bg: "bg-stat-amber/5", dot: "bg-stat-amber" },
    green: { border: "border-l-stat-green", bg: "bg-stat-green/5", dot: "bg-stat-green" },
    red: { border: "border-l-stat-red", bg: "bg-stat-red/5", dot: "bg-stat-red" },
  };

  const accent = accentClasses[borderColor];

  return (
    <div className={`bg-card rounded-xl border border-border border-l-[3px] ${accent.border} p-5 card-elevated transition-all duration-200 hover:card-elevated-md hover:scale-[1.02] hover:-translate-y-0.5`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${accent.dot}`} />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-foreground tracking-tight">{value}</p>
    </div>
  );
}
