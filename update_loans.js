const fs = require('fs');

let loansView = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/LoansView.tsx', 'utf8');

// 1. Change initial state of loanType
loansView = loansView.replace(/useState<LoanType>\("weekly"\);/, 'useState<LoanType>("advance_interest");');

// 2. Change interestRate initial state to absolute 300
loansView = loansView.replace(/useState\("10"\); \/\/ Standard markup % or interest %/, 'useState("300"); // Absolute interest amount');

// 3. Update the useEffect that calculates weeklyReturn and monthlyInterest
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

// 4. Update the submit payload type
loansView = loansView.replace(/loanType === "weekly" \? Number\(durationWeeks\) : undefined/g, 'loanType === "advance_interest" ? Number(durationWeeks) : undefined');
loansView = loansView.replace(/loanType === "weekly" \? Number\(weeklyPayment\) : undefined/g, 'loanType === "advance_interest" ? Number(weeklyPayment) : undefined');
loansView = loansView.replace(/loanType === "interest_only" \? Number\(monthlyInterest\) : undefined/g, 'loanType === "monthly_interest" ? Number(monthlyInterest) : undefined');

// 5. Replace references of "weekly" with "advance_interest" in JSX 
loansView = loansView.replace(/setLoanType\("weekly"\)/g, 'setLoanType("advance_interest")');
loansView = loansView.replace(/loanType === "weekly"/g, 'loanType === "advance_interest"');
loansView = loansView.replace(/setLoanType\("interest_only"\)/g, 'setLoanType("monthly_interest")');
loansView = loansView.replace(/loanType === "interest_only"/g, 'loanType === "monthly_interest"');
loansView = loansView.replace(/Weekly Repayments/g, 'Advance Interest');
loansView = loansView.replace(/Interest-Only Loan/g, 'Monthly Interest');

// 6. Update the Form inputs to match "Loan Value" and "Interest Amount"
loansView = loansView.replace(/Principal Amount \(₹\)/g, 'Loan Value (₹)');
loansView = loansView.replace(/Interest Markup \(%\)/g, 'Interest Amount (₹)');
loansView = loansView.replace(/Monthly Interest Charge \(%\)/g, 'Monthly Interest Amount (₹)');

// 7. Add "Amount Given" display in the form
const amountInputRegex = /<input[^>]*value={amount}[^>]*\/>\\s*<\\/div>\\s*<\\/div>/;
const amountInputMatch = loansView.match(amountInputRegex);
if (amountInputMatch) {
  const replacement = amountInputMatch[0] + `
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
  loansView = loansView.replace(amountInputRegex, replacement);
}

// 8. Replace loan.type === "weekly" and "interest_only" checks
loansView = loansView.replace(/selectedLoan\\.type === "weekly"/g, 'selectedLoan.type === "advance_interest"');
loansView = loansView.replace(/selectedLoan\\.type === "interest_only"/g, 'selectedLoan.type === "monthly_interest"');
loansView = loansView.replace(/printTargetLoan\\.type === "weekly"/g, 'printTargetLoan.type === "advance_interest"');
loansView = loansView.replace(/printTargetLoan\\.type === "interest_only"/g, 'printTargetLoan.type === "monthly_interest"');

fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/LoansView.tsx', loansView, 'utf8');

// Now update server/db.ts to match the new logic
let dbTs = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/server/db.ts', 'utf8');

// update loan calculation logic in db.ts
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
dbTs = dbTs.replace(/l\\.type === "weekly" \\? repaymentSchedule : undefined/g, 'l.type === "advance_interest" ? repaymentSchedule : undefined');
dbTs = dbTs.replace(/loan\\.type !== "interest_only"/g, 'loan.type !== "monthly_interest"');
dbTs = dbTs.replace(/loan\\.type === "weekly"/g, 'loan.type === "advance_interest"');

fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/server/db.ts', dbTs, 'utf8');

console.log("Updated LoansView and db.ts");
