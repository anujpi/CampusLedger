import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Megaphone, Calendar, MessageSquare, Globe, ArrowLeft, Search, Users } from "lucide-react";

interface Club {
  id: number;
  name: string;
  description: string;
}

interface ClubMember {
  id: number;
  user: { id: number; fullName: string; email: string };
  role: string;
}

const ClubCard = ({ club, isMember, memberCount, onRequestJoin, onOpen }: { club: Club, isMember: boolean, memberCount?: number, onRequestJoin: () => void, onOpen: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="mb-6 break-inside-avoid"
    >
      <div 
        className="bg-white/[0.02] p-6 rounded-2xl flex flex-col justify-between group h-full border border-white/[0.06] backdrop-blur-md transition-all duration-500 relative overflow-hidden hover:border-white/20 hover:-translate-y-2"
        style={{ transform: "translateZ(20px)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl shadow-sm border border-white/10 mb-4 text-white font-bold">
            {club.name?.charAt(0) || 'C'}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
            {club.name || "Unknown Club"}
          </h3>
          <p className="text-sm text-white/50 mt-2 line-clamp-3 font-medium">
            {club.description || "Join us to collaborate, learn, and build the future together in this exclusive campus organization."}
          </p>
        </div>
        
        <div className="mt-6 flex justify-between items-center relative z-10">
          <div className="flex gap-2 items-center">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${isMember ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
              {isMember ? "Joined" : "Open"}
            </span>
            {memberCount !== undefined && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                <Users className="w-3 h-3" /> {memberCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isMember && (
              <button 
                onClick={onRequestJoin}
                className="text-[13px] font-bold text-blue-400 hover:text-blue-300 transition-all px-1"
              >
                Request to Join
              </button>
            )}
            <button 
              onClick={onOpen}
              className="text-[13px] font-bold text-white/60 hover:text-white transition-all px-1 flex items-center gap-1"
            >
              View Details &rarr;
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function StudentClubs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberOf, setMemberOf] = useState<Set<number>>(new Set());
  const [memberCounts, setMemberCounts] = useState<Record<number, number>>({});
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);

    const stored = localStorage.getItem("clubMemberships");
    const restoredIds: number[] = stored ? JSON.parse(stored) : [];

    api<Club[]>("/api/club/find/all")
      .then(async (fetchedClubs) => {
        const validClubs = Array.isArray(fetchedClubs) ? fetchedClubs : [];
        setClubs(validClubs);

        if (user) {
          const memberships = new Set<number>(restoredIds);

          await Promise.all(
            validClubs.map(async (club) => {
              if (!club) return;
              try {
                const members = await api<ClubMember[]>(`/api/club/members/${club.id}`);
                setMemberCounts(prev => ({ ...prev, [club.id]: members.length }));
                const isMember = members.some((m) => m.user.email === user.email);
                if (isMember) memberships.add(club.id);
              } catch { /* ignore */ }
            })
          );

          setMemberOf(memberships);
          localStorage.setItem("clubMemberships", JSON.stringify([...memberships]));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const requestJoin = async (clubId: number) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/club/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: user.fullName, email: user.email, clubId }),
      });

      const bodyText = await res.text();

      if (res.status === 500) {
        setMemberOf((prev) => {
          const next = new Set([...prev, clubId]);
          localStorage.setItem("clubMemberships", JSON.stringify([...next]));
          return next;
        });
        navigate(`/student/clubs/${clubId}`);
        return;
      }

      if (res.status === 403) {
        alert("Your account is not active. Please contact your administrator to activate your account.");
        return;
      }

      if (!res.ok) {
        throw new Error(bodyText || `Failed to request join (${res.status})`);
      }

      alert("Request sent successfully! Wait for a leader to accept your request.");
    } catch (e: any) {
      alert("Failed to send request: " + e.message);
    }
  };

  if (error) return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
      <div className="text-red-500 p-8 border border-red-500/20 bg-red-50 rounded-xl font-bold">
        Error: {error}
      </div>
    </div>
  );

  const filteredClubs = clubs.filter(c => {
    if (!c || !c.name) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const myClubs = filteredClubs.filter(c => memberOf.has(c.id));
  const otherClubs = filteredClubs.filter(c => !memberOf.has(c.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] overflow-y-auto bg-black"
    >
      {/* Floating Parallax Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[15%] text-blue-500/10"
        >
          <Megaphone className="w-24 h-24" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -15, 0] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] right-[10%] text-purple-500/10"
        >
          <Globe className="w-32 h-32" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -15, 0], x: [0, -10, 0], rotate: [0, 10, 0] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] left-[20%] text-cyan-500/10"
        >
          <MessageSquare className="w-20 h-20" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 25, 0], x: [0, 20, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[70%] right-[25%] text-blue-500/5"
        >
          <Calendar className="w-16 h-16" />
        </motion.div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 py-12 relative z-10 min-h-screen">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate("/student")}
          className="mb-12 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/60 font-medium backdrop-blur-md border border-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-12 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Club Hub
          </h1>
          <p className="text-white/40 text-lg md:text-xl font-medium max-w-2xl">
            Discover and join student organizations. Explore interests, build networks, and shape your campus experience.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white/[0.03] backdrop-blur-xl p-4 rounded-3xl border border-white/10 mb-12 flex flex-col md:flex-row items-center gap-4 shadow-2xl shadow-black">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-medium"
              placeholder="Search clubs..."
            />
          </div>
        </div>

        {loading ? (
          <div className="text-slate-500 animate-pulse text-xl text-center font-medium mt-20">Loading Clubs...</div>
        ) : filteredClubs.length === 0 ? (
          <div className="text-slate-500 text-xl text-center font-medium mt-20">No active clubs found for this filter.</div>
        ) : (
          <div className="space-y-16">
            {myClubs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-500 rounded-full" />
                  My Clubs
                </h2>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                  {myClubs.map((club) => (
                    <ClubCard 
                      key={club.id} 
                      club={club} 
                      isMember={true} 
                      memberCount={memberCounts[club.id]}
                      onRequestJoin={() => {}}
                      onOpen={() => navigate(`/student/clubs/${club.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-white/20 rounded-full" />
                {myClubs.length > 0 ? "Discover More Clubs" : "All Clubs"}
              </h2>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                {otherClubs.map((club) => (
                  <ClubCard 
                    key={club.id} 
                    club={club} 
                    isMember={false} 
                    memberCount={memberCounts[club.id]}
                    onRequestJoin={() => requestJoin(club.id)}
                    onOpen={() => navigate(`/student/clubs/${club.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
