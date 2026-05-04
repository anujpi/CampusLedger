import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Hash, Users, Send, ArrowLeft,
  Megaphone, Check, X,
  Crown, Shield, Circle, Calendar,
  MapPin, Clock, DollarSign, Sparkles
} from "lucide-react";
import { PaymentGateway } from "@/components/PaymentGateway";

interface Club { id: number; name: string; description: string; }
interface ClubMember { id: number; user: { id: number; fullName: string; email: string }; role: string; status?: string; }
interface ChatMessage { id: number; author: string; content: string; time: string; isSystem?: boolean; }
interface ClubEvent {
  id: number;
  name: string;
  description: string;
  dueAt: string;
  paid: boolean;
  amount: number;
  solo: boolean;
  teamSize?: number;
  venue?: string;
  isJoined?: boolean;
  /** Present only for leaders/co-leaders */
  totalRevenue?: number | null;
  status?: "idle" | "loading" | "confirmed";
}

interface EventDetailsPayload {
  id: number;
  name: string;
  description: string;
  dueAt: string;
  venue?: string;
  paid: boolean;
  amount: number;
  isJoined: boolean;
  revenueCollected: number | null;
  paidRegistrations: number | null;
  pendingRegistrations: number | null;
}

interface EventMemberRow {
  eventMemberId: number;
  userId: number;
  userName: string;
  email: string;
  paymentDone: boolean | null;
  registeredAt?: string;
  teamName?: string;
}

function formatCurrencyINR(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function partitionEventsByTime(events: ClubEvent[]) {
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.dueAt).getTime() >= now)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const past = events
    .filter((e) => new Date(e.dueAt).getTime() < now)
    .sort((a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime());
  return { upcoming, past };
}

