import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCards } from "@/components/Skeletons";
import { Users, Plus, X, Crown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Club { id: number; name: string; description: string; }

export default function AdminClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [clubEvents, setClubEvents] = useState<any[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [leaderId, setLeaderId] = useState("");
  const [leaderLoading, setLeaderLoading] = useState(false);

  const fetchClubs = () => {
    setLoading(true);
    api<Club[]>("/api/club/find/all").then(setClubs).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchClubs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api("/api/club/new", {
        method: "POST",
        body: { name: newName, description: newDesc },
      });
      setIsCreating(false); setNewName(""); setNewDesc(""); fetchClubs();
      toast.success("Club created successfully!");
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setCreateLoading(false); 
    }
  };

  const fetchClubDetails = async (club: Club) => {
    setSelectedClub(club);
    setClubLoading(true);
    try {
      const members = await api<any[]>(`/api/club/members/${club.id}`);
      setClubMembers(members);
      // Mocking events for now as seen in the design, or we could fetch if endpoint exists
      setClubEvents([
        { id: 1, title: "Neural Net Workshop II", subtitle: "Lead by Dr. Sterling in the main auditorium." },
        { id: 2, title: "Droneracing Prelims", subtitle: "Regional qualification rounds for Alpha squad." },
        { id: 3, title: "Quarterly Inventory Sync", subtitle: "Standard hardware check for sensor arrays." }
      ]);
    } catch (e) {
      console.error("Failed to fetch club details", e);
    } finally {
      setClubLoading(false);
    }
  };

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderId || !selectedClub) return;
    try {
      const res = await api<string>(`/api/club/addleaders/${selectedClub.id}/${leaderId}`, { method: "POST" });
      if (res === "Invalid input") throw new Error("A leader already exists or invalid user.");
      toast.success("Leader assigned successfully!");
      fetchClubDetails(selectedClub);
      setLeaderId("");
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setLeaderLoading(false); 
    }
  };

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-white/20 uppercase tracking-[0.15em] mb-1">Admin Terminal</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Club Oversight</h1>
          <p className="text-sm text-white/40 mt-1">{clubs.length} clubs registered</p>
        </div>
        <button onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">
          <Plus className="w-4 h-4" /> New Club
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="Search clubs..." />
      </div>

      {error && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-4">⚠ {error}</div>}

      {loading ? <SkeletonCards count={6} /> : filtered.length === 0 ? (
        <EmptyState title="No clubs found" description="Create your first club to get started." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((club, i) => (
            <motion.div key={club.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="group bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all flex flex-col justify-between">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="text-indigo-400 font-black text-lg">{club.name.charAt(0)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/[0.03] px-2 py-1 rounded-lg">ID {club.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{club.name}</h3>
                <p className="text-sm text-white/40 line-clamp-3 leading-relaxed flex-grow">{club.description || "No description provided."}</p>
                <button onClick={() => fetchClubDetails(club)}
                  className="mt-6 w-fit flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all group/btn">
                  <span className="w-6 h-[1px] bg-white/20 group-hover/btn:w-10 group-hover/btn:bg-indigo-500 transition-all" />
                  Full Oversight
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Oversight Details View (Large Overlay) */}
      <AnimatePresence>
        {selectedClub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedClub(null)} />
            
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 30 }}
              className="bg-neutral-950 w-full max-w-6xl h-full max-h-[90vh] rounded-[40px] relative z-10 shadow-2xl border border-white/10 overflow-hidden flex flex-col">
              
              {/* Header section from Zenith screen */}
              <div className="p-10 pb-6 border-b border-white/[0.05]">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-indigo-400 font-black text-2xl">{selectedClub.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-4xl font-bold text-white tracking-tight">{selectedClub.name}</h2>
                      <p className="text-sm text-indigo-400/60 font-bold uppercase tracking-widest mt-1">Club Oversight Terminal</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedClub(null)} className="p-3 rounded-2xl text-white/20 hover:text-white hover:bg-white/[0.05] transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-lg text-white/60 max-w-3xl leading-relaxed">
                  {selectedClub.description || "Leading the university's initiative in mechatronics and software integration."}
                </p>
              </div>

              <div className="flex-grow overflow-y-auto p-10 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  
                  {/* LEFT: Recent Events */}
                  <div className="lg:col-span-1 space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                        Recent Events
                      </h3>
                      <div className="space-y-4">
                        {clubEvents.map(evt => (
                          <div key={evt.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group">
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{evt.title}</h4>
                            <p className="text-xs text-white/40 mt-1">{evt.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Manage Leaders Form */}
                    <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                      <h4 className="text-sm font-bold text-white mb-4">Assign New Leader</h4>
                      <form onSubmit={handleAddLeader} className="space-y-3">
                        <input type="number" value={leaderId} onChange={e => setLeaderId(e.target.value)} required
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500/50 outline-none"
                          placeholder="Student User ID..." />
                        <button type="submit" disabled={leaderLoading}
                          className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
                          {leaderLoading ? "Processing..." : "Add to Leadership"}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT: Member Directory */}
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                      Member Directory
                    </h3>
                    <div className="table-wrapper !bg-transparent !border-white/[0.05]">
                      <table className="w-full text-sm">
                        <thead className="table-header !bg-white/[0.02] !border-white/[0.05]">
                          <tr>
                            <th className="table-th !text-white/30">Name</th>
                            <th className="table-th !text-white/30">Email</th>
                            <th className="table-th !text-white/30">Role</th>
                            <th className="table-th !text-white/30">ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clubMembers.length === 0 ? (
                            <tr><td colSpan={4} className="table-td text-center text-white/20 py-12">No members found</td></tr>
                          ) : clubMembers.map((m) => (
                            <tr key={m.id} className="border-t border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                              <td className="table-td text-white font-bold">{m.user.fullName}</td>
                              <td className="table-td text-white/40">{m.user.email}</td>
                              <td className="table-td">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${m.role === 'LEADER' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                                  {m.role}
                                </span>
                              </td>
                              <td className="table-td text-white/20 font-mono">{m.user.id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreating(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-950 w-full max-w-md p-7 rounded-3xl relative z-10 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Create New Club</h3>
                <button onClick={() => setIsCreating(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Club Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/25 placeholder:text-white/20"
                    placeholder="e.g. Coding Club" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/25 resize-none placeholder:text-white/20"
                    placeholder="What is this club about?" />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:bg-white/[0.05] transition-colors">Cancel</button>
                  <button type="submit" disabled={createLoading}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center">
                    {createLoading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Create Club"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
