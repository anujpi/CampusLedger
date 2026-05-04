import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCards } from "@/components/Skeletons";
import { Calendar, MapPin, Check, Clock } from "lucide-react";

interface MyEvent {
  eventMemberId: number;
  eventId: number;
  eventName: string;
  clubName: string;
  clubId: number;
  description: string | null;
  dueAt: string;
  venue: string | null;
  paymentRequired: boolean;
  paymentDone: boolean;
}

function MyEventsContent() {
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

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const u: MyEvent[] = [];
    const p: MyEvent[] = [];
    for (const e of events) {
      const t = new Date(e.dueAt).getTime();
      if (Number.isNaN(t)) {
        u.push(e);
        continue;
      }
      if (t >= now) u.push(e);
      else p.push(e);
    }
    u.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    p.sort((a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime());
    return { upcoming: u, past: p };
  }, [events]);

  const navigate = useNavigate();

  if (error)
    return (
      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
        <span>⚠</span>
        <span>{error}</span>
      </div>
    );

  if (loading) return <SkeletonCards count={4} />;

  if (events.length === 0) {
    return (
      <EmptyState title="No events found" description="You have not registered for any club events yet. Browse clubs and join an event from a club page." />
    );
  }

  const card = (evt: MyEvent, isPast: boolean) => (
    <div
      key={`${evt.clubId}-${evt.eventId}`}
      className={`card-clean p-6 flex flex-col justify-between h-full group ${
        isPast ? "opacity-85" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
          {evt.eventName}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
            isPast
              ? "bg-muted text-muted-foreground border-border"
              : "bg-accent text-accent-foreground border-border"
          }`}
        >
          {isPast ? "Past" : "Upcoming"}
        </span>
      </div>

      <p className="text-xs font-medium text-muted-foreground mb-1">{evt.clubName}</p>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
        {evt.description?.trim() || "Club event — open the club page for full details."}
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center text-[13px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border">
          <Clock className="w-4 h-4 mr-2 shrink-0 opacity-70" />
          <span className="font-semibold text-foreground w-16 shrink-0">When:</span>
          <span>{evt.dueAt ? new Date(evt.dueAt).toLocaleString() : "TBD"}</span>
        </div>
        <div className="flex items-center text-[13px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border">
          <MapPin className="w-4 h-4 mr-2 shrink-0 opacity-70" />
          <span className="font-semibold text-foreground w-16 shrink-0">Place:</span>
          <span>{evt.venue?.trim() || "TBD"}</span>
        </div>
        {evt.paymentRequired && (
          <div className="flex items-center text-[13px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border">
            <Check className="w-4 h-4 mr-2 shrink-0 opacity-70" />
            <span className="font-semibold text-foreground w-16 shrink-0">Payment:</span>
            <span>{evt.paymentDone ? "Paid" : "Pending"}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(`/student/clubs/${evt.clubId}`)}
        className="mt-5 text-sm font-semibold text-primary hover:underline text-left"
      >
        Open club →
      </button>
    </div>
  );

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Upcoming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{upcoming.map((e) => card(e, false))}</div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4 text-muted-foreground">
            Past events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{past.map((e) => card(e, true))}</div>
        </section>
      )}
    </div>
  );
}

export default function StudentEvents() {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Events</h1>
        <p className="text-sm text-muted-foreground mt-2 font-medium">
          Events you are registered for — including ones that already took place.
        </p>
      </div>
      <MyEventsContent />
    </div>
  );
}
