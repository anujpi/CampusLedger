import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

interface ImportResult {
  imported: number;
  failed: number;
  errors?: string[];
}

export default function CSVImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchPendingCount = async () => {
    try {
      const count = await api<number>("/api/admin/csv/pending-credentials-count");
      setPendingCount(count);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (result) fetchPendingCount();
  }, [result]);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only CSV files are allowed");
      return;
    }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api<ImportResult>("/api/admin/csv/import-students", {
        method: "POST",
        body: form,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const handleDownload = async () => {
  if (pendingCount === 0) return;
  try {
    const res = await fetch("http://localhost:8080/api/admin/csv/download-credentials", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-credentials.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    setTimeout(() => setPendingCount(0), 1000);
  } catch {
    setError("Failed to download credentials");
  }
};


  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">
        CSV Import
      </h1>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/30"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-foreground font-medium">
          {uploading ? "Uploading…" : "Drop CSV here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          Expected format: fullName, email, year, branch, joinDate
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mt-4">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-status-paid" />
              <span className="text-foreground font-medium">
                {result.imported} students imported
              </span>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground font-medium">
                  {result.failed} rows failed
                </span>
              </div>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden card-elevated">
              <button
                onClick={() => setErrorsOpen(!errorsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
              >
                Error details ({result.errors.length})
                {errorsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {errorsOpen && (
                <div className="border-t border-border px-4 py-3 space-y-1.5">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 border border-border rounded-xl p-6 card-elevated">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Student Credentials
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Download email and password list for newly imported students
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-status-pending-bg text-status-pending ring-1 ring-inset ring-status-pending/20">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <a
            href="http://localhost:8080/api/admin/csv/download-credentials"
            className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              pendingCount > 0
                ? "border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
                : "border-border text-muted-foreground cursor-not-allowed pointer-events-none opacity-50"
            }`}
            download
            onClick={(e) => {
              if (pendingCount === 0) {
                e.preventDefault();
                return;
              }
              setTimeout(() => setPendingCount(0), 1000);
            }}
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
          {pendingCount === 0 && (
            <p className="text-xs text-muted-foreground">
              No pending credentials to download
            </p>
          )}
        </div>
      </div>
    </div>
  );
}