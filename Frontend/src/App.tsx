import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "sonner";

// Page Imports
import LoginPage from "./pages/Login";
import ChangePasswordPage from "./pages/ChangePassword";
import AppLayout from "./components/AppLayout";
import StudentDashboard from "./pages/student/Dashboard";
import MyFees from "./pages/student/MyFees";
import PaymentHistory from "./pages/student/PaymentHistory";
import MyTickets from "./pages/student/MyTickets";
import Notifications from "./pages/student/Notifications";
import AdminDashboard from "./pages/admin/Dashboard";
import FeeRequests from "./pages/admin/FeeRequests";
import CSVImport from "./pages/admin/CSVImport";
import AdminTickets from "./pages/admin/Tickets";
import AdminClubs from "./pages/admin/Clubs";
import StudentClubs from "./pages/student/Clubs";
import ClubDashboard from "./pages/student/ClubDashboard";
import StudentEvents from "./pages/student/Events";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  const homeRedirect = user.role === "ADMIN" ? "/admin" : "/student";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />
      <Route path="/login" element={<Navigate to={homeRedirect} replace />} />
      
      {/* Student Routes */}
      {user.role === "STUDENT" && (
        <Route element={<AppLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/fees" element={<MyFees />} />
          <Route path="/student/payments" element={<PaymentHistory />} />
          <Route path="/student/tickets" element={<MyTickets />} />
          <Route path="/student/clubs" element={<StudentClubs />} />
          <Route path="/student/clubs/:clubId" element={<ClubDashboard />} />
          <Route path="/student/events" element={<StudentEvents />} />
          <Route path="/student/notifications" element={<Notifications />} />
        </Route>
      )}

      {/* Admin Routes */}
      {user.role === "ADMIN" && (
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/fee-requests" element={<FeeRequests />} />
          <Route path="/admin/import" element={<CSVImport />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/clubs" element={<AdminClubs />} />
        </Route>
      )}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
            <Toaster position="top-right" theme="dark" />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;