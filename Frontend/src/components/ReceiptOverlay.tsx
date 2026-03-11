import { formatINR, formatDate } from "@/lib/format";

interface ReceiptData {
  transactionId: string;
  feeTitle: string;
  semester: number;
  amount: number;
  paymentMode: string;
  date: string;
  wasDelayed: boolean;
}

interface ReceiptOverlayProps {
  data: ReceiptData;
  onClose: () => void;
}

export function ReceiptOverlay({ data, onClose }: ReceiptOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 animate-scale-in card-elevated-lg">
        <div className="receipt-border py-6 font-mono text-sm space-y-3">
          <p className="text-center text-foreground font-semibold text-base mb-5">Payment Receipt</p>
          {[
            { label: "Transaction ID", value: data.transactionId },
            { label: "Fee", value: data.feeTitle },
            { label: "Semester", value: String(data.semester) },
            { label: "Amount", value: formatINR(data.amount), bold: true },
            { label: "Mode", value: data.paymentMode },
            { label: "Date", value: formatDate(data.date) },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">{row.label}</span>
              <span className={`text-foreground ${row.bold ? "font-semibold" : ""}`}>{row.value}</span>
            </div>
          ))}
          {data.wasDelayed && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-status-delayed-bg text-status-delayed text-[11px] font-semibold px-3 py-1 rounded-full ring-1 ring-inset ring-status-delayed/20">
                DELAYED PAYMENT
              </span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="btn-ghost w-full mt-6">
          Close
        </button>
      </div>
    </div>
  );
}
