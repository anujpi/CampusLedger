import { useEffect, useRef, useState } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { formatDate } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "@/hooks/useNotifications";
import { useNotificationContext } from "@/context/NotificationContext";
import { Calendar, Megaphone } from "lucide-react";

interface FeeNotification {
  feeId: number;
  semester: number;
  context: string;
  createdAt: string;
  dueDate: string;
}
interface ClubInvite {
  clubId: number;
  clubName: string;
  description: string;
  leaderName: string;
}

export default function Notifications() {
  const [tab, setTab] = useState<"fees" | "club">("fees");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clubActivityNotifications } = useNotificationContext();
  const [clubInvites, setClubInvites] = useState<ClubInvite[]>([]);
  const [requestedClubs, setRequestedClubs] = useState<Set<number>>(new Set());
  const stompRef = useRef<Client | null>(null);

  const { items, loading, hasMore, loaderRef } =
    useInfiniteScroll<FeeNotification>("/api/student/notifications/fees");

  useEffect(() => {
    const stored = localStorage.getItem("clubInvites");
    if (stored) setClubInvites(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/club-invites", (frame) => {
          const invite: ClubInvite = JSON.parse(frame.body);
          setClubInvites((prev) => {
            const exists = prev.some((i) => i.clubId === invite.clubId);
            if (exists) return prev;
            const updated = [invite, ...prev];
            localStorage.setItem("clubInvites", JSON.stringify(updated));
            return updated;
          });
        });
      },
      onStompError: () => client.deactivate(),
      onWebSocketError: () => client.deactivate(),
    });
    client.activate();
    stompRef.current = client;
    return () => {
      client.deactivate();
    };
  }, []);

  const handleRequestJoin = async (invite: ClubInvite) => {
    if (!user) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8080/api/club/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: user.fullName, email: user.email, clubId: invite.clubId }),
      });
      if (res.ok || res.status === 500) {
        setRequestedClubs((prev) => new Set([...prev, invite.clubId]));
      } else {
        alert("Failed to send request. Try again.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const clubTabCount = clubInvites.length + clubActivityNotifications.length;

  const formatDue = (dueAt: string) => {
    try {
      const d = new Date(dueAt);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
      return dueAt;
    } catch {
      return dueAt;
    }
  };

  const TABS: { key: "fees" | "club"; label: string }[] = [
    { key: "fees", label: "Fees" },
    { key: "club", label: clubTabCount > 0 ? `Club (${clubTabCount})` : "Club" },
  ];

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">Notifications</h1>

      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fees" && (
        <div className="space-y-3">
          {items.length === 0 && !loading && (
            <EmptyState title="No notifications" description="No fee notifications yet." />
          )}
          {items.map((n) => (
            <div
              key={n.feeId}
              role="button"
              tabIndex={0}
              onClick={() => navigate("/student/fees")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/student/fees")}
              className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:bg-accent/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.context}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Semester {n.semester} · Created {formatDate(n.createdAt)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  Due {formatDate(n.dueDate)}
                </span>
              </div>
            </div>
          ))}
          <div ref={loaderRef} className="py-4 flex justify-center">
            {loading && <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            {!hasMore && items.length > 0 && <p className="text-xs text-muted-foreground">All caught up</p>}
          </div>
        </div>
      )}

      {tab === "club" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Club activity
            </h2>
            {clubActivityNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                When your clubs publish new activity, it will show here even if you are not in chat.
              </p>
            ) : (
              <div className="space-y-3">
                {clubActivityNotifications.map((n) => (
                  <div
                    key={`${n.clubId}-${n.eventId}-${n.receivedAt}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/student/clubs/${n.clubId}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/student/clubs/${n.clubId}`)}
                    className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/25 hover:bg-accent/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        New activity
                      </span>
                      <span className="text-xs text-muted-foreground">{n.clubName}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{n.eventName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {n.venue ? `${n.venue} · ` : ""}
                      {formatDue(n.dueAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Tap to open the club</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Invitations
            </h2>
            {clubInvites.length === 0 ? (
              <EmptyState
                title="No invitations"
                description="When a club leader sends a broadcast invitation, it will appear here."
              />
            ) : (
              <div className="space-y-3">
                {clubInvites.map((invite) => {
                  const requested = requestedClubs.has(invite.clubId);
                  return (
                    <div
                      key={invite.clubId}
                      className="bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Invitation
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground">{invite.clubName}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {invite.description || "Join this club to connect with fellow students!"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            From <span className="text-foreground font-medium">{invite.leaderName}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => !requested && handleRequestJoin(invite)}
                          disabled={requested}
                          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            requested
                              ? "bg-muted text-muted-foreground cursor-default"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          }`}
                        >
                          {requested ? "✓ Requested" : "Request to join"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
