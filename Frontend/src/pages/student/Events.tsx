import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCards } from "@/components/Skeletons";

interface MyEvent {
  eventId: number;
  clubId: number;
  eventName: string;
  description: string;
  date: string;
  location: string;
  status: string;
}

export default function StudentEvents() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api<MyEvent[]>("/api/event/my")
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
      <span>⚠</span><span>{error}</span>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Events
        </h1>
        <p className="text-sm text-muted-foreground mt-2 font-medium">
          Events you have registered for or requested to join.
        </p>
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : events.length === 0 ? (
        <EmptyState title="No events found" description="You haven't registered for any events yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div key={`${evt.clubId}-${evt.eventId}`} className="card-clean p-6 flex flex-col justify-between h-full group">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{evt.eventName}</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground border border-border">
                  {evt.status || "Registered"}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {evt.description || "Join us for this amazing event. More details will be shared soon."}
              </p>
              
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center text-[13px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border">
                  <span className="font-semibold text-foreground w-20">Date:</span> 
                  {evt.date || "TBD"}
                </div>
                <div className="flex items-center text-[13px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border">
                  <span className="font-semibold text-foreground w-20">Location:</span> 
                  {evt.location || "TBD"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
