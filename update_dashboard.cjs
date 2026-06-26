const fs = require('fs');

// 1. Update src/types.ts
let typesTs = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/types.ts', 'utf8');
const statsTypeOld = `export interface DashboardStats {
  totalCapital: number;
  totalMoneyLent: number;
  activeLoansCount: number;
  currentMonthProfit: number;
  totalCumulativeProfit: number;
  totalSavings: number;
  overdueLoansCount: number;
  todayCollectionsAmount: number;
  monthlyTrends: any[];
  recoveryRate: number;
}`;
const statsTypeNew = `export interface DashboardStats {
  totalCapital: number;
  totalMoneyLent: number;
  activeLoansCount: number;
  currentMonthProfit: number;
  totalCumulativeProfit: number;
  totalSavings: number;
  overdueLoansCount: number;
  todayCollectionsAmount: number;
  monthlyTrends: any[];
  recoveryRate: number;
  closedLoansCount: number;
  totalInterestEarned: number;
  cashAvailable: number;
}`;
typesTs = typesTs.replace(statsTypeOld, statsTypeNew);
fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/types.ts', typesTs, 'utf8');

// 2. Update server/db.ts
let dbTs = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/server/db.ts', 'utf8');

const returnStatsOld = `    return {
      totalCapital: totalCapitalValue,
      totalMoneyLent,
      activeLoansCount,
      currentMonthProfit,
      totalCumulativeProfit,
      totalSavings,
      overdueLoansCount: overdueCount,
      todayCollectionsAmount: todayCollections,
      monthlyTrends,
      recoveryRate
    };`;
    
const returnStatsNew = `    const closedLoansCount = activeLoans.filter(l => l.status === "closed").length;
    const totalInterestEarned = totalCumulativeProfit; // Assuming profit records are interest
    const cashAvailable = totalCapitalValue - totalMoneyLent + totalSavings;
    
    return {
      totalCapital: totalCapitalValue,
      totalMoneyLent,
      activeLoansCount,
      currentMonthProfit,
      totalCumulativeProfit,
      totalSavings,
      overdueLoansCount: overdueCount,
      todayCollectionsAmount: todayCollections,
      monthlyTrends,
      recoveryRate,
      closedLoansCount,
      totalInterestEarned,
      cashAvailable
    };`;

dbTs = dbTs.replaceAll(returnStatsOld, returnStatsNew);
fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/server/db.ts', dbTs, 'utf8');

// 3. Update DashboardView.tsx
let dbView = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/DashboardView.tsx', 'utf8');

const cardsOld = `  const cards = [
    {
      title: "Total Capital Pool",
      value: formatCurrency(stats.totalCapital),
      description: "Baseline business credit line",
      icon: Coins,
      color: "text-blue-500 bg-blue-500/10",
      tab: "savings"
    },
    {
      title: "Total Money Lent",
      value: formatCurrency(stats.totalMoneyLent),
      description: \`Active on \${stats.activeLoansCount} disbursed loans\`,
      icon: ReceiptIndianRupee,
      color: "text-violet-500 bg-violet-500/10",
      tab: "loans"
    },
    {
      title: "Monthly Profit (Jun)",
      value: formatCurrency(stats.currentMonthProfit),
      description: \`Cumulative total: \${formatCurrency(stats.totalCumulativeProfit)}\`,
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
      tab: "logs"
    },
    {
      title: "Total Savings Vault",
      value: formatCurrency(stats.totalSavings),
      description: "Accumulated daily reserves",
      icon: PiggyBank,
      color: "text-amber-500 bg-amber-500/10",
      tab: "savings"
    },
    {
      title: "Overdue Loans",
      value: \`\${stats.overdueLoansCount} Active\`,
      description: "Dues late by 3+ days",
      icon: AlertTriangle,
      color: stats.overdueLoansCount > 0 ? "text-rose-500 bg-rose-500/10 animate-pulse" : "text-slate-400 bg-slate-100 ",
      tab: "notifications"
    },
    {
      title: "Today's Collection",
      value: formatCurrency(stats.todayCollectionsAmount),
      description: "Received payments tracker",
      icon: CircleDollarSign,
      color: "text-sky-500 bg-sky-500/10",
      tab: "payments"
    }
  ];`;

const cardsNew = `  const cards = [
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
      description: \`Active on \${stats.activeLoansCount} disbursed loans\`,
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
      value: \`\${stats.activeLoansCount} Loans\`,
      description: "Currently open",
      icon: ReceiptIndianRupee,
      color: "text-blue-500 bg-blue-500/10",
      tab: "loans"
    },
    {
      title: "Closed Loans",
      value: \`\${stats.closedLoansCount} Loans\`,
      description: "Successfully repaid",
      icon: ReceiptIndianRupee,
      color: "text-slate-500 bg-slate-500/10",
      tab: "loans"
    },
    {
      title: "Overdue Loans",
      value: \`\${stats.overdueLoansCount} Active\`,
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
  ];`;

dbView = dbView.replace(cardsOld, cardsNew);

dbView = dbView.replace(/grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"); // Adjust grid to fit 10 cards better

fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/DashboardView.tsx', dbView, 'utf8');
console.log("Dashboard Updated");
