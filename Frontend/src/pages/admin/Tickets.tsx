import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatView } from "@/components/ChatView";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/format";

interface OpenTicket { id: string; studentName: string; subject: string; createdAt: string; }
interface MyTicket { id: string; studentName: string; subject: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; lastMessageAt: string; }

export default function AdminTickets() {
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTicket, setActiveTicket] = useState<{ id: string; subject: string; status: string } | null>(null);

  const fetchOpen = () => api<OpenTicket[]>("/api/admin/chatbox/open").then(setOpenTickets).catch((e) => setError(e.message));
  const fetchMine = () => api<MyTicket[]>("/api/admin/chatbox/mine").then(setMyTickets).catch((e) => setError(e.message));

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchOpen(), fetchMine()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const takeTicket = async (id: string) => {
    try {
      await api(`/api/admin/chatbox/${id}/take`, { method: "PATCH" });
      setTab("mine");
      fetchAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to take ticket");
    }
  };

  if (activeTicket) {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-4">{activeTicket.subject}</h1>
        <ChatView
          ticketId={activeTicket.id}
          ticketStatus={activeTicket.status}
          onBack={() => { setActiveTicket(null); fetchAll(); }}
          onStatusChange={fetchAll}
          isAdmin
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">Tickets</h1>

      <div className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab("open")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all duration-150 ${tab === "open" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Open & Unassigned
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all duration-150 ${tab === "mine" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          My Tickets
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mb-4">
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonTable cols={4} />
      ) : tab === "open" ? (
        openTickets.length === 0 ? (
          <EmptyState title="No open tickets" description="All tickets have been assigned." />
        ) : (
          <div className="table-wrapper">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Student</th>
                  <th className="table-th">Subject</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {openTickets.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                    <td className="table-td text-foreground font-medium">{t.studentName}</td>
                    <td className="table-td text-foreground">{t.subject}</td>
                    <td className="table-td text-muted-foreground">{timeAgo(t.createdAt)}</td>
                    <td className="table-td">
                      <button onClick={() => takeTicket(t.id)} className="text-[13px] px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all active:scale-[0.98]">
                        Take Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        myTickets.length === 0 ? (
          <EmptyState title="No tickets" description="You haven't taken any tickets yet." />
        ) : (
          <div className="table-wrapper">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Student</th>
                  <th className="table-th">Subject</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Last Activity</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {myTickets.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                    <td className="table-td text-foreground font-medium">{t.studentName}</td>
                    <td className="table-td text-foreground">{t.subject}</td>
                    <td className="table-td"><StatusBadge status={t.status} /></td>
                    <td className="table-td text-muted-foreground">{timeAgo(t.lastMessageAt)}</td>
                    <td className="table-td">
                      <button onClick={() => setActiveTicket(t)} className="text-[13px] text-primary font-medium hover:underline">
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
