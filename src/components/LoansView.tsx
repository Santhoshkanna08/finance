import React from "react";
import { 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Check, 
  Coins, 
  Activity, 
  ArrowRight,
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Percent,
  X,
  CreditCard
} from "lucide-react";
import { Customer, Loan, LoanType } from "../types";

interface LoansViewProps {
  loans: Loan[];
  customers: Customer[];
  onAddLoan: (data: {
    customerId: string;
    type: LoanType;
    amount: number;
    interestRate: number;
    durationWeeks?: number;
    weeklyPayment?: number;
    monthlyInterest?: number;
  }) => Promise<boolean>;
  onRecordPayment: (data: {
    loanId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes: string;
  }) => Promise<boolean>;
  onSettlePrincipal: (loanId: string, amount: number) => Promise<boolean>;
  onDeleteLoan: (id: string, permanent: boolean) => Promise<boolean>;
  isDarkMode: boolean;
}

export default function LoansView({
  loans,
  customers,
  onAddLoan,
  onRecordPayment,
  onSettlePrincipal,
  onDeleteLoan,
  isDarkMode
}: LoansViewProps) {
  // Filters and searches
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "overdue" | "closed">("all");
  
  // Details draw states
  const [selectedLoan, setSelectedLoan] = React.useState<Loan | null>(null);
  
  // Add Loan Form states
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [loanType, setLoanType] = React.useState<LoanType>("advance_interest");
  const [amount, setAmount] = React.useState("");
  const [interestRate, setInterestRate] = React.useState("300"); // Absolute interest amount
  
  // Weekly Repayment parameters
  const [durationWeeks, setDurationWeeks] = React.useState("12");
  const [weeklyPayment, setWeeklyPayment] = React.useState("");
  
  // Interest-Only parameters
  const [monthlyInterest, setMonthlyInterest] = React.useState("");

  // Payment triggers modals
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("gpay");
  const [payNotes, setPayNotes] = React.useState("");

  // Principal Settle triggers
  const [showSettleModal, setShowSettleModal] = React.useState(false);
  const [settleAmount, setSettleAmount] = React.useState("");

  // Statement printing
  const [printTargetLoan, setPrintTargetLoan] = React.useState<Loan | null>(null);

  // Auto-calculated fields for new loan form
  const amountGiven = Math.max(0, (Number(amount) || 0) - (Number(interestRate) || 0));
  React.useEffect(() => {
    const principal = Number(amount) || 0;
    const rate = Number(interestRate) || 0;
    
    if (loanType === "advance_interest") {
      const weeks = Number(durationWeeks) || 12;
      const totalRepayable = principal;
      const weeklyReturn = weeks > 0 ? Math.ceil(totalRepayable / weeks) : 0;
      setWeeklyPayment(weeklyReturn.toString());
    } else {
      const monthlyInt = rate;
      setMonthlyInterest(monthlyInt.toString());
    }
  }, [amount, interestRate, loanType, durationWeeks]);

  // Filters calculation
  const filteredLoans = loans.filter(l => {
    const custName = l.customerName || "";
    const matchesSearch = custName.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.includes(searchTerm);
    if (statusFilter === "all") return matchesSearch;
    return l.status === statusFilter && matchesSearch;
  });

  const handleCreateLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount || !interestRate) {
      alert("Please configure the customer and amount correctly");
      return;
    }

    const payload = {
      customerId: selectedCustomerId,
      type: loanType,
      amount: Number(amount),
      interestRate: Number(interestRate),
      durationWeeks: loanType === "advance_interest" ? Number(durationWeeks) : undefined,
      weeklyPayment: loanType === "advance_interest" ? Number(weeklyPayment) : undefined,
      monthlyInterest: loanType === "monthly_interest" ? Number(monthlyInterest) : undefined
    };

    const success = await onAddLoan(payload);
    if (success) {
      setShowAddModal(false);
      setSelectedCustomerId("");
      setAmount("");
      setInterestRate("10");
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !payAmount) return;

    const ok = await onRecordPayment({
      loanId: selectedLoan.id,
      amount: Number(payAmount),
      paymentDate: new Date().toISOString(),
      paymentMethod: payMethod,
      notes: payNotes || "Collected installment"
    });

    if (ok) {
      setShowPayModal(false);
      setPayAmount("");
      setPayNotes("");
      
      // Update selectedLoan in drawer to reflect newest schedule logs
      const updated = loans.find(l => l.id === selectedLoan.id);
      if (updated) setSelectedLoan(updated);
    }
  };

  const handleSettlePrincipalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !settleAmount) return;

    const ok = await onSettlePrincipal(selectedLoan.id, Number(settleAmount));
    if (ok) {
      setShowSettleModal(false);
      setSettleAmount("");
      
      // Update local view
      const updated = loans.find(l => l.id === selectedLoan.id);
      if (updated) setSelectedLoan(updated);
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    const yes = window.confirm("Are you sure you want to move this active loan record to Trash? This soft-deletes the schedule. Proceed?");
    if (yes) {
      await onDeleteLoan(id, false);
      setSelectedLoan(null);
    }
  };

  const openPaymentModal = (instAmount?: number) => {
    if (instAmount) {
      setPayAmount(instAmount.toString());
    } else if (selectedLoan) {
      if (selectedLoan.type === "advance_interest") {
        setPayAmount((selectedLoan.weeklyPayment || 0).toString());
      } else {
        setPayAmount((selectedLoan.monthlyInterest || 0).toString());
      }
    }
    setPayNotes(selectedLoan?.type === "weekly" ? "Collected weekly payment" : "Monthly Interest Received");
    setShowPayModal(true);
  };

  // CSV Exporter client-side
  const handleExportCSV = () => {
    if (filteredLoans.length === 0) return;
    
    // Header
    const headers = ["Loan ID", "Borrower Name", "Type", "Principal", "Markup Rate (%)", "Balance Remaining", "Profit Earned", "Status", "Date Disbursed"];
    const rows = filteredLoans.map(l => [
      l.id,
      `"${l.customerName || "Unknown"}"`,
      l.type,
      l.amount,
      l.interestRate,
      l.balance,
      l.totalProfit,
      l.status,
      l.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loans_audit_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client side Statement PDF view printable trigger
  const triggerPrintPreview = (loan: Loan) => {
    setPrintTargetLoan(loan);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Printable Area - Render hidden ordinarily unless @media print is active */}
      {printTargetLoan && (
        <div id="print-view" className="hidden print:block fixed inset-0 bg-white text-black p-10 z-50 overflow-y-auto">
          <div className="border-b-2 pb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-emerald-600">CapitalFlow Micro-Finance</h1>
              <p className="text-xs font-mono text-gray-500">Corporate Loan Division, Personal Finance Ledger</p>
              <p className="text-xs text-gray-500 mt-1 font-mono">Date Generated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold bg-black text-white px-3 py-1 uppercase rounded-sm">
                Statement of Account
              </span>
              <p className="text-xs font-mono mt-1 font-bold text-emerald-600">Ref: #{printTargetLoan.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 my-6 text-xs">
            <div>
              <h3 className="font-bold text-gray-400 font-mono tracking-wider text-[10px] uppercase mb-1">Debtor / Customer Details</h3>
              <p className="text-sm font-bold text-slate-800">{printTargetLoan.customerName || "Undetermined Borrower"}</p>
              <p className="text-gray-600 mt-1">ID Ref: #{printTargetLoan.customerId}</p>
              <p className="text-gray-500">Date Logged: {new Date(printTargetLoan.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-400 font-mono tracking-wider text-[10px] uppercase mb-1">Capital configuration</h3>
              <p className="text-sm font-mono font-bold">Loan Product: <span className="uppercase">{printTargetLoan.type}</span></p>
              <p className="text-gray-600 font-mono">Markup/Interest: {printTargetLoan.interestRate}%</p>
              <p className="text-emerald-600 font-mono font-bold text-base mt-1">Outstanding Balance: ₹{printTargetLoan.balance}</p>
            </div>
          </div>

          <div className="border border-gray-400 rounded-sm overflow-hidden my-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-400 uppercase font-mono font-bold text-[10px] text-gray-600">
                  <th className="p-3">Product Parameter</th>
                  <th className="p-3 text-center">Value (₹)</th>
                  <th className="p-3 text-right">Metrics Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                <tr>
                  <td className="p-3 font-semibold">Contracted Loan Principal</td>
                  <td className="p-3 text-center font-mono font-semibold">₹{printTargetLoan.amount}</td>
                  <td className="p-3 text-right text-gray-500 font-mono">Original Disbursed Base</td>
                </tr>
                {printTargetLoan.type === "advance_interest" && (
                  <tr>
                    <td className="p-3 font-medium">Weekly Repayment Installment</td>
                    <td className="p-3 text-center font-mono">₹{printTargetLoan.weeklyPayment} ({printTargetLoan.durationWeeks} Weeks)</td>
                    <td className="p-3 text-right text-gray-500 font-mono">Duration Bound Contract</td>
                  </tr>
                )}
                {printTargetLoan.type === "monthly_interest" && (
                  <tr>
                    <td className="p-3 font-medium">Monthly Interest Obligation</td>
                    <td className="p-3 text-center font-mono">₹{printTargetLoan.monthlyInterest}/Month</td>
                    <td className="p-3 text-right text-gray-500 font-mono">Collateral Outstanding</td>
                  </tr>
                )}
                <tr className="bg-emerald-50/50 font-bold">
                  <td className="p-3">Accumulated Interest Profit</td>
                  <td className="p-3 text-center font-mono text-emerald-600">₹{printTargetLoan.totalProfit.toFixed(0)}</td>
                  <td className="p-3 text-right text-emerald-600 font-mono">Net Yield Realized</td>
                </tr>
              </tbody>
            </table>
          </div>

          {printTargetLoan.repaymentSchedule && (
            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-[11px] font-mono tracking-wider uppercase text-gray-500 border-b pb-2">Repayment Installments Schedule</h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b font-mono text-gray-400 text-[10px] uppercase">
                    <th className="py-2">No.</th>
                    <th className="py-2">Expected Due Date</th>
                    <th className="py-2 text-center">Payment Amount (₹)</th>
                    <th className="py-2 text-right">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {printTargetLoan.repaymentSchedule.map((inst, index) => (
                    <tr key={index}>
                      <td className="py-2 font-mono">Week #{index + 1}</td>
                      <td className="py-2 font-mono text-gray-500">{new Date(inst.dueDate).toLocaleDateString()}</td>
                      <td className="py-2 text-center font-mono">₹{inst.amount}</td>
                      <td className="py-2 text-right">
                        <span className={`font-mono font-bold text-[10px] ${
                          inst.paid ? "text-emerald-600" : "text-rose-500"
                        }`}>
                          {inst.paid ? `PAID ON ${inst.paidDate ? new Date(inst.paidDate).toLocaleDateString() : 'N/A'}` : "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-gray-400 text-center text-[10px] font-mono text-gray-500">
            <p>This is a system generated printout from CapitalFlow Microfinance. No signature is legally required.</p>
            <p className="mt-1">© 2026 Personal Finance Business Consortium. All Rights Reserved.</p>
          </div>
        </div>
      )}

      {/* Main Command and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Loans Ledger</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Issue flexible weekly or interest-only assets, process partial payoffs, and monitor repayments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredLoans.length === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border cursor-pointer hover:bg-slate-50 transition-colors ${
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
            <span>Issue New Loan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Tab filters */}
        <div className="flex p-0.5 rounded-lg bg-slate-150 max-w-sm self-start">
          {(["all", "active", "overdue", "closed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                statusFilter === f 
                  ? "bg-white text-slate-900 shadow" 
                  : "text-slate-500 hover:text-slate-700 "
              }`}
            >
              <span className="capitalize">{f}</span>
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search borrower or loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-white focus:border-emerald-500" 
                : "bg-white border-slate-200 text-slate-900 focus:border-emerald-500 focus:shadow-sm"
            }`}
          />
        </div>
      </div>

      {/* Main grid / content pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* Table list column (Col span 2) */}
        <div className={`lg:col-span-2 border rounded-2xl overflow-hidden shadow-sm ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/50"
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-xs uppercase font-mono tracking-wider border-b ${
                  isDarkMode ? "bg-slate-950/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  <th className="py-4 px-4 font-semibold">Borrower details</th>
                  <th className="py-4 px-4 font-semibold">Loan Product</th>
                  <th className="py-4 px-4 font-semibold text-right">Repayment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 ">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-xs text-slate-400 font-mono">
                      No active ledger entries match current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const isSelected = selectedLoan?.id === loan.id;
                    return (
                      <tr 
                        key={loan.id}
                        onClick={() => setSelectedLoan(loan)}
                        className={`text-xs transition-colors cursor-pointer hover:bg-slate-50/50 ${
                          isSelected ? "bg-emerald-500/[0.02]" : ""
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="font-bold text-[13px] text-slate-900 flex items-center gap-1.5 hover:underline">
                            {loan.customerName || "Customer Details"}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            ID: #{loan.id} • Issued: {new Date(loan.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 font-bold">
                              {loan.type.replace(/_/g, " ")}
                            </span>
                            <span className="font-bold text-slate-700 font-mono">₹{loan.amount}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-1"> Rate Cost: {loan.interestRate}%</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-block text-right">
                            <p className="font-bold text-emerald-500 font-mono text-[13px]">₹{loan.balance} Balance</p>
                            <span className={`inline-block px-2 py-0.5 mt-1 font-mono text-[9px] font-bold uppercase rounded-full ${
                              loan.status === "active" 
                                ? "bg-blue-500/10 text-blue-500" 
                                : loan.status === "closed"
                                  ? "bg-slate-200 text-slate-400"
                                  : "bg-red-500/15 text-red-500 text-bold"
                            }`}>
                              {loan.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Draw and Installment collector column */}
        <div className={`p-6 rounded-2xl border transition-all ${
          selectedLoan 
            ? isDarkMode ? "bg-slate-900 border-slate-850" : "bg-white border-slate-250/80 shadow-md"
            : "hidden lg:flex flex-col items-center justify-center p-8 border-dashed text-slate-400 text-center"
        }`}>
          {selectedLoan ? (
            <div className="space-y-6 animate-fade-in text-xs">
              
              {/* Card top details */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {selectedLoan.customerName || "Customer Details"}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Loan ID: #{selectedLoan.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedLoan(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 lg:hidden"
                >
                  Close
                </button>
              </div>

              {/* Quick stats panel */}
              <div className={`p-4 rounded-xl grid grid-cols-2 gap-3 border ${
                isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-200"
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Disbursed Amt</span>
                  <span className="text-sm font-extrabold font-mono text-slate-800 ">₹{selectedLoan.amount}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Yield Profit</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-500">₹{selectedLoan.totalProfit.toFixed(0)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/50 ">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Remaining Principal Out.</span>
                  <span className="text-base font-extrabold font-mono text-blue-500">₹{selectedLoan.balance}</span>
                </div>
              </div>

              {/* Actions panel */}
              <div className="space-y-2">
                <button
                  onClick={() => openPaymentModal()}
                  disabled={selectedLoan.balance <= 0 || selectedLoan.status === "closed"}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                >
                  <Coins className="w-4 h-4" />
                  <span>Receive Payment Installment</span>
                </button>

                {selectedLoan.type === "monthly_interest" && (
                  <button
                    onClick={() => setShowSettleModal(true)}
                    disabled={selectedLoan.balance <= 0 || selectedLoan.status === "closed"}
                    className="w-full py-2 bg-transparent text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/5 disabled:opacity-50 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payoff Principal Base</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => triggerPrintPreview(selectedLoan)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                      isDarkMode ? "border-slate-800 hover:bg-slate-800 text-slate-350" : "border-slate-250 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Print Statement</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTrigger(selectedLoan.id)}
                    className="py-2 text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-500 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Trash Record</span>
                  </button>
                </div>
              </div>

              {/* Repayment Installments scheduler */}
              {selectedLoan.repaymentSchedule ? (
                <div className="space-y-3 pt-4 border-t border-slate-200/50 ">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-slate-400 font-mono tracking-wider uppercase">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    Installment Calendar Schedule
                  </h4>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {selectedLoan.repaymentSchedule.map((inst, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                          inst.paid 
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 " 
                            : "bg-slate-950/20 border-slate-800/50 text-slate-400"
                        }`}
                      >
                        <div>
                          <p className="font-bold">Week #{idx + 1} Installment</p>
                          <span className="text-[10px] font-mono text-slate-500 capitalize">
                            Due: {new Date(inst.dueDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono">₹{inst.amount}</span>
                          {inst.paid ? (
                            <span className="p-0.5 rounded-full bg-emerald-500 text-white block">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedLoan(selectedLoan);
                                openPaymentModal(inst.amount);
                              }}
                              className="px-2 py-0.5 text-[9px] bg-emerald-500 text-white rounded font-bold font-mono hover:bg-emerald-600 shadow-xs cursor-pointer"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-slate-200/50 ">
                  <h4 className="font-bold text-xs text-slate-400 font-mono tracking-wider uppercase">
                    Interest-Only Schedule
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Outstanding monthly interest: ₹{selectedLoan.monthlyInterest}/Month. Standard payments collect interest yields into profits. Principal base remains due until repaid completely using payoff triggers.
                  </p>
                </div>
              )}

            </div>
          ) : (
            <>
              <Coins className="w-10 h-10 text-slate-400/80 mb-3" />
              <h3 className="font-bold text-xs font-mono tracking-widest uppercase">Inspect Portfolio details</h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                Select borrowings row listing on the side to access statements, pay catalogs, and schedules.
              </p>
            </>
          )}
        </div>

      </div>

      {/* Disburse Loan Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md print:hidden">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-lg font-bold">Disburse New Loan Asset</h3>
            <p className="text-xs text-slate-400 mt-1">Select borrower and define repayment constraints.</p>

            <form onSubmit={handleCreateLoanSubmit} className="space-y-4 mt-4 text-xs font-sans">
              
              {/* Product Customer selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Select Active Customer</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                  }`}
                >
                  <option value="" disabled className="text-gray-500">-- Choose Borrower --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan type togglers */}
              <div className="space-y-1 text-xs">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Loan Product Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLoanType("advance_interest")}
                    className={`py-2 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                      loanType === "advance_interest" 
                        ? "bg-emerald-500 text-white shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Advance Interest
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType("monthly_interest")}
                    className={`py-2 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                      loanType === "monthly_interest" 
                        ? "bg-emerald-500 text-white shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Monthly Interest
                  </button>
                </div>
              </div>

              {/* Principal amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Loan Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-7 pr-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                      isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                    }`}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Amount Given (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    disabled
                    value={amountGiven}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Conditional parameters based on weekly vs interest_only */}
              {loanType === "advance_interest" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 block font-mono">Interest Amount (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="10"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                          isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 block font-mono">Duration (Weeks)</label>
                      <input
                        type="number"
                        required
                        placeholder="12"
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                          isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg">
                    <p className="font-extrabold text-xs">Generated Schedule Summary:</p>
                    <p className="text-[11px] font-mono mt-1">
                      Debtor returns <span className="font-bold">₹{weeklyPayment}/Week</span> for <span className="font-bold">{durationWeeks} Weeks</span>.
                    </p>
                    <p className="text-[11px] font-mono">
                      Expected Cumulative repayment total: <span className="font-bold">₹{Number(weeklyPayment) * Number(durationWeeks)}</span> (Includes profit markup).
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block font-mono">Monthly Interest Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="2"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                        isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                      }`}
                    />
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg">
                    <p className="font-extrabold text-xs">Interest-Only Summary:</p>
                    <p className="text-[11px] font-mono mt-1">
                      Debtor returns <span className="font-bold">₹{monthlyInterest}/Month</span> as pure interest.
                    </p>
                    <p className="text-[11px] font-mono">
                      Principal base <span className="font-bold">₹{amount}</span> remains due for settlement anytime.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-3 text-xs font-sans">
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
                  Disburse Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment / Collect Installment Modal */}
      {showPayModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md print:hidden">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-base font-bold">Record Cash Payment</h3>
            <p className="text-xs text-slate-400 mt-1">Lodge installment collected from {selectedLoan.customerName}</p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 mt-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Amount to Collect (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850/80" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Payment Mode Channel</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent ${
                    isDarkMode ? "bg-slate-950 border-slate-850/80" : "bg-slate-50 border-slate-250"
                  }`}
                >
                  <option value="gpay" className="text-black">Google Pay (GPay)</option>
                  <option value="phonepe" className="text-black">PhonePe</option>
                  <option value="cash" className="text-black">Cash Collection</option>
                  <option value="bank_transfer" className="text-black">NetBanking/NEFT</option>
                  <option value="other" className="text-black">Other Mode</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Transaction Memo Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Week #4 repayment"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850/80" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
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
                  Commit Journal Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Principal Modal (Interest-Only Payoff) */}
      {showSettleModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md print:hidden">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-base font-bold text-slate-900 ">Payoff Loan Principal</h3>
            <p className="text-xs text-slate-400 mt-1">Settle portion or entire outstanding principal of ₹{selectedLoan.balance}</p>

            <form onSubmit={handleSettlePrincipalSubmit} className="space-y-4 mt-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Principal Settle Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder={`Max ₹${selectedLoan.balance}`}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850/80" : "bg-slate-50 border-slate-250"
                  }`}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
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
                  Confirm Settle Payoff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
