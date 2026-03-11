import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Upload, AlertCircle, CheckCircle, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface ImportResult {
  imported: number;
  failed: number;
  errors?: { row: number; message: string }[];
  generatedPasswords?: { email: string; password: string }[];
}

export default function CSVImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api<ImportResult>("/api/admin/import", { method: "POST", body: form });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-6">CSV Import</h1>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all duration-200 ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"
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
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2.5 mt-4">
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-status-paid" />
              <span className="text-foreground font-medium">{result.imported} students imported</span>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground font-medium">{result.failed} rows failed</span>
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
                {errorsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {errorsOpen && (
                <div className="border-t border-border px-4 py-3 space-y-1.5">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive">Row {err.row}: {err.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {result.generatedPasswords && result.generatedPasswords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 bg-status-pending-bg/50 border border-status-pending/10 rounded-xl px-4 py-2.5">
                <AlertCircle className="h-4 w-4 text-status-pending" />
                <p className="text-sm text-foreground font-medium">Share these securely — passwords shown once</p>
              </div>
              <div className="table-wrapper">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-th">Email</th>
                      <th className="table-th">Temporary Password</th>
                      <th className="table-th w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.generatedPasswords.map((gp, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="table-td text-foreground">{gp.email}</td>
                        <td className="table-td font-mono text-foreground text-xs">{gp.password}</td>
                        <td className="table-td">
                          <button onClick={() => copyToClipboard(gp.password, i)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent">
                            <Copy className="h-4 w-4" />
                          </button>
                          {copiedIdx === i && <span className="text-[11px] text-status-paid font-medium ml-1">Copied!</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
