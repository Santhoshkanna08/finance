import React from "react";
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Check, 
  MessageSquare, 
  Trash,
  Sparkles,
  Info
} from "lucide-react";
import { AppNotification } from "../types";

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onDismissAll: () => void;
  isDarkMode: boolean;
}

export default function NotificationsView({
  notifications,
  onMarkRead,
  onDismissAll,
  isDarkMode
}: NotificationsViewProps) {
  const unresolved = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">Notifications</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Track upcoming installments, overdue indicators, and collection triggers.
          </p>
        </div>

        {unresolved.length > 0 && (
          <button
            onClick={onDismissAll}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
              isDarkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Main warning container */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250/50 shadow-sm"
      }`}>
        <h3 className="font-bold text-sm tracking-widest uppercase text-slate-400 font-mono mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-500 animate-pulse" />
          Active Warnings & Alerts feed
        </h3>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-[11px] leading-relaxed">
              <Sparkles className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
              There are no active or historic notifications in the ledger feed. All accounts are compliant!
            </div>
          ) : (
            notifications.map((n) => {
              // Derive WhatsApp Link
              const waLink = `https://wa.me/?text=Hello%20${encodeURIComponent(n.customerName)}%2C%20this%20is%20a%20priority%20notification%20regarding%20your%20micro-finance%20repayment%20account:%20${encodeURIComponent(n.message)}`;
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    n.read 
                      ? isDarkMode ? "bg-slate-950/20 border-slate-850 opacity-60" : "bg-slate-50 border-slate-150 opacity-60" 
                      : n.type === "overdue"
                        ? "bg-rose-500/[0.03] border-rose-500/20 shadow-xs"
                        : "bg-amber-500/[0.02] border-amber-500/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                      n.type === "overdue" 
                        ? "bg-rose-500/10 text-rose-500" 
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-950 dark:text-slate-100 text-[12px]">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">{n.message}</p>
                      
                      <span className="text-[10px] font-mono text-slate-405 block mt-2 text-slate-400">
                        Logged on: {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {/* Send WhatsApp action trigger */}
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      title="Send WhatsApp Payment Alert"
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-500 transition-colors flex items-center gap-1.5 font-semibold text-[10px] uppercase font-mono"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Alert</span>
                    </a>

                    {!n.read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className={`p-1.5 rounded-lg border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          isDarkMode ? "border-slate-850 text-slate-400" : "border-slate-200 text-slate-600"
                        }`}
                        title="Dismiss alert"
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </button>
                    )}
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
