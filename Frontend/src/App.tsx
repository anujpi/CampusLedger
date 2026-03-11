import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "./pages/Login";
import ChangePasswordPage from "./pages/ChangePassword";
import AppLayout from "./components/AppLayout";
import StudentDashboard from "./pages/student/Dashboard";
import MyFees from "./pages/student/MyFees";
import PaymentHistory from "./pages/student/PaymentHistory";
import MyTickets from "./pages/student/MyTickets";
import AdminDashboard from "./pages/admin/Dashboard";
import FeeRequests from "./pages/admin/FeeRequests";
import CSVImport from "./pages/admin/CSVImport";
import AdminTickets from "./pages/admin/Tickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {user.role === "STUDENT" && (
        <Route element={<AppLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/fees" element={<MyFees />} />
          <Route path="/student/payments" element={<PaymentHistory />} />
          <Route path="/student/tickets" element={<MyTickets />} />
        </Route>
      )}

      {user.role === "ADMIN" && (
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/fee-requests" element={<FeeRequests />} />
          <Route path="/admin/import" element={<CSVImport />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
