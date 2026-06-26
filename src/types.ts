export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  token?: string;
}

export interface Customer {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type LoanType = "advance_interest" | "monthly_interest";
export type LoanStatus = "active" | "closed" | "overdue";

export interface Installment {
  dueDate: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  paymentId?: string;
}

export interface Loan {
  id: string;
  customerId: string;
  customerName?: string;
  type: LoanType;
  amount: number;
  interestRate: number;
  durationWeeks?: number;
  weeklyPayment?: number;
  monthlyInterest?: number;
  balance: number;
  status: LoanStatus;
  totalProfit: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  repaymentSchedule?: Installment[];
}

export interface LoanPayment {
  id: string;
  loanId: string;
  customerName?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: "cash" | "bank_transfer" | "gpay" | "phonepe" | "other";
  notes: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface Saving {
  id: string;
  date: string;
  amount: number;
  contributorName: string;
  notes: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  loanId: string;
  customerName: string;
  title: string;
  message: string;
  type: "upcoming" | "overdue" | "missed";
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface TrashRecord {
  id: string;
  originalTable: string;
  recordData: any;
  deletedAt: string;
  deletedBy: string;
}

export interface DashboardStats {
  totalCapital: number;
  cashAvailable: number;
  totalMoneyLent: number;
  totalInterestEarned: number;
  totalProfit: number;
  dailySavings: number;
  activeLoansCount: number;
  closedLoansCount: number;
  overdueLoansCount: number;
  todayCollectionsAmount: number;
}
