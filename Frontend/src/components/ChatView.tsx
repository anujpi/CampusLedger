import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Send } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  context: string;
  createdAt: string;
}

interface ChatViewProps {
  ticketId: string;
  ticketStatus: string;
  onBack: () => void;
  onStatusChange?: () => void;
  isAdmin?: boolean;
}

export function ChatView({ ticketId, ticketStatus, onBack, onStatusChange, isAdmin }: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(ticketStatus);

  const fetchMessages = async () => {
    try {
      const data = await api<Message[]>(`/api/chatbox/${ticketId}/thread`);
      setMessages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    setError("");
    try {
      await api(`/api/chatbox/${ticketId}/message`, { method: "POST", body: { context: input } });
      setInput("");
      await fetchMessages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    try {
      if (isAdmin) {
        await api(`/api/admin/chatbox/${ticketId}/resolve`, { method: "POST" });
        setStatus("RESOLVED");
      } else {
        await api(`/api/student/chatbox/${ticketId}/close`, { method: "POST" });
        setStatus("CLOSED");
      }
      onStatusChange?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const isClosed = status === "RESOLVED" || status === "CLOSED";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <StatusBadge status={status as any} />
          {!isClosed && (
            <button onClick={handleClose} className="btn-ghost text-[13px]">
              {isAdmin ? "Resolve" : "Close Ticket"}
            </button>
          )}
        </div>
      </div>

      {isClosed && (
        <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground mb-4 border border-border">
          This ticket has been {status.toLowerCase()}. No further messages can be sent.
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="h-14 w-52 bg-muted rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderRole === user?.role;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md"}`}>
                  <p>{msg.context}</p>
                  <p className={`text-[11px] mt-1.5 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.sender} · {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mb-2">
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {!isClosed && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            className="input-field flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-3 py-2.5 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50 active:scale-[0.97]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
