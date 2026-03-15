import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { SkeletonCards } from "@/components/Skeletons";

interface Overview {
  fullName: string;
  branch: string;
  year: number;
  totalFeesCount: number;
  pendingCount: number;
  paidCount: number;
  totalDue: number;
  totalPaid: number;
}

export default function StudentDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Overview>("/api/student/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (error) return (
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
      <span>⚠</span><span>{error}</span>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      {data ? (
        <>
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold text-foreground tracking-tight">
              {greeting()}, {data.fullName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data.branch} · Year {data.year}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard label="Total Fees" value={`${data.totalFeesCount} fees`} borderColor="blue" />
  <StatCard label="Pending" value={`${data.pendingCount} unpaid`} borderColor="amber" />
  <StatCard label="Total Paid" value={formatINR(data.totalPaid)} borderColor="green" />
  <StatCard label="Total Due" value={formatINR(data.totalDue)} borderColor="red" />
</div>
        </>
      ) : (
        <>
          <div className="mb-8">
            <div className="h-8 w-64 bg-muted rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-40 bg-muted rounded-lg animate-pulse" />
          </div>
          <SkeletonCards />
        </>
      )}
    </div>
  );
}
