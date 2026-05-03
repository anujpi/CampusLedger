import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { SemesterTabs } from "@/components/SemesterTabs";
import { EmptyState } from "@/components/EmptyState";
import { Receipt, X, Printer, Search, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Payment {
  transactionId: string; feeTitle: string; semester: number;
  amount: number; paymentMode: string; paidAt: string; isDelayed: boolean;
}

export default function PaymentHistory() {
  const [semester, setSemester] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptTxn, setReceiptTxn] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    api<Payment[]>(`/api/student/payment-history/semester/${semester}`)
      .then(setPayments).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [semester]);

  const filtered = payments.filter(p =>
    p.feeTitle.toLowerCase().includes(search.toLowerCase()) ||
    p.transactionId.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const lateCount = payments.filter(p => p.isDelayed).length;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.15em] mb-1">Student Portal</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Payment History</h1>
        <p className="text-sm text-white/40 mt-1">Review and manage your past transactions.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Paid", value: formatINR(totalPaid), color: "text-emerald-400" },
          { label: "Transactions", value: payments.length.toString(), color: "text-white" },
          { label: "Late Payments", value: lateCount.toString(), color: lateCount > 0 ? "text-rose-400" : "text-white/40" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-xl font-black font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Semester tabs */}
      <SemesterTabs active={semester} onChange={setSemester} />

      {/* Search */}
      <div className="relative mt-5 mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="Search by title or transaction ID..."
        />
      </div>

      {error && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-4">⚠ {error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.02] rounded-2xl border border-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No payments" description="No payment records found for this semester." />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.01]">
            {["Transaction ID", "Fee Title", "Amount", "Mode", "Date", ""].map(h => (
              <p key={h} className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div>
            {filtered.map((p, i) => (
              <motion.div
                key={p.transactionId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors last:border-0"
              >
                <p className="text-[11px] font-mono font-bold text-white/40 truncate">{p.transactionId}</p>
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.feeTitle}</p>
                  {p.isDelayed && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full">
                      <TrendingDown className="w-2.5 h-2.5" /> Late
                    </span>
                  )}
                </div>
                <p className="font-mono font-bold text-white text-sm">{formatINR(p.amount)}</p>
                <p className="text-xs text-white/40 font-medium">{p.paymentMode.replace("_", " ")}</p>
                <p className="text-xs text-white/40 font-medium">{formatDate(p.paidAt)}</p>
                <button onClick={() => setReceiptTxn(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:border-white/20 transition-all text-[11px] font-bold whitespace-nowrap">
                  <Receipt className="w-3 h-3" /> Receipt
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptTxn && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden" onClick={() => setReceiptTxn(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl text-slate-900 print:shadow-none print:w-full print:max-w-none">
              <button onClick={() => setReceiptTxn(null)} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors print:hidden">
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-7 pb-7 border-b border-dashed border-slate-200">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold">CampusLedger</h2>
                <p className="text-sm text-slate-500">Official Payment Receipt</p>
              </div>
              <div className="space-y-3 mb-7">
                {[
                  ["Transaction ID", receiptTxn.transactionId],
                  ["Date Paid", formatDate(receiptTxn.paidAt)],
                  ["Payment Mode", receiptTxn.paymentMode.replace("_", " ")],
                  ["Status", receiptTxn.isDelayed ? "Late Payment" : "Successful"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">{l}</span>
                    <span className="text-sm font-bold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 mb-7 border border-slate-100">
                <div className="flex justify-between mb-3">
                  <div><h4 className="font-bold text-slate-800">{receiptTxn.feeTitle}</h4><p className="text-xs text-slate-500">Semester {receiptTxn.semester}</p></div>
                  <span className="font-mono font-bold">{formatINR(receiptTxn.amount)}</span>
                </div>
                <div className="w-full h-px bg-slate-200 my-3" />
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="font-mono text-lg font-bold text-indigo-600">{formatINR(receiptTxn.amount)}</span>
                </div>
              </div>
              <button onClick={() => window.print()} className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 print:hidden hover:bg-slate-800 transition-colors">
                <Printer className="w-4 h-4" /> Download / Print PDF
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
