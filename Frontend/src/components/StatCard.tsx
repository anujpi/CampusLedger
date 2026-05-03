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
    <div className="card-clean p-5 group flex flex-col justify-between h-32 hover:-translate-y-0.5">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${accent.dot} text-${borderColor}-500`} />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
    </div>
  );
}
