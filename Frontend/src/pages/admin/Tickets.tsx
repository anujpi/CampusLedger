import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatView } from "@/components/ChatView";
import { SkeletonTable } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/format";
import { MessageSquare, ChevronRight, Clock, User, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface OpenTicket { id: string; studentName: string; subject: string; createdAt: string; }
interface MyTicket { id: string; studentName: string; subject: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; lastMessageAt: string; }

export default function AdminTickets() {
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [openTickets, setOpenTickets] = useState<OpenTicket[]>([]);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTicket, setActiveTicket] = useState<{ id: string; subject: string; status: string } | null>(null);

  const fetchOpen = () => api<OpenTicket[]>("/api/admin/chatbox/open").then(setOpenTickets).catch(e => setError(e.message));
  const fetchMine = () => api<MyTicket[]>("/api/admin/chatbox/mine").then(setMyTickets).catch(e => setError(e.message));

  const fetchAll = async () => {
    setLoading(true); setError("");
    await Promise.all([fetchOpen(), fetchMine()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const takeTicket = async (id: string) => {
    try {
      await api(`/api/admin/chatbox/${id}/take`, { method: "PATCH" });
      setTab("mine"); fetchAll();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  if (activeTicket) return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4 truncate">{activeTicket.subject}</h1>
      <ChatView ticketId={activeTicket.id} ticketStatus={activeTicket.status}
        onBack={() => { setActiveTicket(null); fetchAll(); }} onStatusChange={fetchAll} isAdmin />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mb-8">
        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.15em] mb-1">Admin Terminal</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Support Queue</h1>
        <p className="text-sm text-white/40 mt-1">{openTickets.length} unassigned · {myTickets.length} in my queue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open Tickets", value: openTickets.length, color: "text-white" },
          { label: "My Active", value: myTickets.filter(t => t.status !== "RESOLVED" && t.status !== "CLOSED").length, color: "text-amber-400" },
          { label: "Resolved", value: myTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.02] border border-white/[0.07] rounded-xl p-1 w-fit mb-6">
        {[{ id: "open", label: "Open & Unassigned" }, { id: "mine", label: "My Tickets" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white/[0.07] text-white" : "text-white/30 hover:text-white/60"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-4">⚠ {error}</div>}

      {loading ? <SkeletonTable cols={4} /> : tab === "open" ? (
        openTickets.length === 0 ? <EmptyState title="No open tickets" description="All tickets have been assigned." /> : (
          <div className="space-y-3">
            {openTickets.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{t.studentName}</p>
                  <p className="text-white/50 text-xs truncate mt-0.5">{t.subject}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-white/20" />
                    <p className="text-[11px] text-white/25 font-medium">{timeAgo(t.createdAt)}</p>
                  </div>
                </div>
                <button onClick={() => takeTicket(t.id)}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-all whitespace-nowrap">
                  Take Ticket
                </button>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        myTickets.length === 0 ? <EmptyState title="No tickets" description="You haven't taken any tickets yet." /> : (
          <div className="space-y-3">
            {myTickets.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setActiveTicket(t)}
                className="group flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{t.studentName}</p>
                  <p className="text-white/40 text-xs truncate mt-0.5">{t.subject}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={t.status} />
                  <p className="text-xs text-white/25 hidden sm:block">{timeAgo(t.lastMessageAt)}</p>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
