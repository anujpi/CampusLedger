import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatView } from "@/components/ChatView";
import { timeAgo } from "@/lib/format";
import { Plus, MessageSquare, Clock, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Ticket {
  id: string; subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  lastMessageAt: string;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-white/10 text-white border-white/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CLOSED: "bg-white/5 text-white/30 border-white/10",
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");

  const fetchTickets = async () => {
    try {
      const data = await api<Ticket[]>("/api/student/chatbox");
      setTickets(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const activeCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  const handleCreate = async () => {
    setCreating(true); setCreateError("");
    try {
      await api("/api/student/chatbox", { method: "POST", body: { subject, firstMessage: message } });
      setIsModalOpen(false); setSubject(""); setMessage(""); fetchTickets();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create ticket");
    } finally { setCreating(false); }
  };

  if (activeTicket) return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4 truncate">{activeTicket.subject}</h1>
      <ChatView
        ticketId={activeTicket.id} ticketStatus={activeTicket.status}
        onBack={() => { setActiveTicket(null); fetchTickets(); }} onStatusChange={fetchTickets}
      />
    </div>
  );

  const filtered = tickets.filter(t =>
    activeTab === "active"
      ? (t.status === "OPEN" || t.status === "IN_PROGRESS")
      : (t.status === "RESOLVED" || t.status === "CLOSED")
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-white/20 uppercase tracking-[0.15em] mb-1">Student Portal</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Support Tickets</h1>
          <p className="text-sm text-white/40 mt-1">{activeCount} active · {5 - activeCount} slots remaining</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)} disabled={activeCount >= 5}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-40">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {error && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-5">⚠ {error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.02] border border-white/[0.07] rounded-xl p-1 w-fit mb-6">
        {(["active", "resolved"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? "bg-white/[0.07] text-white" : "text-white/30 hover:text-white/60"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.02] rounded-2xl border border-white/[0.04] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-white/30 font-medium text-sm">No {activeTab} tickets</p>
          <p className="text-white/15 text-xs mt-1">{activeTab === "active" ? "Raise a new ticket to get help." : "Resolved tickets will appear here."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setActiveTicket(t)}
              className="group flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-white/20" />
                  <p className="text-xs text-white/30 font-medium">{timeAgo(t.lastMessageAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[t.status] || ""}`}>
                  {t.status.replace("_", " ")}
                </span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-950 w-full max-w-md p-7 rounded-3xl relative z-10 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Raise New Ticket</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/25 placeholder:text-white/20"
                    placeholder="Brief summary of your issue" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/25 resize-none placeholder:text-white/20"
                    placeholder="Describe your issue in detail..." />
                </div>
                {createError && <p className="text-red-400 text-xs bg-red-950/20 border border-red-900/30 rounded-lg p-2">⚠ {createError}</p>}
                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:bg-white/[0.05] transition-colors">Cancel</button>
                  <button onClick={handleCreate} disabled={creating || !subject.trim() || !message.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-40 min-w-[130px] flex items-center justify-center">
                    {creating ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Submit Ticket"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
