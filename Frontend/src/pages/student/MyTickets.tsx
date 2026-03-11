import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Drawer } from "@/components/Drawer";
import { ChatView } from "@/components/ChatView";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/format";

interface Ticket {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  lastMessageAt: string;
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await api<Ticket[]>("/api/student/chatbox");
      setTickets(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const activeCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  const handleCreate = async () => {
    setCreating(true);
    setCreateError("");
    try {
      await api("/api/student/chatbox", { method: "POST", body: { subject, firstMessage: message } });
      setDrawerOpen(false);
      setSubject("");
      setMessage("");
      fetchTickets();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  if (activeTicket) {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-4">{activeTicket.subject}</h1>
        <ChatView
          ticketId={activeTicket.id}
          ticketStatus={activeTicket.status}
          onBack={() => { setActiveTicket(null); fetchTickets(); }}
          onStatusChange={fetchTickets}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">My Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} / 5 active tickets</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          disabled={activeCount >= 5}
          className="btn-primary w-auto px-5"
        >
          Raise New Ticket
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mb-4">
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonTable cols={4} />
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets" description="You haven't raised any tickets yet." />
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-th">Subject</th>
                <th className="table-th">Status</th>
                <th className="table-th">Last Activity</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="table-td text-foreground font-medium">{t.subject}</td>
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
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Raise New Ticket">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder="Brief summary of your issue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="input-field resize-none" placeholder="Describe your issue in detail" />
          </div>
          {createError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
              <span>⚠</span><span>{createError}</span>
            </div>
          )}
          <button onClick={handleCreate} disabled={creating || !subject.trim() || !message.trim()} className="btn-primary">
            {creating ? "Creating…" : "Submit Ticket"}
          </button>
        </div>
      </Drawer>
    </div>
  );
}