export default function ClubDashboard() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [applicants, setApplicants] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [viewMode, setViewMode] = useState<"details" | "sanctum">("details");

  const [activeTab, setActiveTab] = useState<"chat" | "applicants" | "pastEvents">("chat");
  const [activeChannel, setActiveChannel] = useState("general");
  
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, author: "System", content: "Welcome to the club chat! 🌟", time: "Today", isSystem: true },
  ]);

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", description: "", dueDate: "", amount: "0", solo: true, teamSize: "2", venue: "" });
  
  const [eventDetail, setEventDetail] = useState<{
    summary: ClubEvent;
    details: EventDetailsPayload | null;
    members: EventMemberRow[];
    loading: boolean;
  } | null>(null);
  
  const [pendingPayment, setPendingPayment] = useState<{ eventId: number, eventMemberId: number, amount: number, title: string } | null>(null);
  const [joiningEvent, setJoiningEvent] = useState<ClubEvent | null>(null);
  const [teamInfo, setTeamInfo] = useState({ teamName: "", teamDetails: "" });
  
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);

  const stompRef = useRef<Client | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isMember = members.some((m) => m.user.email === user?.email);
  const isLeader = members.some(
    (m) => m.user.email === user?.email && (m.role === "LEADER" || m.role === "CO_LEADER")
  );

  useEffect(() => {
    setLoading(true);
    api<Club[]>("/api/club/find/all")
      .then((clubs) => {
        const validClubs = Array.isArray(clubs) ? clubs : [];
        const found = validClubs.find((c) => c?.id === Number(clubId));
        if (!found) throw new Error("Club not found");
        setClub(found);
        return Promise.all([
          api<ClubMember[]>(`/api/club/members/${clubId}`).catch(() => []),
          api<ClubEvent[]>(`/api/event/club/${clubId}`).catch(() => [])
        ]);
      })
      .then(([m, evs]) => {
        setMembers(m);
        setEvents(
          evs.map((e) => ({
            ...e,
            amount: Number(e.amount ?? 0),
            totalRevenue: e.totalRevenue != null && e.totalRevenue !== undefined ? Number(e.totalRevenue) : null,
            status: e.isJoined ? "confirmed" : "idle",
          }))
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [clubId, user]);

  useEffect(() => {
    if (!isLeader || !clubId) return;
    api<ClubMember[]>(`/api/club/get/applicants/${clubId}`)
      .then(setApplicants)
      .catch(() => {});
  }, [isLeader, clubId, members]);

  useEffect(() => {
    if (viewMode !== "sanctum") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      onConnect: () => {
        client.subscribe(`/topic/club/${clubId}/chat`, (frame) => {
          const msg = JSON.parse(frame.body);
          setMessages((prev) => [...prev, {
            id: Date.now(), author: msg.senderName, content: msg.content,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }]);
        });
      },
      onStompError: () => client.deactivate(),
      onWebSocketError: () => client.deactivate(),
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [clubId, viewMode]);

  useEffect(() => {
    if (chatContainerRef.current && activeTab === "chat") {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    e.target.style.height = '44px';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now(), author: user?.fullName || "You",
      content: chatInput, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    
    // Try to send via STOMP if connected
    if (stompRef.current?.connected) {
      stompRef.current.publish({
        destination: `/app/club/${clubId}/chat`,
        body: JSON.stringify({ content: chatInput }),
      });
    }

    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const handleBroadcast = async () => {
    if (!clubId || !club) return;
    setBroadcasting(true);
    try {
      await api(`/api/club/broadcast/${clubId}`, { method: "POST" });
      toast.success("📣 Broadcast sent to all students!");
    } catch (e: any) {
      toast.error(e.message || "Failed to broadcast. Check backend.");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleAccept = async (memberId: number) => {
    try {
      await api(`/api/club/accept/${clubId}/${memberId}`, { method: "POST" });
      setApplicants((prev) => prev.filter((a) => a.id !== memberId));
      const m = await api<ClubMember[]>(`/api/club/members/${clubId}`);
      setMembers(m);
    } catch (e: any) { alert(e.message); }
  };

  const handleReject = async (memberId: number) => {
    try {
      await api(`/api/club/reject/${clubId}/${memberId}`, { method: "POST" });
      setApplicants((prev) => prev.filter((a) => a.id !== memberId));
    } catch (e: any) { alert(e.message); }
  };

  const handleJoinEvent = (event: ClubEvent) => {
    if (event.solo) {
      registerForEvent(event);
    } else {
      setJoiningEvent(event);
    }
  };

  const registerForEvent = async (event: ClubEvent, teamData?: typeof teamInfo) => {
    if (!user || !club) return;
    setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, status: "loading" } : ev));
    try {
      const res = await api<any>(`/api/event/accept/${clubId}`, {
        method: "POST",
        body: { 
          eventId: event.id, 
          teamName: teamData?.teamName,
          teamDetails: teamData?.teamDetails
        }
      });
      
      if (res.paymentRequired) {
        setPendingPayment({ 
          eventId: event.id, 
          eventMemberId: res.eventMemberId, 
          amount: res.amount, 
          title: event.name 
        });
      } else {
        toast.success("Successfully registered for " + event.name);
        setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, status: "confirmed" } : ev));
      }
      setJoiningEvent(null);
      setTeamInfo({ teamName: "", teamDetails: "" });
    } catch (e: any) {
      toast.error(e.message);
      setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, status: ev.isJoined ? "confirmed" : "idle" } : ev));
    }
  };

  const reloadClubEvents = async () => {
    if (!clubId) return;
    try {
      const evs = await api<ClubEvent[]>(`/api/event/club/${clubId}`);
      setEvents(
        evs.map((e) => ({
          ...e,
          amount: Number(e.amount ?? 0),
          totalRevenue: e.totalRevenue != null && e.totalRevenue !== undefined ? Number(e.totalRevenue) : null,
          status: e.isJoined ? "confirmed" : "idle",
        }))
      );
    } catch {
      /* ignore */
    }
  };

  const openEventDetail = async (ev: ClubEvent) => {
    if (!clubId) return;
    setEventDetail({ summary: ev, details: null, members: [], loading: true });
    try {
      const [details, members] = await Promise.all([
        api<EventDetailsPayload>(`/api/event/${clubId}/${ev.id}`),
        api<EventMemberRow[]>(`/api/event/${clubId}/${ev.id}/members`),
      ]);
      setEventDetail({ summary: ev, details, members, loading: false });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load event");
      setEventDetail(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;
    try {
      await api(`/api/event/request/${clubId}`, {
        method: "POST",
        body: { 
          name: newEvent.name, 
          description: newEvent.description, 
          dueDate: newEvent.dueDate, 
          amount: parseFloat(newEvent.amount) || 0,
          solo: newEvent.solo,
          teamSize: newEvent.solo ? null : parseInt(newEvent.teamSize),
          venue: newEvent.venue
        },
      });
      toast.success("Event created successfully!");
      setIsCreatingEvent(false);
      await reloadClubEvents();
      setNewEvent({ name: "", description: "", dueDate: "", amount: "0", solo: true, teamSize: "2", venue: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const requestJoin = async () => {
    if (!user) return;
    try {
      await api(`/api/club/request`, {
        method: "POST",
        body: { name: user.fullName, email: user.email, clubId },
      });
      toast.success("Request sent successfully! Wait for a leader to accept.");
    } catch (e: any) {
      toast.error(e.message || "Failed to send request");
    }
  };

  const leaders = members.filter((m) => m.role === "LEADER" || m.role === "CO_LEADER");
  const regularMembers = members.filter((m) => m.role === "MEMBER");
  const { upcoming, past } = partitionEventsByTime(events);
  const featuredUpcoming = upcoming[0];
  const moreUpcoming = upcoming.slice(1);

  if (loading) return (
    <div className="fixed inset-0 z-[200] bg-black">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
          </div>
          <p className="text-white/30 font-bold text-sm">Loading Club Data...</p>
        </div>
      </div>
    </div>
  );
  if (error) return (
    <div className="fixed inset-0 z-[200] bg-black">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-center p-8 text-red-400 font-bold bg-red-950/20 rounded-2xl border border-red-900/30 max-w-md">{error}</div>
        <button onClick={() => navigate("/student/clubs")} className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-all">Go Back</button>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] overflow-hidden flex flex-col bg-black"
    >
      {/* ── TOP BAR ── */}
      <div className="h-16 flex items-center justify-between px-6 shrink-0 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/student/clubs")}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400">
              {club?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">{club?.name || "Club"}</h2>
              <p className="text-xs font-medium text-white/40">{members.length} members</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {viewMode === "sanctum" && (
            <button
              onClick={() => setViewMode("details")}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white/50 hover:bg-white/[0.05] transition-colors border border-white/10"
            >
              Exit Chat
            </button>
          )}
          {viewMode === "details" && isMember && (
            <button
              onClick={() => setViewMode("sanctum")}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2"
            >
              <Hash className="w-4 h-4" /> Enter Club Chat
            </button>
          )}
          {viewMode === "details" && !isMember && (
            <button
              onClick={requestJoin}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-white/[0.04] text-white/60 border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              Request to Join
            </button>
          )}
        </div>
      </div>

      {/* ── PUBLIC DETAILS VIEW ── */}
      {viewMode === "details" && (
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-7xl mx-auto space-y-12 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Club identity */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl p-10 border border-white/[0.07] relative overflow-hidden">
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{club?.name}</h1>
                  <p className="text-base text-white/50 leading-relaxed mb-8">
                    {club?.description || "Join us to collaborate, learn, and build together."}
                  </p>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/25 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Members
                    </h3>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      {members.map((m) => (
                        <div key={m.id} className="relative shrink-0 group">
                          <div className="w-11 h-11 rounded-full bg-white/[0.04] border-2 border-white/10 flex items-center justify-center shadow-sm">
                            <span className="text-emerald-400 font-bold text-sm">{m.user.fullName?.charAt(0) || "?"}</span>
                          </div>
                          {m.role === "LEADER" && (
                            <div className="absolute -top-1 -right-1 bg-amber-500/20 rounded-full p-0.5">
                              <Crown className="w-3 h-3 text-amber-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {members.length === 0 && <span className="text-white/25 text-sm italic">No members yet.</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Events hub */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-emerald-400" /> Events
                    </h2>
                    <p className="text-sm text-white/40 mt-1">Upcoming and past club activity — visible to everyone browsing this club.</p>
                  </div>
                  {isLeader && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingEvent(true)}
                      className="px-5 py-2.5 rounded-full text-sm font-bold bg-white text-black hover:bg-white/90 transition-all shadow-lg shadow-emerald-500/10"
                    >
                      + Create Event
                    </button>
                  )}
                </div>

                {/* Featured upcoming */}
                {featuredUpcoming && (
                  <div className="relative rounded-3xl overflow-hidden border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-black to-black p-8 min-h-[200px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent pointer-events-none" />
                    <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="space-y-3 max-w-xl">
                        <span className="inline-flex text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Upcoming · Featured
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                          {featuredUpcoming.name}
                        </h3>
                        <p className="text-sm text-white/55 line-clamp-3">{featuredUpcoming.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-white/45">
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(featuredUpcoming.dueAt).toLocaleString()}
                          </span>
                          {featuredUpcoming.venue && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400/80" />
                              {featuredUpcoming.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch lg:items-end gap-3 shrink-0">
                        {featuredUpcoming.paid && (
                          <span className="text-sm font-bold text-amber-300/90 border border-amber-500/25 bg-amber-500/10 px-4 py-2 rounded-full text-center lg:text-right">
                            ₹{formatCurrencyINR(featuredUpcoming.amount)}
                          </span>
                        )}
                        {isLeader && featuredUpcoming.paid && featuredUpcoming.totalRevenue != null && (
                          <span className="text-xs font-bold text-white/50 flex items-center justify-center lg:justify-end gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                            Collected ₹{formatCurrencyINR(featuredUpcoming.totalRevenue)}
                          </span>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                          <button
                            type="button"
                            onClick={() => openEventDetail(featuredUpcoming)}
                            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold bg-white text-black hover:bg-emerald-50 transition-colors"
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleJoinEvent(featuredUpcoming)}
                            disabled={featuredUpcoming.status === "loading" || featuredUpcoming.status === "confirmed"}
                            className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold border transition-colors ${
                              featuredUpcoming.status === "confirmed"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                : "bg-transparent text-white border-white/20 hover:bg-white/10"
                            }`}
                          >
                            {featuredUpcoming.status === "loading"
                              ? "Processing…"
                              : featuredUpcoming.status === "confirmed"
                                ? "Registered"
                                : "Join"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* More upcoming */}
                {moreUpcoming.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">More upcoming</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {moreUpcoming.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col hover:border-emerald-500/25 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h4 className="font-bold text-white text-sm leading-snug">{ev.name}</h4>
                            <span className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                              Upcoming
                            </span>
                          </div>
                          <p className="text-xs text-white/40 line-clamp-2 mb-3 flex-1">{ev.description}</p>
                          <p className="text-[11px] font-mono text-white/35 mb-4">{new Date(ev.dueAt).toLocaleString()}</p>
                          <div className="flex flex-wrap gap-2 mt-auto">
                            <button
                              type="button"
                              onClick={() => openEventDetail(ev)}
                              className="flex-1 py-2 rounded-xl text-[11px] font-extrabold uppercase bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1] hover:text-white"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJoinEvent(ev)}
                              disabled={ev.status === "loading" || ev.status === "confirmed"}
                              className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold uppercase border transition-colors ${
                                ev.status === "confirmed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                  : "bg-white text-black border-transparent hover:bg-white/90"
                              }`}
                            >
                              {ev.status === "loading" ? "…" : ev.status === "confirmed" ? "Joined" : "Join"}
                            </button>
                          </div>
                          {isLeader && ev.paid && ev.totalRevenue != null && (
                            <p className="text-[10px] font-bold text-amber-400/90 mt-3 pt-3 border-t border-white/[0.06]">
                              Revenue ₹{formatCurrencyINR(ev.totalRevenue)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                      <Check className="w-4 h-4 text-white/25" /> Past events
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {past.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-white/85 text-sm">{ev.name}</h4>
                            <span className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/[0.06] text-white/45 border border-white/10">
                              Past
                            </span>
                          </div>
                          <p className="text-xs text-white/35 line-clamp-2 mb-3">{ev.description}</p>
                          <p className="text-[11px] font-mono text-white/30 mb-4">{new Date(ev.dueAt).toLocaleDateString()}</p>
                          <button
                            type="button"
                            onClick={() => openEventDetail(ev)}
                            className="w-full py-2 rounded-xl text-[11px] font-extrabold uppercase bg-white/[0.04] text-white/50 border border-white/10 hover:text-white hover:bg-white/[0.08]"
                          >
                            View details
                          </button>
                          {isLeader && ev.paid && ev.totalRevenue != null && (
                            <p className="text-[10px] font-bold text-amber-400/80 mt-3 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Collected ₹{formatCurrencyINR(ev.totalRevenue)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {events.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
                    <Calendar className="w-12 h-12 text-white/15 mx-auto mb-4" />
                    <p className="text-white/40 font-medium mb-2">No events yet</p>
                    {isLeader ? (
                      <button
                        type="button"
                        onClick={() => setIsCreatingEvent(true)}
                        className="mt-2 text-sm font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        Create the first event
                      </button>
                    ) : (
                      <p className="text-xs text-white/25">Check back when leaders publish an event.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT VIEW (Sanctum) ── */}
      {viewMode === "sanctum" && (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Channels */}
          {showLeft && (
            <div className="w-64 shrink-0 flex flex-col bg-white/[0.01] border-r border-white/[0.06] backdrop-blur-md relative z-10">
              <div className="px-4 pt-6 pb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-white/20 px-2 mb-3">Text Channels</p>
                {["general", "announcements", "resources"].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => { setActiveTab("chat"); setActiveChannel(ch); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all mb-1 ${
                      activeTab === "chat" && activeChannel === ch
                        ? "bg-white/[0.07] text-white border border-white/10"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
                  >
                    <Hash className={`w-4 h-4 shrink-0 ${activeTab === "chat" && activeChannel === ch ? "text-indigo-400" : "text-white/20"}`} />
                    {ch}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveTab("pastEvents")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all mt-2 ${
                    activeTab === "pastEvents"
                      ? "bg-white/[0.07] text-white border border-white/10"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                  }`}
                >
                  <Calendar className={`w-4 h-4 shrink-0 ${activeTab === "pastEvents" ? "text-emerald-400" : "text-white/20"}`} />
                  Past events
                </button>
              </div>

              {isLeader && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/20 px-2 mb-3">Leader</p>
                  <button
                    type="button"
                    onClick={() => { setActiveTab("applicants"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                      activeTab === "applicants"
                        ? "bg-white/[0.07] text-white border border-white/10"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
                  >
                    <Shield className={`w-4 h-4 shrink-0 ${activeTab === "applicants" ? "text-cyan-400" : "text-white/20"}`} />
                    Applicants
                    {applicants.length > 0 && (
                      <span className="ml-auto text-[10px] font-extrabold bg-white text-black px-2 py-0.5 rounded-full">
                        {applicants.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleBroadcast}
                    disabled={broadcasting}
                    className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-sm font-bold text-white/40 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    <Megaphone className="w-4 h-4 shrink-0 text-amber-400" />
                    {broadcasting ? "Sending..." : "Broadcast"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MIDDLE: Chat / Applicants */}
          <div className="flex-1 flex flex-col min-w-0 bg-black/40 relative z-0">
            <div className="h-14 flex items-center px-6 gap-3 shrink-0 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.06] z-10">
              {activeTab === "applicants" ? (
                <>
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-extrabold text-white">Pending Applicants</span>
                </>
              ) : activeTab === "pastEvents" ? (
                <>
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-extrabold text-white">Past events</span>
                </>
              ) : (
                <>
                  <Hash className="w-5 h-5 text-white/30" />
                  <span className="text-sm font-extrabold text-white">{activeChannel}</span>
                </>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "pastEvents" ? (
                <motion.div
                  key="past-events"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 overflow-y-auto p-6"
                >
                  {past.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/25">
                      <Calendar className="w-14 h-14 mb-4 opacity-30" />
                      <p className="text-sm font-medium text-center max-w-xs">
                        No past events yet. When event dates pass, they show up here for everyone in the club.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-xl mx-auto">
                      <p className="text-xs font-black uppercase tracking-widest text-white/25 mb-4">
                        History ({past.length})
                      </p>
                      {past.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 hover:border-white/15 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-white text-sm">{ev.name}</h4>
                            <span className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/[0.08] text-white/45 border border-white/10">
                              Past
                            </span>
                          </div>
                          <p className="text-xs text-white/40 line-clamp-2 mb-2">{ev.description}</p>
                          <p className="text-[11px] font-mono text-white/30 mb-3">
                            {new Date(ev.dueAt).toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => openEventDetail(ev)}
                            className="w-full py-2 rounded-xl text-[11px] font-extrabold uppercase bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1] hover:text-white"
                          >
                            View details
                          </button>
                          {isLeader && ev.paid && ev.totalRevenue != null && (
                            <p className="text-[10px] font-bold text-amber-400/85 mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Collected ₹{formatCurrencyINR(ev.totalRevenue)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : activeTab === "applicants" ? (
                <motion.div 
                  key="applicants"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 overflow-y-auto p-6 space-y-3"
                >
                  {applicants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                      <Shield className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">No pending applicants</p>
                    </div>
                  ) : (
                    applicants.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-white/60 font-bold text-sm border border-white/10">
                            {a.user.fullName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-white">{a.user.fullName}</p>
                            <p className="text-xs font-medium text-white/40">{a.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAccept(a.id)} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleReject(a.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key={`chat-${activeChannel}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-6" ref={chatContainerRef}>
                    <motion.ul layout className="space-y-6">
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                          const isMe = msg.author === user?.fullName;
                          return (
                            <motion.li
                              layout
                              key={msg.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && (
                                  <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 border border-white/10">
                                    {msg.isSystem ? "✦" : msg.author?.charAt(0) || '?'}
                                  </div>
                                )}
                                <div className={`px-4 py-2.5 rounded-2xl relative ${
                                  msg.isSystem ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-bl-sm" :
                                  isMe ? "bg-white text-black rounded-br-sm" : "bg-white/[0.04] border border-white/[0.07] text-white rounded-bl-sm"
                                }`}>
                                  {!isMe && !msg.isSystem && <p className="text-[10px] font-bold text-indigo-400/70 mb-0.5">{msg.author}</p>}
                                  <p className="text-[14px] leading-relaxed">{msg.content}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-white/20 mt-1 mx-10">{msg.time}</span>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </motion.ul>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <form onSubmit={handleSend} className="relative bg-white/[0.03] rounded-2xl border border-white/[0.08] p-1.5 flex items-end transition-all focus-within:border-white/20">
                      <textarea
                        value={chatInput}
                        onChange={handleInputResize}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); e.currentTarget.style.height = '44px'; }
                        }}
                        placeholder={`Message #${activeChannel}`}
                        className="w-full bg-transparent resize-none p-3 text-sm text-white placeholder-white/20 outline-none overflow-y-auto font-medium"
                        rows={1}
                        style={{ height: "44px", maxHeight: "120px" }}
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className={`p-2.5 rounded-xl mb-0.5 mr-0.5 transition-all flex items-center justify-center shrink-0 ${
                          chatInput.trim() 
                          ? "bg-white text-black hover:scale-105" 
                          : "bg-white/[0.04] text-white/20"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Members */}
          {showRight && (
            <div className="w-64 shrink-0 overflow-y-auto p-4 space-y-6 bg-white/[0.01] border-l border-white/[0.06] backdrop-blur-md relative z-10">
              {leaders.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/20 px-2 mb-3">Leadership</p>
                  <div className="space-y-1">
                    {leaders.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-white/[0.05]">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <span className="text-amber-400 text-xs font-bold">{m.user.fullName?.charAt(0) || '?'}</span>
                          </div>
                          <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 fill-emerald-500 text-black border-2 border-black rounded-full" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-extrabold text-white truncate">{m.user.fullName}</p>
                          <div className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider">{m.role === "LEADER" ? "President" : "Co-Pres"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {regularMembers.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/20 px-2 mb-3">Members</p>
                  <div className="space-y-1">
                    {regularMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-white/[0.05]">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center border border-white/10">
                            <span className="text-white/60 text-xs font-bold">{m.user.fullName?.charAt(0) || '?'}</span>
                          </div>
                          <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 fill-emerald-500 text-black border-2 border-black rounded-full" />
                        </div>
                        <p className="text-sm font-extrabold text-white/80 truncate">{m.user.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ── CREATE EVENT MODAL ── */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-neutral-950 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Event Name</label>
                <input required type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-white/20" placeholder="e.g. Hackathon 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Description</label>
                <textarea required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-white/20 resize-none h-24" placeholder="What's happening?" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Venue</label>
                <input type="text" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-white/20" placeholder="e.g. Auditorium 1" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Date & Time</label>
                <input required type="datetime-local" value={newEvent.dueDate} onChange={e => setNewEvent({...newEvent, dueDate: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Registration Fee (Optional)</label>
                <input type="number" min="0" step="10" value={newEvent.amount} onChange={e => setNewEvent({...newEvent, amount: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-white/20" placeholder="0 for free event" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <p className="text-sm font-bold text-white">Event Type</p>
                  <p className="text-[10px] text-white/30 uppercase font-black">{newEvent.solo ? "Individual Participation" : "Team/Multi Participation"}</p>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                  <button type="button" onClick={() => setNewEvent({...newEvent, solo: true})} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${newEvent.solo ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Solo</button>
                  <button type="button" onClick={() => setNewEvent({...newEvent, solo: false})} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!newEvent.solo ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Multi</button>
                </div>
              </div>

              {!newEvent.solo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-1.5">Required Team Size</label>
                  <input type="number" min="2" max="10" value={newEvent.teamSize} onChange={e => setNewEvent({...newEvent, teamSize: e.target.value})} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-white/20" placeholder="e.g. 4" />
                </motion.div>
              )}
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsCreatingEvent(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/40 hover:bg-white/[0.05] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 transition-all">Publish Event</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* ── STRIPE-LIKE PAYMENT GATEWAY ── */}
      {pendingPayment && (
        <PaymentGateway
          amount={pendingPayment.amount}
          title={pendingPayment.title}
          userName={user?.fullName || ""}
          userEmail={user?.email || ""}
          onClose={() => {
            setEvents(prev => prev.map(ev => ev.id === pendingPayment.eventId ? { ...ev, status: ev.isJoined ? "confirmed" : "idle" } : ev));
          }}
          recipientName={club?.name}
          onSuccess={async () => {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8080/api/event/payment/success?eventMemberId=${pendingPayment.eventMemberId}&txnId=sim_stripe_${Date.now()}`, {
                method: "POST", headers: { "Authorization": `Bearer ${token}` }
            });
            toast.success("Payment successful! Registered for event.");
            setEvents(prev => prev.map(ev => ev.id === pendingPayment.eventId ? { ...ev, status: "confirmed", isJoined: true } : ev));
            setPendingPayment(null);
            await reloadClubEvents();
          }}
        />
      )}
      {/* Team Registration Modal */}
      <AnimatePresence>
        {joiningEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setJoiningEvent(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-950 w-full max-w-md p-7 rounded-3xl relative z-10 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Team Registration</h3>
                  <p className="text-xs text-white/40 uppercase font-black tracking-widest mt-0.5">{joiningEvent.name} • {joiningEvent.teamSize} Members Required</p>
                </div>
                <button onClick={() => setJoiningEvent(null)} className="p-1.5 rounded-lg text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Team Name</label>
                  <input value={teamInfo.teamName} onChange={e => setTeamInfo({...teamInfo, teamName: e.target.value})}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/25 placeholder:text-white/20"
                    placeholder="Enter team name..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">Teammates & Details</label>
                  <textarea value={teamInfo.teamDetails} onChange={e => setTeamInfo({...teamInfo, teamDetails: e.target.value})} rows={4}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/25 resize-none placeholder:text-white/20"
                    placeholder="List teammate names and any other required info..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setJoiningEvent(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:bg-white/[0.05] transition-colors">Cancel</button>
                  <button onClick={() => registerForEvent(joiningEvent, teamInfo)} disabled={!teamInfo.teamName || !teamInfo.teamDetails}
                    className="px-6 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-40">
                    Register Team
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EVENT DETAIL + ATTENDEES (leaders see revenue & payment status) ── */}
      <AnimatePresence>
        {eventDetail && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-neutral-950 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-white/10 max-h-[90vh] flex flex-col my-8"
            >
              <div className="flex items-start justify-between gap-4 mb-6 shrink-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-1">
                    Events · {club?.name}
                  </p>
                  <h2 className="text-2xl font-bold text-white">{eventDetail.summary.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      {eventDetail.details?.dueAt
                        ? new Date(eventDetail.details.dueAt).toLocaleString()
                        : new Date(eventDetail.summary.dueAt).toLocaleString()}
                    </span>
                    {(eventDetail.details?.venue || eventDetail.summary.venue) && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 bg-white/[0.06] border border-white/10 px-3 py-1 rounded-full">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400/70" />
                        {eventDetail.details?.venue || eventDetail.summary.venue}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEventDetail(null)}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {eventDetail.loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-10 h-10 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
                  <p className="text-sm text-white/35 font-medium">Loading event…</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">
                    {eventDetail.details?.description ?? eventDetail.summary.description ?? "—"}
                  </p>

                  {isLeader &&
                    eventDetail.details?.paid &&
                    eventDetail.details.revenueCollected != null &&
                    eventDetail.details.amount > 0 && (
                      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-5 mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/70 mb-2">Revenue summary</p>
                        <p className="text-3xl font-mono font-bold text-white tracking-tight">
                          ₹{formatCurrencyINR(eventDetail.details.revenueCollected)}
                        </p>
                        <div className="flex gap-6 mt-3 text-xs text-white/45">
                          <span>Paid: {eventDetail.details.paidRegistrations ?? "—"}</span>
                          <span>Pending: {eventDetail.details.pendingRegistrations ?? "—"}</span>
                        </div>
                      </div>
                    )}

                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white">Registered attendees</h3>
                    <span className="text-xs text-white/35">{eventDetail.members.length} total</span>
                  </div>
                  <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.08] min-h-[120px] max-h-[45vh]">
                    {eventDetail.members.length === 0 ? (
                      <div className="py-16 text-center text-white/30 text-sm">No registrations yet.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-neutral-950/95 backdrop-blur border-b border-white/[0.08]">
                          <tr className="text-left text-[10px] uppercase tracking-wider text-white/35">
                            <th className="px-4 py-3 font-bold">Name</th>
                            <th className="px-4 py-3 font-bold hidden sm:table-cell">Email</th>
                            <th className="px-4 py-3 font-bold hidden md:table-cell">Registered</th>
                            <th className="px-4 py-3 font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventDetail.members.map((m) => (
                            <tr key={m.eventMemberId} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                              <td className="px-4 py-3 font-semibold text-white">
                                {m.userName}
                                {m.teamName && (
                                  <span className="block text-[10px] font-normal text-white/35">Team: {m.teamName}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-white/45 hidden sm:table-cell">{m.email}</td>
                              <td className="px-4 py-3 text-white/35 font-mono text-xs hidden md:table-cell">
                                {m.registeredAt
                                  ? new Date(m.registeredAt).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {(() => {
                                  const priced =
                                    Boolean(eventDetail.details?.paid) &&
                                    Number(eventDetail.details?.amount ?? 0) > 0;
                                  if (!priced) {
                                    return (
                                      <span className="inline-flex px-2 py-0.5 rounded-md bg-white/[0.06] text-white/45 text-[10px] font-bold border border-white/10">
                                        Registered
                                      </span>
                                    );
                                  }
                                  if (m.paymentDone === null) {
                                    return (
                                      <span className="inline-flex px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 text-[10px] font-bold border border-white/10">
                                        Registered
                                      </span>
                                    );
                                  }
                                  return m.paymentDone ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/25">
                                      Pending
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
