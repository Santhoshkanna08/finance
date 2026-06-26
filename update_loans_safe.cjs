const fs = require('fs');

let loansView = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/LoansView.tsx', 'utf8');

// Replacements
loansView = loansView.replaceAll('useState<LoanType>("weekly");', 'useState<LoanType>("advance_interest");');
loansView = loansView.replaceAll('useState("10"); // Standard markup % or interest %', 'useState("300"); // Absolute interest amount');

const useEffectOld = `  // Auto-calculated fields for new loan form
  React.useEffect(() => {
    const principal = Number(amount) || 0;
    const rate = Number(interestRate) || 0;
    
    if (loanType === "weekly") {
      const weeks = Number(durationWeeks) || 12;
      // Total amount repayable with interest percentage markup
      // For example, if markup is 20% on ₹10,000, final return = ₹12,000
      const totalRepayable = principal + (principal * (rate / 100));
      const weeklyReturn = weeks > 0 ? Math.ceil(totalRepayable / weeks) : 0;
      setWeeklyPayment(weeklyReturn.toString());
    } else {
      // Monthly interest only (Interest rate per month)
      // E.g. 2% interest per month on ₹10,000 is ₹200
      const monthlyInt = principal * (rate / 100);
      setMonthlyInterest(monthlyInt.toString());
    }
  }, [amount, interestRate, loanType, durationWeeks]);`;

const useEffectNew = `  // Auto-calculated fields for new loan form
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
  }, [amount, interestRate, loanType, durationWeeks]);`;

loansView = loansView.replace(useEffectOld, useEffectNew);

// Form payload
loansView = loansView.replaceAll('loanType === "weekly" ? Number(durationWeeks) : undefined', 'loanType === "advance_interest" ? Number(durationWeeks) : undefined');
loansView = loansView.replaceAll('loanType === "weekly" ? Number(weeklyPayment) : undefined', 'loanType === "advance_interest" ? Number(weeklyPayment) : undefined');
loansView = loansView.replaceAll('loanType === "interest_only" ? Number(monthlyInterest) : undefined', 'loanType === "monthly_interest" ? Number(monthlyInterest) : undefined');

// General UI / Labels
loansView = loansView.replaceAll('setLoanType("weekly")', 'setLoanType("advance_interest")');
loansView = loansView.replaceAll('loanType === "weekly"', 'loanType === "advance_interest"');
loansView = loansView.replaceAll('setLoanType("interest_only")', 'setLoanType("monthly_interest")');
loansView = loansView.replaceAll('loanType === "interest_only"', 'loanType === "monthly_interest"');

loansView = loansView.replaceAll('Weekly Repayments', 'Advance Interest');
loansView = loansView.replaceAll('Interest-Only Loan', 'Monthly Interest');

loansView = loansView.replaceAll('Principal Amount (₹)', 'Loan Value (₹)');
loansView = loansView.replaceAll('Interest Markup (%)', 'Interest Amount (₹)');
loansView = loansView.replaceAll('Monthly Interest Charge (%)', 'Monthly Interest Amount (₹)');

// Amount given input field
const amountInputOld = `              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Loan Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={\`w-full pl-7 pr-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 focus:bg-transparent \${
                      isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-250"
                    }\`}
                  />
                </div>
              </div>`;
              
const amountInputNew = amountInputOld + `
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
              </div>`;

loansView = loansView.replace(amountInputOld, amountInputNew);

loansView = loansView.replaceAll('selectedLoan.type === "weekly"', 'selectedLoan.type === "advance_interest"');
loansView = loansView.replaceAll('selectedLoan.type === "interest_only"', 'selectedLoan.type === "monthly_interest"');
loansView = loansView.replaceAll('printTargetLoan.type === "weekly"', 'printTargetLoan.type === "advance_interest"');
loansView = loansView.replaceAll('printTargetLoan.type === "interest_only"', 'printTargetLoan.type === "monthly_interest"');
loansView = loansView.replaceAll('loan.type === "weekly"', 'loan.type === "advance_interest"');
loansView = loansView.replaceAll('loan.type === "interest_only"', 'loan.type === "monthly_interest"');
loansView = loansView.replaceAll('printTargetLoan.type === "advance_interest"', 'printTargetLoan.type === "advance_interest"'); // Noop

fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/LoansView.tsx', loansView, 'utf8');

// update server/db.ts to match the new logic
let dbTs = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/server/db.ts', 'utf8');

const dbAddLoanOld = `    if (l.type === "weekly") {
      const duration = l.durationWeeks || 12;
      const weeklyReturn = l.weeklyPayment || 200;
      balance = duration * weeklyReturn;

      const startDate = new Date();
      for (let i = 1; i <= duration; i++) {
        const dueDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        repaymentSchedule.push({
          dueDate: dueDate.toISOString(),
          amount: weeklyReturn,
          paid: false
        });
      }
    }`;

const dbAddLoanNew = `    if (l.type === "advance_interest") {
      const duration = l.durationWeeks || 12;
      const weeklyReturn = l.weeklyPayment || Math.ceil(l.amount / duration);
      balance = l.amount;

      const startDate = new Date();
      for (let i = 1; i <= duration; i++) {
        const dueDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        repaymentSchedule.push({
          dueDate: dueDate.toISOString(),
          amount: weeklyReturn,
          paid: false
        });
      }
    }`;
dbTs = dbTs.replace(dbAddLoanOld, dbAddLoanNew);
dbTs = dbTs.replaceAll('l.type === "weekly" ? repaymentSchedule : undefined', 'l.type === "advance_interest" ? repaymentSchedule : undefined');
dbTs = dbTs.replaceAll('loan.type !== "interest_only"', 'loan.type !== "monthly_interest"');
dbTs = dbTs.replaceAll('loan.type === "weekly"', 'loan.type === "advance_interest"');
dbTs = dbTs.replaceAll('loan.type === "interest_only"', 'loan.type === "monthly_interest"');

fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/server/db.ts', dbTs, 'utf8');
console.log("Success");
