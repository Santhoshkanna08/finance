import React from "react";
import { 
  PiggyBank, 
  ReceiptIndianRupee, 
  CircleDollarSign,
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  Coins
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { DashboardStats } from "../types";

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigate: (tabId: string) => void;
  isDarkMode: boolean;
  onRefresh: () => void;
}

export default function DashboardView({ stats, onNavigate, isDarkMode, onRefresh }: DashboardViewProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const cards = [
    {
      title: "Total Capital",
      value: formatCurrency(stats.totalCapital),
      description: "Baseline business credit line",
      icon: Coins,
      color: "text-blue-500 bg-blue-500/10",
      tab: "savings"
    },
    {
      title: "Cash Available",
      value: formatCurrency(stats.cashAvailable),
      description: "Liquid cash on hand",
      icon: Coins,
      color: "text-blue-500 bg-blue-500/10",
      tab: "savings"
    },
    {
      title: "Total Money Lent",
      value: formatCurrency(stats.totalMoneyLent),
      description: `Active on ${stats.activeLoansCount} disbursed loans`,
      icon: ReceiptIndianRupee,
      color: "text-violet-500 bg-violet-500/10",
      tab: "loans"
    },
    {
      title: "Total Interest Earned",
      value: formatCurrency(stats.totalInterestEarned),
      description: "Cumulative interest",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
      tab: "logs"
    },
    {
      title: "Total Profit",
      value: formatCurrency(stats.totalCumulativeProfit),
      description: "Cumulative profit",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
      tab: "logs"
    },
    {
      title: "Daily Savings",
      value: formatCurrency(stats.totalSavings),
      description: "Accumulated daily reserves",
      icon: PiggyBank,
      color: "text-amber-500 bg-amber-500/10",
      tab: "savings"
    },
    {
      title: "Active Loans",
      value: `${stats.activeLoansCount} Loans`,
      description: "Currently open",
      icon: ReceiptIndianRupee,
      color: "text-blue-500 bg-blue-500/10",
      tab: "loans"
    },
    {
      title: "Closed Loans",
      value: `${stats.closedLoansCount} Loans`,
      description: "Successfully repaid",
      icon: ReceiptIndianRupee,
      color: "text-slate-500 bg-slate-500/10",
      tab: "loans"
    },
    {
      title: "Overdue Loans",
      value: `${stats.overdueLoansCount} Active`,
      description: "Dues late by 3+ days",
      icon: AlertTriangle,
      color: stats.overdueLoansCount > 0 ? "text-rose-500 bg-rose-500/10 animate-pulse" : "text-slate-400 bg-slate-100 ",
      tab: "notifications"
    },
    {
      title: "Today's Collections",
      value: formatCurrency(stats.todayCollectionsAmount),
      description: "Received payments today",
      icon: CircleDollarSign,
      color: "text-sky-500 bg-sky-500/10",
      tab: "payments"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Financial Overview</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time analytics engine, collection trackers, and reserve statistics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className={`px-4 py-2 text-xs font-semibold rounded-lg font-mono border cursor-pointer transition-colors ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300" 
                : "border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
            }`}
          >
            ● Synchronize Dues
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => {
          const CardIcon = card.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(card.tab)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] hover:shadow-lg ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800/80 hover:border-slate-700 shadow-slate-950/20" 
                  : "bg-white border-slate-200/50 hover:border-slate-300 shadow-slate-100/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 block tracking-wide">{card.title}</span>
                <span className={`p-2.5 rounded-xl ${card.color}`}>
                  <CardIcon className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl md:text-3.5xl font-extrabold tracking-tight font-sans">{card.value}</h3>
                <p className="text-xs text-slate-500/85 mt-2 flex items-center gap-1 font-mono">
                  <span>{card.description}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Col span 2) */}
        <div className={`col-span-1 lg:col-span-2 p-6 rounded-2xl border ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold">Earnings & Collections Trend</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Last 6 Months performance mapping</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High Performance
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.monthlyTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", 
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    color: isDarkMode ? "#f8fafc" : "#0f172a",
                    borderRadius: "8px"
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", marginTop: "10px" }} />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Interest Profit (₹)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="collections" 
                  name="Total Payments Rec. (₹)" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorColl)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection & Recovery rate metrics */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60"
        }`}>
          <div>
            <h3 className="text-base md:text-lg font-bold">Loan Recovery Integrity</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Overall collection fulfillment rate</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center w-36 h-36">
              {/* Outer SVG Gauge */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-slate-250 "
                  strokeWidth="11"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-emerald-500"
                  strokeWidth="11"
                  fill="none"
                  strokeDasharray={389.5}
                  strokeDashoffset={389.5 - (389.5 * (stats.recoveryRate || 100)) / 100}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold font-mono text-slate-900 ">
                  {stats.recoveryRate}%
                </span>
                <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-widest mt-0.5">Fulfillment</span>
              </div>
            </div>
            <p className="text-xs text-center text-slate-400 mt-2 font-mono">
              Outstanding weekly dues have an active collector response.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Collector Service State:</span>
              <span className="font-semibold text-emerald-500 font-mono">● High Speed</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Target Efficiency:</span>
              <span className="font-semibold text-slate-350 font-mono">92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className={`p-6 rounded-2xl border ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60"
      }`}>
        <h3 className="text-sm font-bold tracking-widest uppercase text-slate-400 font-mono mb-4">Quick Command Center</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate("loans")}
            className="flex flex-col items-center p-4 rounded-xl border border-dashed transition-all hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-500/5 border-slate-250 bg-transparent text-center cursor-pointer group"
          >
            <PlusCircle className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold block">Create Loan</span>
            <span className="text-[9px] text-slate-400 block mt-1">Disburse new account</span>
          </button>

          <button
            onClick={() => onNavigate("customers")}
            className="flex flex-col items-center p-4 rounded-xl border border-dashed transition-all hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-500/5 border-slate-250 bg-transparent text-center cursor-pointer group"
          >
            <UserPlus className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold block">Add Customer</span>
            <span className="text-[9px] text-slate-400 block mt-1">Register new client</span>
          </button>

          <button
            onClick={() => onNavigate("payments")}
            className="flex flex-col items-center p-4 rounded-xl border border-dashed transition-all hover:-translate-y-1 hover:border-violet-500 hover:bg-violet-500/5 border-slate-250 bg-transparent text-center cursor-pointer group"
          >
            <CircleDollarSign className="w-6 h-6 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold block">Record Collection</span>
            <span className="text-[9px] text-slate-400 block mt-1">Receive installment</span>
          </button>

          <button
            onClick={() => onNavigate("savings")}
            className="flex flex-col items-center p-4 rounded-xl border border-dashed transition-all hover:-translate-y-1 hover:border-amber-500 hover:bg-amber-500/5 border-slate-250 bg-transparent text-center cursor-pointer group"
          >
            <PiggyBank className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold block">Daily Savings</span>
            <span className="text-[9px] text-slate-400 block mt-1">Lodge savings deposits</span>
          </button>
        </div>
      </div>
    </div>
  );
}
