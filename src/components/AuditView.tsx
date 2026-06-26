import React from "react";
import { History, Shield, Info, CheckCircle, FileText, Trash, RefreshCcw } from "lucide-react";
import { AuditLog } from "../types";

interface AuditViewProps {
  logs: AuditLog[];
  isDarkMode: boolean;
}

export default function AuditView({ logs, isDarkMode }: AuditViewProps) {
  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Compliance Audit Trail</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Chronological record of creations, modifications, deletions, and recoveries in the microfinance system.
        </p>
      </div>

      {/* Main logs container */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250/50 shadow-sm"
      }`}>
        <h3 className="font-bold text-sm tracking-widest uppercase text-slate-400 font-mono mb-4 flex items-center gap-1.5">
          <History className="w-5 h-5 text-emerald-500 animate-spin-reverse" />
          Chronological Audit History logs
        </h3>

        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="py-8 font-mono text-slate-400 text-center italic text-[11px]">
              No audit activities recorded historically.
            </p>
          ) : (
            logs.map((log) => {
              const logDate = new Date(log.createdAt);
              
              // Select color/action indicator icon
              let iconColor = "text-sky-500 bg-sky-500/10";
              if (log.action.includes("CREATE") || log.action === "REGISTER_USER") {
                iconColor = "text-emerald-500 bg-emerald-500/10";
              } else if (log.action.includes("UPDATE")) {
                iconColor = "text-amber-500 bg-amber-500/10";
              } else if (log.action.includes("DELETE")) {
                iconColor = "text-rose-500 bg-rose-500/10";
              } else if (log.action.includes("RESTORE")) {
                iconColor = "text-blue-500 bg-blue-500/10";
              }

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                    isDarkMode ? "bg-slate-950/20 border-slate-850/60" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${iconColor}`}>
                    <Shield className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap text-[11.5px]">
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">by {log.userEmail}</span>
                    </p>
                    
                    <p className="text-slate-500 mt-1">{log.details}</p>
                    
                    <p className="text-[10px] text-slate-450 font-mono mt-1 text-slate-400 block">
                      ID Ref: #{log.id} • {logDate.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
