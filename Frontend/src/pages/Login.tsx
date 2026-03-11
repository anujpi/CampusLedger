import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Eye, EyeOff, CalendarCheck, Receipt, MessageCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: CalendarCheck, text: "Semester-wise fee tracking" },
    { icon: Receipt, text: "Instant payment receipts" },
    { icon: MessageCircle, text: "Direct admin support" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-login-panel relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 dot-pattern" />
        <div className="relative z-10">
          <h1 className="text-login-panel-foreground font-display text-4xl mb-3">CampusPay</h1>
          <p className="text-login-panel-foreground/60 text-lg">Fee management, simplified.</p>
        </div>
        <div className="relative z-10 space-y-5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-login-panel-foreground/10">
                <f.icon className="w-4 h-4 text-login-panel-foreground/70" />
              </div>
              <span className="text-login-panel-foreground/80 text-sm">{f.text}</span>
            </div>
          ))}
        </div>
        <p className="relative z-10 text-login-panel-foreground/30 text-xs">© 2026 CampusPay</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile-only branding */}
          <div className="lg:hidden mb-8">
            <h1 className="font-display text-2xl text-foreground">CampusPay</h1>
          </div>

          <h2 className="text-[28px] font-semibold text-foreground tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@college.edu"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
              {loading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
