import React from "react";
import { 
  PiggyBank, 
  Plus, 
  Clock, 
  User, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle2,
  Calendar,
  Sparkles,
  Info
} from "lucide-react";
import { Saving } from "../types";

interface SavingsViewProps {
  savings: Saving[];
  onAddSaving: (amount: number, date: string, notes: string) => Promise<boolean>;
  isDarkMode: boolean;
}

export default function SavingsView({
  savings,
  onAddSaving,
  isDarkMode
}: SavingsViewProps) {
  // State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = React.useState("");

  // Statistics summaries
  const totalSavings = savings.reduce((acc, s) => acc + s.amount, 0);

  // Group by Month summary calculations
  const monthlySummary: { [month: string]: number } = {};
  savings.forEach(s => {
    // Extract YYYY-MM
    const m = s.date.substring(0, 7);
    monthlySummary[m] = (monthlySummary[m] || 0) + s.amount;
  });

  const formattedMonthlyList = Object.entries(monthlySummary).map(([key, val]) => {
    const d = new Date(`${key}-02`); // Avoid timezone wraps
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    return { key, label, val };
  }).sort((a,b) => b.key.localeCompare(a.key));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    const ok = await onAddSaving(Number(amount), date, notes);
    if (ok) {
      setAmount("");
      setNotes("");
      setShowAddModal(false);
    }
  };

  // CSV Exporter client-side
  const handleExportCSV = () => {
    if (savings.length === 0) return;
    
    const headers = ["ID", "Deposit Date", "Amount (₹)", "Depositor Name", "Memo Notes"];
    const rows = savings.map(s => [
      s.id,
      s.date,
      s.amount,
      `"${s.contributorName}"`,
      `"${s.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `savings_journal_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Savings Vault</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Build up persistent business liquidity reserves, declare daily cash savings, and view monthly accumulations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={savings.length === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
              isDarkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Daily Savings</span>
          </button>
        </div>
      </div>

      {/* Statistics and summary breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Cash savings counter widget */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250/50 shadow-sm"
        }`}>
          <div>
            <span className="text-xs text-slate-400 block font-mono uppercase tracking-wider">Total Accumulated Savings</span>
            <h2 className="text-3xl md:text-4.5xl font-black font-sans text-emerald-500 mt-2">
              ₹{totalSavings.toLocaleString("en-IN")}
            </h2>
          </div>
          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/80 text-[11px] text-slate-400 font-mono mt-4 flex items-center gap-1">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" /> Fully Backed Capital Reserve
          </div>
        </div>

        {/* Monthly summaries list (Col span 2) */}
        <div className={`p-6 rounded-2xl border md:col-span-2 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250/50 shadow-sm"
        }`}>
          <h3 className="font-bold text-sm tracking-widest uppercase text-slate-400 font-mono mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
            Monthly Savings Summaries
          </h3>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {formattedMonthlyList.length === 0 ? (
              <p className="text-slate-400 font-mono italic text-[11px] py-4">No savings recorded historically.</p>
            ) : (
              formattedMonthlyList.map((m) => (
                <div
                  key={m.key}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{m.label}</span>
                  </div>
                  <span className="font-extrabold font-mono text-emerald-500 text-sm">
                    ₹{m.val.toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* List of savings log table */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/50"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className={`text-xs uppercase font-mono tracking-wider border-b ${
                isDarkMode ? "bg-slate-955/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <th className="py-4 px-5 font-semibold">Deposit Date</th>
                <th className="py-4 px-4 font-semibold text-center">Reference ID</th>
                <th className="py-4 px-4 font-semibold">Deposited By / Notes</th>
                <th className="py-4 px-4 font-semibold text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
              {savings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-400 font-mono">
                    Reserve ledger empty. Record daily savings deposits to begin tracking capital balances.
                  </td>
                </tr>
              ) : (
                savings.map((s) => (
                  <tr key={s.id} className="text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-955/10">
                    <td className="py-4 px-5">
                      <div className="font-bold text-[13px] text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                        {s.date}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-400 text-[10px]">
                      #{s.id}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-350">{s.contributorName || "System Staff"}</p>
                      {s.notes && (
                        <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                          "{s.notes}"
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-extrabold text-[14px] text-emerald-500 font-mono">
                        + ₹{s.amount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Deposit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-base font-bold">Record Savings Deposit</h3>
            <p className="text-xs text-slate-400 mt-1">Lodge daily business collection proceeds into safety deposits.</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 font-sans">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Date of Deposit</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Deposit Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Audit Transaction Notes</label>
                <input
                  type="text"
                  placeholder="e.g. surplus collections from weekly returns"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 font-semibold rounded-lg border ${
                    isDarkMode ? "border-slate-850 hover:bg-slate-800 text-slate-400" : "border-slate-250 hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                >
                  Record Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
