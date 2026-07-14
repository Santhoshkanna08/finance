import React from "react";
import { 
  CircleDollarSign, 
  Search, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  User, 
  CreditCard,
  MessageSquare,
  ArrowRight,
  Sparkles,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { LoanPayment, Loan } from "../types";

interface PaymentsViewProps {
  payments: LoanPayment[];
  loans: Loan[];
  onRecordPayment: (data: {
    loanId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes: string;
  }) => Promise<boolean>;
  isDarkMode: boolean;
}

export default function PaymentsView({
  payments,
  loans,
  onRecordPayment,
  isDarkMode
}: PaymentsViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // Record Payment Modal
  const [showModal, setShowModal] = React.useState(false);
  const [selectedLoanId, setSelectedLoanId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("gpay");
  const [notes, setNotes] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState("");

  // Filter payment metrics
  const filteredPayments = payments.filter((pay) => {
    const custName = pay.customerName || "";
    const matchesSearch = custName.toLowerCase().includes(searchTerm.toLowerCase()) || pay.loanId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date checks
    let withinDates = true;
    if (dateFrom) {
      withinDates = withinDates && pay.paymentDate >= dateFrom;
    }
    if (dateTo) {
      // Add end-of-day buffer
      withinDates = withinDates && pay.paymentDate <= `${dateTo}T23:59:59.999Z`;
    }
    
    return matchesSearch && withinDates;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !amount) {
      alert("Please select a active loan portfolio and amount!");
      return;
    }

    // Use the selected date; fall back to current moment if somehow blank
    const resolvedDate = paymentDate
      ? new Date(paymentDate + "T00:00:00").toISOString()
      : new Date().toISOString();

    const ok = await onRecordPayment({
      loanId: selectedLoanId,
      amount: Number(amount),
      paymentDate: resolvedDate,
      paymentMethod,
      notes: notes || "Manual payment intake"
    });

    if (ok) {
      setShowModal(false);
      setSelectedLoanId("");
      setAmount("");
      setNotes("");
      setPaymentDate("");
    }
  };

  // CSV Exporter client-side
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;
    
    const headers = ["Payment ID", "Loan ID", "Borrower Name", "Payment Date", "Amount (₹)", "Method", "Journal Notes"];
    const rows = filteredPayments.map(p => [
      p.id,
      p.loanId,
      `"${p.customerName || "Unknown"}"`,
      p.paymentDate,
      p.amount,
      p.paymentMethod,
      `"${p.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_history_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Payments Journal</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time receipt tracker, transaction audits, and chronological collections history.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredPayments.length === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border cursor-pointer hover:bg-slate-50 transition-colors ${
              isDarkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            onClick={() => {
              setPaymentDate(new Date().toISOString().substring(0, 10));
              setShowModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
          >
            <CircleDollarSign className="w-4 h-4" />
            <span>Record Cash Collection</span>
          </button>
        </div>
      </div>

      {/* Toolbar filters box */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250/50"
      }`}>
        {/* Borrower search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search borrower or loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
              isDarkMode 
                ? "bg-slate-950 border-slate-850 text-white focus:border-emerald-500" 
                : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
            }`}
          />
        </div>

        {/* Date ranges select */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs outline-none ${
                isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-slate-50 border-slate-200 text-slate-905"
              }`}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs outline-none ${
                isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-slate-50 border-slate-200 text-slate-905"
              }`}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="px-2.5 py-1.5 text-rose-500 bg-rose-500/10 hover:bg-rose-500/15 font-semibold rounded-lg font-mono text-[10px] uppercase cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Collections History list Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/50"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase font-mono tracking-wider border-b ${
                isDarkMode ? "bg-slate-955/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <th className="py-4 px-5 font-semibold">Borrower details</th>
                <th className="py-4 px-4 font-semibold text-center">Receipt ID</th>
                <th className="py-4 px-4 font-semibold">Payment Channel</th>
                <th className="py-4 px-4 font-semibold text-right">Collected amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 ">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-400 font-mono">
                    No transaction entries recorded matching description.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const pDate = new Date(p.paymentDate);
                  return (
                    <tr key={p.id} className="text-xs transition-colors hover:bg-slate-50/50 ">
                      <td className="py-4 px-5">
                        <p className="font-bold text-[13px] text-slate-900 leading-snug">
                          {p.customerName || "Customer details"}
                        </p>
                        <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] mt-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{pDate.toLocaleDateString()} {pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-[10px] text-slate-400">
                        <span className="block font-bold">#{p.id}</span>
                        <span className="text-[9px] uppercase">Loan: #{p.loanId}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 font-bold font-mono text-[9px] uppercase rounded-full ${
                            p.paymentMethod === "cash" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : p.paymentMethod === "gpay"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-emerald-500/10 text-emerald-500"
                          }`}>
                            {p.paymentMethod.replace(/_/g, " ")}
                          </span>
                        </div>
                        {p.notes && (
                          <p className="text-[10px] text-slate-400 leading-relaxed mt-1 italic">
                            "{p.notes}"
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-[14px] text-emerald-500 font-mono">
                          + ₹{p.amount}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record payment modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-base font-bold">Record Cash Collection</h3>
            <p className="text-xs text-slate-400 mt-1">Lodge a cash collection directly into the accounts journal.</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 font-sans">
              
              {/* Product loan selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Select Active Loan Portfolio</label>
                <select
                  required
                  value={selectedLoanId}
                  onChange={(e) => {
                    setSelectedLoanId(e.target.value);
                    const l = loans.find(x => x.id === e.target.value);
                    if (l) {
                      setAmount(l.type === "weekly" ? (l.weeklyPayment || 0).toString() : (l.monthlyInterest || 0).toString());
                    }
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                >
                  <option value="" disabled className="text-gray-500">-- Select Debtor Portfolio --</option>
                  {loans
                    .filter(l => l.status !== "closed" && !l.isDeleted)
                    .map((l) => (
                      <option key={l.id} value={l.id} className="text-black">
                        {l.customerName} (Ref: #{l.id} - Out: ₹{l.balance})
                      </option>
                    ))}
                </select>
              </div>

              {/* Collected Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Collected Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="₹ Installment Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              {/* Payment Date — editable so payments on other days can be logged correctly */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                      isDarkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Defaults to today — change if payment was received on a different day</p>
              </div>

              {/* Method */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Collection Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                >
                  <option value="gpay" className="text-black">Google Pay (GPay)</option>
                  <option value="phonepe" className="text-black">PhonePe</option>
                  <option value="cash" className="text-black">Cash Collection</option>
                  <option value="bank_transfer" className="text-black">NetBanking/NEFT</option>
                  <option value="other" className="text-black">Other Mode</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Journal Memo Note</label>
                <input
                  type="text"
                  placeholder="e.g. Received weekly schedule dues"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 font-semibold rounded-lg border ${
                    isDarkMode ? "border-slate-850 hover:bg-slate-800 text-slate-400" : "border-slate-250 hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                >
                  Confirm Journal Collection
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
