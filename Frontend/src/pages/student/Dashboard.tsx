import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { PaymentGateway } from "@/components/PaymentGateway";
import { useNavigate } from "react-router-dom";
import { Receipt, AlertCircle, ArrowRight, Ticket, CheckCircle2, X, Printer, Hexagon, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Overview {
  fullName: string; branch: string; year: string;
  totalFeesCount: number; pendingCount: number; paidCount: number;
  totalDue: number; totalPaid: number;
}
interface PaymentHistoryDTO {
  transactionId: string; feeTitle: string; semester: number;
  amount: number; paymentMode: string; paidAt: string; isDelayed: boolean;
}
interface StudentFee {
  id: number; feeRequest: { title: string; description: string };
  dueDate: string; amount: number; feeStatus: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [transactions, setTransactions] = useState<PaymentHistoryDTO[]>([]);
  const [pendingFees, setPendingFees] = useState<StudentFee[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; title: string; id: string | number } | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [receiptTxn, setReceiptTxn] = useState<PaymentHistoryDTO | null>(null);
  const [processingPaymentFor, setProcessingPaymentFor] = useState<string | number | null>(null);

  const MOCK_ATTENDANCE = 65;
  const fineAmount = MOCK_ATTENDANCE < 75 ? (75 - MOCK_ATTENDANCE) * 100 : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (MOCK_ATTENDANCE / 100) * circumference;

  const fineKey = user?.email ? `finePaid_${user.email}` : null;
  const [isFinePaid, setIsFinePaid] = useState<boolean>(() => fineKey ? localStorage.getItem(fineKey) === "true" : false);

  useEffect(() => {
    Promise.all([
      api<Overview>("/api/student/overview").then(setOverview),
      api<PaymentHistoryDTO[]>("/api/student/payment-history").then(setTransactions),
      api<StudentFee[]>("/api/students/pendingfees").then(setPendingFees),
    ]).catch(err => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const submitTicket = async () => {
    if (!ticketSubject || !ticketMessage) return;
    setTicketLoading(true);
    try {
      await api("/api/student/chatbox", { method: "POST", body: { subject: ticketSubject, firstMessage: ticketMessage } });
      setIsTicketModalOpen(false); setTicketSubject(""); setTicketMessage("");
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setTicketLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
        <p className="text-white/30 text-sm font-medium">Loading matrix...</p>
      </div>
    </div>
  );
  if (error) return <div className="text-red-400 p-6 bg-red-950/20 border border-red-900/30 rounded-2xl">{error}</div>;

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-white/20 uppercase tracking-[0.15em] mb-1">Student Portal</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {overview?.fullName?.split(" ")[0] || "Student"}.
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {pendingFees.length > 0 ? `You have ${pendingFees.length} pending payment${pendingFees.length > 1 ? "s" : ""}.` : "Your dashboard is clear."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/student/clubs")} className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.07] transition-all text-sm font-medium">
            Club Hub
          </button>
          <button onClick={() => { setSelectedTxn(null); setTicketSubject(""); setTicketMessage(""); setIsTicketModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">
            + New Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

        {/* LEFT: Profile + Attendance */}
        <div className="lg:col-span-4 space-y-5">
          {/* Profile Card */}
          <div className="bg-white/[0.02] p-7 rounded-3xl border border-white/[0.07] backdrop-blur-md">
            <div className="flex flex-col items-center text-center pb-6 border-b border-white/[0.06]">
              <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-white">{overview?.fullName?.charAt(0).toUpperCase() || "S"}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{overview?.fullName || "Student"}</h2>
              <p className="text-xs font-medium text-white/40 mt-1">{overview?.branch} · Year {overview?.year}</p>
              <div className="flex gap-4 mt-4 w-full justify-center">
                <div className="text-center">
                  <p className="text-lg font-black text-white">{overview?.paidCount ?? 0}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Paid</p>
                </div>
                <div className="w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-lg font-black text-amber-400">{overview?.pendingCount ?? 0}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Pending</p>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="pt-6 flex flex-col items-center">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em] mb-4">Attendance Matrix</p>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="transform -rotate-90 w-28 h-28">
                  <circle cx="56" cy="56" r={radius} stroke="rgba(255,255,255,0.04)" strokeWidth="7" fill="transparent" />
                  <motion.circle
                    cx="56" cy="56" r={radius}
                    stroke="currentColor" strokeWidth="7" fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={MOCK_ATTENDANCE < 75 ? "text-rose-500" : "text-emerald-400"}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-white">{MOCK_ATTENDANCE}%</span>
                </div>
              </div>
              {MOCK_ATTENDANCE < 75 && !isFinePaid && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 w-full flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">Below 75% threshold. Attendance fine generated.</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Club Hub Portal */}
          <motion.div whileHover={{ scale: 1.01 }} onClick={() => navigate("/student/clubs")}
            className="group cursor-pointer bg-gradient-to-br from-indigo-500/[0.06] to-cyan-500/[0.06] p-6 rounded-3xl border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-md relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[40px] -z-10" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <Hexagon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Enter Club Hub</h3>
                <p className="text-xs text-white/40">Explore clubs & events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/[0.07]">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em] mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Pay Fees", icon: Receipt, onClick: () => navigate("/student/fees") },
                { label: "History", icon: History, onClick: () => navigate("/student/payments") },
                { label: "Tickets", icon: Ticket, onClick: () => navigate("/student/tickets") },
                { label: "Support", icon: AlertCircle, onClick: () => { setSelectedTxn(null); setIsTicketModalOpen(true); } },
              ].map(({ label, icon: Icon, onClick }) => (
                <button key={label} onClick={onClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all group">
                  <Icon className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
                  <span className="text-[11px] font-medium text-white/40 group-hover:text-white/70 transition-colors">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Fees + Ledger */}
        <div className="lg:col-span-8 space-y-5">

          {/* Attendance Fine */}
          {fineAmount > 0 && !isFinePaid && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-rose-500/[0.04] p-5 rounded-3xl border border-rose-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-r-full" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
                <div>
                  <h3 className="text-base font-bold text-white">Attendance Fine</h3>
                  <p className="text-sm text-white/50 mt-0.5">Low attendance penalty: <strong className="text-rose-400">{formatINR(fineAmount)}</strong></p>
                </div>
                <button onClick={() => setPendingPayment({ amount: fineAmount, title: "Attendance Fine", id: "fine" })}
                  className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/25 font-bold hover:bg-rose-500 hover:text-white transition-all text-sm flex items-center gap-2">
                  Settle <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Pending Fees */}
          {pendingFees.map(fee => (
            <motion.div key={`pending-${fee.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-amber-500/[0.04] p-5 rounded-3xl border border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-r-full" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
                <div>
                  <h3 className="text-base font-bold text-white">{fee.feeRequest?.title || "Pending Fee"}</h3>
                  <p className="text-sm text-white/50 mt-0.5">Due: {fee.dueDate} · <strong className="text-amber-400">{formatINR(fee.amount)}</strong></p>
                </div>
                <button onClick={() => setPendingPayment({ amount: fee.amount, title: fee.feeRequest?.title || "Fee", id: fee.id })}
                  disabled={processingPaymentFor === fee.id}
                  className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 font-bold hover:bg-amber-500 hover:text-white transition-all text-sm flex items-center gap-2 disabled:opacity-50">
                  Pay Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Transaction Ledger */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-5">
              <Receipt className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Payment Ledger</h3>
              <span className="ml-auto text-xs text-white/30 font-medium">{transactions.length} transactions</span>
            </div>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-white/25 text-sm text-center py-8 border border-dashed border-white/[0.06] rounded-2xl">No transactions yet.</p>
              ) : (
                transactions.map(txn => (
                  <motion.div key={txn.transactionId} whileHover={{ scale: 1.005 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{txn.feeTitle}</p>
                        <p className="text-[11px] font-mono text-white/30">{txn.transactionId} · {txn.paidAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-white">{formatINR(txn.amount)}</span>
                      {txn.isDelayed && <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">Late</span>}
                      <div className="flex gap-1.5">
                        <button onClick={() => setReceiptTxn(txn)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors border border-white/[0.06]" title="Receipt">
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setSelectedTxn(txn.transactionId); setTicketSubject(`Dispute: ${txn.transactionId}`); setIsTicketModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors border border-white/[0.06]" title="Dispute">
                          <Ticket className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {isTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsTicketModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-950 w-full max-w-md p-7 rounded-3xl relative z-10 shadow-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-1">{selectedTxn ? "Raise Dispute" : "Contact Support"}</h3>
              <p className="text-sm text-white/40 mb-5">{selectedTxn ? `Transaction: ${selectedTxn}` : "Describe your issue."}</p>
              <input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/30 mb-3 placeholder:text-white/20"
                placeholder="Subject" />
              <textarea value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} rows={4}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/30 resize-none mb-5 placeholder:text-white/20"
                placeholder="Describe the issue..." />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsTicketModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:bg-white/[0.05] transition-colors">Cancel</button>
                <button onClick={submitTicket} disabled={ticketLoading || !ticketSubject || !ticketMessage}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-40 min-w-[130px] flex items-center justify-center">
                  {ticketLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Submit Ticket"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptTxn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden" onClick={() => setReceiptTxn(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl text-slate-900 print:w-full print:shadow-none">
              <button onClick={() => setReceiptTxn(null)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors print:hidden">
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-6 pb-6 border-b border-dashed border-slate-200">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold">CampusLedger</h2>
                <p className="text-sm text-slate-500">Official Payment Receipt</p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  ["Transaction ID", receiptTxn.transactionId, true],
                  ["Date Paid", receiptTxn.paidAt, false],
                  ["Payment Mode", receiptTxn.paymentMode, false],
                  ["Status", "Successful", false],
                ].map(([label, value, mono]) => (
                  <div key={label as string} className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className={`text-sm font-bold ${mono ? "font-mono" : ""}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                <div className="flex justify-between mb-3">
                  <div><h4 className="font-bold text-slate-800">{receiptTxn.feeTitle}</h4><p className="text-xs text-slate-500">Semester {receiptTxn.semester}</p></div>
                  <span className="font-mono font-bold">{formatINR(receiptTxn.amount)}</span>
                </div>
                <div className="w-full h-px bg-slate-200 my-3" />
                <div className="flex justify-between"><span className="font-bold">Total</span><span className="font-mono text-lg font-bold text-indigo-600">{formatINR(receiptTxn.amount)}</span></div>
              </div>
              <button onClick={() => window.print()} className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 print:hidden hover:bg-slate-800 transition-colors">
                <Printer className="w-4 h-4" /> Download / Print
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {pendingPayment && (
        <PaymentGateway
          amount={pendingPayment.amount} title={pendingPayment.title}
          userName={user?.fullName || ""} userEmail={user?.email || ""}
          onClose={() => setPendingPayment(null)}
          onSuccess={async () => {
            const newTxn: PaymentHistoryDTO = {
              transactionId: "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              feeTitle: pendingPayment.title, semester: 4, amount: pendingPayment.amount,
              paymentMode: "CampusPay Gateway",
              paidAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
              isDelayed: false,
            };
            setTransactions(prev => [newTxn, ...prev]);
            if (pendingPayment.id === "fine") { setIsFinePaid(true); if (fineKey) localStorage.setItem(fineKey, "true"); }
            else setPendingFees(prev => prev.filter(f => f.id !== pendingPayment.id));
            setPendingPayment(null); setReceiptTxn(newTxn);
          }}
        />
      )}
    </div>
  );
}


