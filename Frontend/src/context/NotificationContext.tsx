import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useNotifications, ClubEventNotification } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface FeeNotification {
  feeId: number;
  semester: number;
  context: string;
  createdAt: string;
  dueDate: string;
}

export type StoredClubActivity = ClubEventNotification & { receivedAt: string };

const CLUB_ACTIVITY_STORAGE = "clubEventNotifications";

interface NotificationContextValue {
  unreadCount: number;
  latestNotification: FeeNotification | null;
  clearUnread: () => void;
  clubActivityNotifications: StoredClubActivity[];
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<FeeNotification | null>(null);
  const [clubActivityNotifications, setClubActivityNotifications] = useState<StoredClubActivity[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLUB_ACTIVITY_STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredClubActivity[];
        if (Array.isArray(parsed)) setClubActivityNotifications(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistClubActivity = useCallback((items: StoredClubActivity[]) => {
    try {
      localStorage.setItem(CLUB_ACTIVITY_STORAGE, JSON.stringify(items.slice(0, 40)));
    } catch {
      /* ignore */
    }
  });

  const handleFeeNotification = useCallback((n: FeeNotification) => {
    setUnreadCount((prev) => prev + 1);
    setLatestNotification(n);
  }, []);

  const handleClubInvite = useCallback(
    (invite: { clubId: number; clubName: string; description: string; leaderName: string }) => {
      setUnreadCount((prev) => prev + 1);
      toast(`📣 New club message: ${invite.clubName}`, {
        description: `${invite.leaderName} invited you: ${invite.description}`,
        action: {
          label: "View club",
          onClick: () => (window.location.href = `/student/clubs`),
        },
      });
    },
    []
  );

  const handleClubEventNotification = useCallback(
    (n: ClubEventNotification) => {
      setUnreadCount((prev) => prev + 1);
      const entry: StoredClubActivity = {
        ...n,
        receivedAt: new Date().toISOString(),
      };
      setClubActivityNotifications((prev) => {
        const next = [entry, ...prev.filter((x) => !(x.clubId === n.clubId && x.eventId === n.eventId))].slice(0, 40);
        persistClubActivity(next);
        return next;
      });
      toast(`New club activity: ${n.eventName}`, {
        description: `${n.clubName}${n.venue ? ` · ${n.venue}` : ""}`,
        action: {
          label: "Open club",
          onClick: () => (window.location.href = `/student/clubs/${n.clubId}`),
        },
      });
    },
    [persistClubActivity]
  );

  useNotifications(handleFeeNotification, handleClubInvite, handleClubEventNotification);

  const clearUnread = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        latestNotification,
        clearUnread,
        clubActivityNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("Must be inside NotificationProvider");
  return ctx;
}
