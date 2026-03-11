export function SemesterTabs({
  active,
  onChange,
}: {
  active: number;
  onChange: (sem: number) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
        <button
          key={sem}
          onClick={() => onChange(sem)}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all duration-150 whitespace-nowrap ${
            active === sem
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Sem {sem}
        </button>
      ))}
    </div>
  );
}
