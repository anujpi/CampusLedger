import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface FeeNotification {
  feeId: number;
  semester: number;
  context: string;
  createdAt: string;
  dueDate: string;
}

interface NotificationContextValue {
  unreadCount: number;
  latestNotification: FeeNotification | null;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<FeeNotification | null>(null);

  const handleFeeNotification = useCallback((n: FeeNotification) => {
    setUnreadCount(prev => prev + 1);
    setLatestNotification(n);
  }, []);

  const handleClubInvite = useCallback((invite: { clubId: number; clubName: string; description: string; leaderName: string }) => {
    setUnreadCount(prev => prev + 1);
    toast(`📣 New Club Broadcast: ${invite.clubName}`, {
      description: `${invite.leaderName} invited you: ${invite.description}`,
      action: {
        label: "View Club",
        onClick: () => window.location.href = `/student/clubs`,
      },
    });
  }, []);

  useNotifications(handleFeeNotification, handleClubInvite);

  const clearUnread = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, latestNotification, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("Must be inside NotificationProvider");
  return ctx;
}