import React from "react";
import { Trash2, RotateCcw, AlertTriangle, Sparkles, FolderLock, Info } from "lucide-react";
import { TrashRecord } from "../types";

interface TrashViewProps {
  trashItems: TrashRecord[];
  onRestore: (id: string) => Promise<boolean>;
  onDeletePermanent: (table: string, id: string) => Promise<boolean>;
  isDarkMode: boolean;
  onRefresh: () => void;
}

export default function TrashView({
  trashItems,
  onRestore,
  onDeletePermanent,
  isDarkMode,
  onRefresh
}: TrashViewProps) {

  const handleRestoreClick = async (id: string, name: string) => {
    const ok = window.confirm(`Restore "${name}" back into active database collections?`);
    if (ok) {
      await onRestore(id);
    }
  };

  const handleDeletePermanentClick = async (table: string, id: string, name: string) => {
    const ok = window.confirm(`CRITICAL WARNING: Are you sure you want to permanently erase "${name}"? This operation cannot be undone. Proceed?`);
    if (ok) {
      // Send hard delete instruction
      await onDeletePermanent(table, id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Trash Garbage Bin</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Browse soft-deleted client rosters or savings blocks. Restore them back, or purge files permanently.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
            isDarkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          Synchronize Trash
        </button>
      </div>

      {/* Main Container */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250/50 shadow-sm"
      }`}>
        <h3 className="font-bold text-sm tracking-widest uppercase text-slate-400 font-mono mb-6 flex items-center gap-1.5">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Soft Deleted Records
        </h3>

        <div className="space-y-3">
          {trashItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-mono text-[11px] leading-relaxed">
              <Sparkles className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
              Your Trash Bin is clean. There are no soft-deleted entries in the system.
            </div>
          ) : (
            trashItems.map((item) => {
              const deletedDate = new Date(item.deletedAt);
              const originalData = item.recordData;
              const title = originalData.name || originalData.amount ? `₹${originalData.amount}` : "Unnamed Item";
              const detailLabel = originalData.name 
                ? `Customer (Notes: ${originalData.notes || 'None'})` 
                : originalData.type 
                  ? `Loan of ₹${originalData.amount} (${originalData.type})` 
                  : `Savings of ₹${originalData.amount}`;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isDarkMode ? "bg-slate-950/20 border-slate-850/60" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-rose-500/10 text-rose-500 mt-1 flex-shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </span>

                    <div>
                      <h4 className="font-bold text-[12px] text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{originalData.name || `Asset Outflow Ledger`}</span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-400">
                          {item.originalTable}
                        </span>
                      </h4>
                      <p className="text-slate-400 mt-1">{detailLabel}</p>
                      
                      <div className="flex items-center gap-1 text-slate-405 mt-2 text-[10px] text-slate-500 font-mono">
                        <span>TrashRef: #{item.id} • Deleted at {deletedDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleRestoreClick(item.id, originalData.name || originalData.id)}
                      className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="Restore back into active list"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>

                    <button
                      onClick={() => handleDeletePermanentClick(item.originalTable, originalData.id, originalData.name || originalData.id)}
                      className="p-2 rounded-lg bg-rose-550/15 hover:bg-rose-500/15 border border-rose-500/20 text-rose-550 cursor-pointer"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
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
