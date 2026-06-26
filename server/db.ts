import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Define the Data Schemas in TypeScript
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  createdAt: string;
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

export interface ProfitRecord {
  id: string;
  date: string;
  amount: number;
  type: "loan_interest" | "loan_fee" | "other";
  description: string;
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

export interface DeletedRecord {
  id: string;
  originalTable: string;
  recordData: any;
  deletedAt: string;
  deletedBy: string;
}

export interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  savings: Saving[];
  profitRecords: ProfitRecord[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  deletedRecords: DeletedRecord[];
}

export interface IDatabase {
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | null>;
  addUser(user: User): Promise<void>;
  updateUserProfile(email: string, fullName: string): Promise<boolean>;
  changeUserPassword(email: string, oldPass: string, newPass: string): Promise<boolean>;
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  addCustomer(c: Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">, authorEmail: string): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Omit<Customer, "id" | "createdAt">>, authorEmail: string): Promise<Customer | null>;
  getLoans(includeDeleted?: boolean): Promise<Loan[]>;
  addLoan(l: Omit<Loan, "id" | "balance" | "status" | "totalProfit" | "createdAt" | "updatedAt" | "isDeleted" | "repaymentSchedule">, authorEmail: string): Promise<Loan>;
  settleInterestOnlyPrincipal(loanId: string, amountPaid: number, authorEmail: string): Promise<Loan | null>;
  recordPayment(pay: Omit<LoanPayment, "id" | "isDeleted" | "createdAt">, authorEmail: string): Promise<LoanPayment | null>;
  getSavings(): Promise<Saving[]>;
  addSaving(s: Omit<Saving, "id" | "isDeleted" | "createdAt">, authorEmail: string): Promise<Saving>;
  getNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<boolean>;
  dismissAllNotifications(): Promise<void>;
  deleteRecord(tableName: keyof DatabaseSchema, id: string, permanent: boolean, authorEmail: string): Promise<boolean>;
  restoreRecord(trashId: string, authorEmail: string): Promise<boolean>;
  bulkDeleteRecords(tableName: keyof DatabaseSchema, ids: string[], permanent: boolean, authorEmail: string): Promise<number>;
  getTrashBin(): Promise<DeletedRecord[]>;
  audit(userEmail: string, action: string, entityType: string, entityId: string, details: string): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;
  backupDatabase(): Promise<string>;
  restoreDatabaseBackup(jsonData: string, authorEmail: string): Promise<{ success: boolean; error?: string }>;
  getDashboardStats(): Promise<any>;
  runOverdueChecks(): Promise<void>;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// -------------------------------------------------------------------------
// LOCAL FILE-BASED DATABASE MANAGER
// -------------------------------------------------------------------------
export class LocalDatabaseManager implements IDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      customers: [],
      loans: [],
      loanPayments: [],
      savings: [],
      profitRecords: [],
      notifications: [],
      auditLogs: [],
      deletedRecords: []
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        this.runOverdueChecksSync();
      } catch (err) {
        console.error("Failed to read database file, initializing with seed data", err);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Critical: Failed to save database file", err);
    }
  }

  private seed() {
    console.log("Seeding database with professional financial data...");
    
    const adminUser: User = {
      id: "u1",
      email: "work.santhosh.fsd@gmail.com",
      passwordHash: "admin123",
      fullName: "Santhosh Kumar",
      role: "owner",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    this.data.users.push(adminUser);

    const customersList: Customer[] = [
      {
        id: "c1",
        name: "Arun Swaminathan",
        phone: "+91 98765 43210",
        address: "12, Gandhi Street, T. Nagar, Chennai - 600017",
        notes: "Reliable contractor, weekly earner",
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        isDeleted: false
      },
      {
        id: "c2",
        name: "Priya Chandran",
        phone: "+91 87654 32109",
        address: "Block-B, Royal Apartments, Adyar, Chennai - 600020",
        notes: "Salon owner, needs monthly/interest loans for expansion",
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        isDeleted: false
      },
      {
        id: "c3",
        name: "Vikram Malhotra",
        phone: "+91 76543 21098",
        address: "7-A, Greenways Lane, Mylapore, Chennai - 600004",
        notes: "Supermarket logistics manager, punctual but currently in overdue",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        isDeleted: false
      }
    ];
    this.data.customers = customersList;

    const now = new Date();
    
    // Arun's weekly loan
    const l1_start = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const l1_schedule: Installment[] = [];
    for (let i = 1; i <= 12; i++) {
      const dueDate = new Date(l1_start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      l1_schedule.push({
        dueDate: dueDate.toISOString(),
        amount: 500,
        paid: i <= 3,
        paidDate: i <= 3 ? new Date(dueDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        paymentId: i <= 3 ? `pay_w_${i}` : undefined
      });
    }

    const loan1: Loan = {
      id: "l1",
      customerId: "c1",
      customerName: "Arun Swaminathan",
      type: "weekly",
      amount: 5000,
      interestRate: 20,
      durationWeeks: 12,
      weeklyPayment: 500,
      balance: 4500,
      status: "active",
      totalProfit: 500,
      createdAt: l1_start.toISOString(),
      updatedAt: now.toISOString(),
      isDeleted: false,
      repaymentSchedule: l1_schedule
    };

    // Priya's interest-only
    const l2_start = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const loan2: Loan = {
      id: "l2",
      customerId: "c2",
      customerName: "Priya Chandran",
      type: "interest_only",
      amount: 15000,
      interestRate: 2,
      monthlyInterest: 300,
      balance: 15000,
      status: "active",
      totalProfit: 300,
      createdAt: l2_start.toISOString(),
      updatedAt: now.toISOString(),
      isDeleted: false
    };

    // Vikram's overdue loan
    const l3_start = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);
    const l3_schedule: Installment[] = [];
    for (let i = 1; i <= 10; i++) {
      const dueDate = new Date(l3_start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const isPaid = i <= 4;
      l3_schedule.push({
        dueDate: dueDate.toISOString(),
        amount: 300,
        paid: isPaid,
        paidDate: isPaid ? new Date(dueDate.getTime()).toISOString() : undefined,
        paymentId: isPaid ? `pay_overdue_${i}` : undefined
      });
    }

    const loan3: Loan = {
      id: "l3",
      customerId: "c3",
      customerName: "Vikram Malhotra",
      type: "weekly",
      amount: 2500,
      interestRate: 20,
      durationWeeks: 10,
      weeklyPayment: 300,
      balance: 1800,
      status: "overdue",
      totalProfit: 200,
      createdAt: l3_start.toISOString(),
      updatedAt: now.toISOString(),
      isDeleted: false,
      repaymentSchedule: l3_schedule
    };

    this.data.loans = [loan1, loan2, loan3];

    const paymentsList: LoanPayment[] = [
      {
        id: "pay_w_1",
        loanId: "l1",
        customerName: "Arun Swaminathan",
        paymentDate: new Date(l1_start.getTime() + 7 * 24 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 500,
        paymentMethod: "gpay",
        notes: "Installment #1",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_w_2",
        loanId: "l1",
        customerName: "Arun Swaminathan",
        paymentDate: new Date(l1_start.getTime() + 14 * 24 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 500,
        paymentMethod: "cash",
        notes: "Installment #2",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_w_3",
        loanId: "l1",
        customerName: "Arun Swaminathan",
        paymentDate: new Date(l1_start.getTime() + 21 * 24 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 500,
        paymentMethod: "gpay",
        notes: "Installment #3",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_i_1",
        loanId: "l2",
        customerName: "Priya Chandran",
        paymentDate: new Date(l2_start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 300,
        paymentMethod: "bank_transfer",
        notes: "Interest Payment Month 1",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_overdue_1",
        loanId: "l3",
        customerName: "Vikram Malhotra",
        paymentDate: new Date(l3_start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 300,
        paymentMethod: "phonepe",
        notes: "Installment #1",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_overdue_2",
        loanId: "l3",
        customerName: "Vikram Malhotra",
        paymentDate: new Date(l3_start.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 300,
        paymentMethod: "phonepe",
        notes: "Installment #2",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_overdue_3",
        loanId: "l3",
        customerName: "Vikram Malhotra",
        paymentDate: new Date(l3_start.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 300,
        paymentMethod: "cash",
        notes: "Installment #3",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "pay_overdue_4",
        loanId: "l3",
        customerName: "Vikram Malhotra",
        paymentDate: new Date(l3_start.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 300,
        paymentMethod: "cash",
        notes: "Installment #4",
        isDeleted: false,
        createdAt: new Date().toISOString()
      }
    ];
    this.data.loanPayments = paymentsList;

    const savingsList: Saving[] = [
      {
        id: "s1",
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: 500,
        contributorName: "Santhosh Kumar",
        notes: "Daily collection accumulation deposit",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "s2",
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: 1000,
        contributorName: "Santhosh Kumar",
        notes: "Business savings portion",
        isDeleted: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "s3",
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: 400,
        contributorName: "Santhosh Kumar",
        notes: "Daily deposit from collections",
        isDeleted: false,
        createdAt: new Date().toISOString()
      }
    ];
    this.data.savings = savingsList;

    const profitsList: ProfitRecord[] = [
      {
        id: "pr1",
        date: new Date(l1_start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 83.33,
        type: "loan_interest",
        description: "Arun Swaminathan - Installment #1 Interest earned",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr2",
        date: new Date(l1_start.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 83.33,
        type: "loan_interest",
        description: "Arun Swaminathan - Installment #2 Interest earned",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr3",
        date: new Date(l1_start.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 83.34,
        type: "loan_interest",
        description: "Arun Swaminathan - Installment #3 Interest earned",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr4",
        date: new Date(l2_start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 300.00,
        type: "loan_interest",
        description: "Priya Chandran - Month 1 interest payment",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr5",
        date: new Date(l3_start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 50.00,
        type: "loan_interest",
        description: "Vikram Malhotra - Installment #1 Interest earned",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr6",
        date: new Date(l3_start.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 50.00,
        type: "loan_interest",
        description: "Vikram Malhotra - Installment #2 Interest earned",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr7",
        date: new Date(l3_start.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 50.00,
        type: "loan_interest",
        description: "Vikram Malhotra - Installment #3 Interest earned",
        createdAt: new Date().toISOString()
      },
      {
        id: "pr8",
        date: new Date(l3_start.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 50.00,
        type: "loan_interest",
        description: "Vikram Malhotra - Installment #4 Interest earned",
        createdAt: new Date().toISOString()
      }
    ];
    this.data.profitRecords = profitsList;

    this.data.auditLogs = [
      {
        id: "aud1",
        userEmail: "work.santhosh.fsd@gmail.com",
        action: "CREATE_CUSTOMER",
        entityType: "customers",
        entityId: "c1",
        details: "Created customer Arun Swaminathan",
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "aud2",
        userEmail: "work.santhosh.fsd@gmail.com",
        action: "CREATE_LOAN",
        entityType: "loans",
        entityId: "l1",
        details: "Disbursed Weekly Loan of ₹5000 to Arun Swaminathan",
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const notificationsList: AppNotification[] = [
      {
        id: "n1",
        loanId: "l3",
        customerName: "Vikram Malhotra",
        title: "Loan Overdue Alert",
        message: "Vikram Malhotra has missed 3 consecutive weekly installments on loan #l3.",
        type: "overdue",
        read: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "n2",
        loanId: "l1",
        customerName: "Arun Swaminathan",
        title: "Upcoming Installment Due",
        message: "Arun Swaminathan has install #4 of ₹500 due in 2 days.",
        type: "upcoming",
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
    this.data.notifications = notificationsList;

    this.save();
  }

  private runOverdueChecksSync() {
    const now = new Date();
    let hasChanges = false;

    this.data.loans.forEach(loan => {
      if (loan.isDeleted || loan.status === "closed") return;

      if (loan.type === "advance_interest" && loan.repaymentSchedule) {
        let isOverdue = false;

        loan.repaymentSchedule.forEach(inst => {
          const due = new Date(inst.dueDate);
          if (due.getTime() < now.getTime() && !inst.paid) {
            const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 3) {
              isOverdue = true;
            }
          }
        });

        const newStatus = isOverdue ? "overdue" : "active";
        if (loan.status !== newStatus) {
          loan.status = newStatus;
          hasChanges = true;

          if (isOverdue) {
            const exists = this.data.notifications.some(n => n.loanId === loan.id && n.type === "overdue" && !n.read);
            if (!exists) {
              this.data.notifications.push({
                id: `n_check_${Date.now()}_${loan.id}`,
                loanId: loan.id,
                customerName: loan.customerName || "Customer",
                title: "Overdue Loan Detected",
                message: `${loan.customerName} is marked Overdue. Paid installments are lagging.`,
                type: "overdue",
                read: false,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }
    });

    if (hasChanges) {
      this.save();
    }
  }

  public async runOverdueChecks() {
    this.runOverdueChecksSync();
  }

  public async getUsers() { return this.data.users; }
  
  public async getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public async addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  public async updateUserProfile(email: string, fullName: string) {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.fullName = fullName;
      this.save();
      return true;
    }
    return false;
  }

  public async changeUserPassword(email: string, oldPass: string, newPass: string) {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.passwordHash === oldPass) {
      user.passwordHash = newPass;
      this.save();
      return true;
    }
    return false;
  }

  public async getCustomers() {
    return this.data.customers.filter(c => !c.isDeleted);
  }

  public async getCustomerById(id: string) {
    return this.data.customers.find(c => c.id === id) || null;
  }

  public async addCustomer(c: Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">, authorEmail: string) {
    const id = `cust_${Date.now()}`;
    const newCust: Customer = {
      ...c,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };
    this.data.customers.push(newCust);
    this.auditSync(authorEmail, "CREATE_CUSTOMER", "customers", id, `Created customer: ${newCust.name}`);
    this.save();
    return newCust;
  }

  public async updateCustomer(id: string, updates: Partial<Omit<Customer, "id" | "createdAt">>, authorEmail: string) {
    const cust = this.data.customers.find(c => c.id === id);
    if (cust) {
      Object.assign(cust, updates);
      cust.updatedAt = new Date().toISOString();
      this.auditSync(authorEmail, "UPDATE_CUSTOMER", "customers", id, `Updated customer details for: ${cust.name}`);
      this.save();
      return cust;
    }
    return null;
  }

  public async getLoans(includeDeleted = false) {
    return this.data.loans
      .filter(l => includeDeleted || !l.isDeleted)
      .map(l => {
        const cust = this.data.customers.find(c => c.id === l.customerId);
        return {
          ...l,
          customerName: cust ? cust.name : "Unknown Customer"
        };
      });
  }

  public async addLoan(l: Omit<Loan, "id" | "balance" | "status" | "totalProfit" | "createdAt" | "updatedAt" | "isDeleted" | "repaymentSchedule">, authorEmail: string) {
    const id = `loan_${Date.now()}`;
    const customer = this.data.customers.find(c => c.id === l.customerId);
    const customerName = customer ? customer.name : "Unknown";

    let balance = l.amount;
    let repaymentSchedule: Installment[] = [];

    if (l.type === "advance_interest") {
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
    }

    const newLoan: Loan = {
      ...l,
      id,
      customerName,
      balance,
      status: "active",
      totalProfit: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      repaymentSchedule: l.type === "advance_interest" ? repaymentSchedule : undefined
    };

    this.data.loans.push(newLoan);
    this.auditSync(authorEmail, "CREATE_LOAN", "loans", id, `Issued ${newLoan.type} loan of ₹${newLoan.amount} to ${customerName}`);
    
    this.data.notifications.push({
      id: `not_disb_${Date.now()}`,
      loanId: id,
      customerName,
      title: "New Loan Disbursed",
      message: `A new ${newLoan.type} loan of ₹${newLoan.amount} was opened for ${customerName}.`,
      type: "upcoming",
      read: false,
      createdAt: new Date().toISOString()
    });

    this.save();
    return newLoan;
  }

  public async settleInterestOnlyPrincipal(loanId: string, amountPaid: number, authorEmail: string) {
    const loan = this.data.loans.find(l => l.id === loanId);
    if (!loan || loan.type !== "monthly_interest" || loan.status === "closed") return null;

    loan.balance = Math.max(0, loan.balance - amountPaid);
    if (loan.balance === 0) {
      loan.status = "closed";
    }

    const payId = `pay_principal_${Date.now()}`;
    const paymentRecord: LoanPayment = {
      id: payId,
      loanId,
      customerName: loan.customerName,
      paymentDate: new Date().toISOString(),
      amount: amountPaid,
      paymentMethod: "bank_transfer",
      notes: "Principal Part/Settle Outstanding Payment",
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    this.data.loanPayments.push(paymentRecord);

    this.auditSync(authorEmail, "SETTLE_PRINCIPAL", "loans", loanId, `Principal settle payment of ₹${amountPaid} on loan #${loanId}`);
    this.save();
    return loan;
  }

  public async recordPayment(pay: Omit<LoanPayment, "id" | "isDeleted" | "createdAt">, authorEmail: string) {
    const id = `pay_${Date.now()}`;
    const loan = this.data.loans.find(l => l.id === pay.loanId);
    if (!loan) return null;

    const customer = this.data.customers.find(c => c.id === loan.customerId);
    const customerName = customer ? customer.name : "Unknown";

    const newPayment: LoanPayment = {
      ...pay,
      id,
      customerName,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    this.data.loanPayments.push(newPayment);

    if (loan.type === "advance_interest" && loan.repaymentSchedule) {
      let remainingToApply = pay.amount;
      for (const inst of loan.repaymentSchedule) {
        if (!inst.paid && remainingToApply >= inst.amount) {
          inst.paid = true;
          inst.paidDate = pay.paymentDate;
          inst.paymentId = id;
          remainingToApply -= inst.amount;
        }
      }

      loan.balance = Math.max(0, loan.balance - pay.amount);

      const totalRepayable = (loan.weeklyPayment || 0) * (loan.durationWeeks || 0);
      const profitRatio = totalRepayable > 0 ? (totalRepayable - loan.amount) / totalRepayable : 0;
      const interestAmount = pay.amount * profitRatio;

      loan.totalProfit += interestAmount;

      if (interestAmount > 0) {
        this.data.profitRecords.push({
          id: `pr_${Date.now()}_${id}`,
          date: pay.paymentDate,
          amount: Number(interestAmount.toFixed(2)),
          type: "loan_interest",
          description: `${customerName} - Weekly Repay installment profit ratio share`,
          createdAt: new Date().toISOString()
        });
      }

      if (loan.balance <= 0) {
        loan.status = "closed";
      }
    } else {
      loan.totalProfit += pay.amount;
      this.data.profitRecords.push({
        id: `pr_${Date.now()}_${id}`,
        date: pay.paymentDate,
        amount: pay.amount,
        type: "loan_interest",
        description: `${customerName} - Interest Payment (Interest-Only Loan)`,
        createdAt: new Date().toISOString()
      });
    }

    loan.updatedAt = new Date().toISOString();
    this.auditSync(authorEmail, "RECORD_PAYMENT", "loanPayments", id, `Recorded payment of ₹${pay.amount} from ${customerName}`);
    this.runOverdueChecksSync();
    this.save();

    return newPayment;
  }

  public async getSavings() {
    return this.data.savings.filter(s => !s.isDeleted);
  }

  public async addSaving(s: Omit<Saving, "id" | "isDeleted" | "createdAt">, authorEmail: string) {
    const id = `sav_${Date.now()}`;
    const newSaving: Saving = {
      ...s,
      id,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    this.data.savings.push(newSaving);
    this.auditSync(authorEmail, "CREATE_SAVING", "savings", id, `Added daily savings of ₹${s.amount} under ${s.contributorName}`);
    this.save();
    return newSaving;
  }

  public async getNotifications() {
    return this.data.notifications;
  }

  public async markNotificationRead(id: string) {
    const n = this.data.notifications.find(not => not.id === id);
    if (n) {
      n.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public async dismissAllNotifications() {
    this.data.notifications.forEach(n => n.read = true);
    this.save();
  }

  public async deleteRecord(tableName: keyof DatabaseSchema, id: string, permanent: boolean, authorEmail: string) {
    const array = this.data[tableName] as any[];
    if (!array) return false;

    const index = array.findIndex(item => item.id === id);
    if (index === -1) return false;

    const originalRecord = array[index];

    if (permanent) {
      array.splice(index, 1);
      this.auditSync(authorEmail, `PERMANENT_DELETE`, tableName, id, `Permanently deleted record from ${tableName}`);
    } else {
      originalRecord.isDeleted = true;
      if (originalRecord.updatedAt) {
        originalRecord.updatedAt = new Date().toISOString();
      }

      this.data.deletedRecords.push({
        id: `del_${Date.now()}_${id}`,
        originalTable: tableName,
        recordData: JSON.parse(JSON.stringify(originalRecord)),
        deletedAt: new Date().toISOString(),
        deletedBy: authorEmail
      });

      this.auditSync(authorEmail, `SOFT_DELETE`, tableName, id, `Moved record ${id} to Trash Bin`);
    }

    this.save();
    return true;
  }

  public async restoreRecord(trashId: string, authorEmail: string) {
    const trashIndex = this.data.deletedRecords.findIndex(t => t.id === trashId);
    if (trashIndex === -1) return false;

    const trashItem = this.data.deletedRecords[trashIndex];
    const { originalTable, recordData } = trashItem;

    const targetArray = this.data[originalTable as keyof DatabaseSchema] as any[];
    if (!targetArray) return false;

    const existingIndex = targetArray.findIndex(item => item.id === recordData.id);
    if (existingIndex !== -1) {
      targetArray[existingIndex].isDeleted = false;
      if (targetArray[existingIndex].updatedAt) {
        targetArray[existingIndex].updatedAt = new Date().toISOString();
      }
    } else {
      recordData.isDeleted = false;
      targetArray.push(recordData);
    }

    this.data.deletedRecords.splice(trashIndex, 1);
    this.auditSync(authorEmail, "RESTORE_RECORD", originalTable, recordData.id, `Restored deleted record from Trash Bin`);
    this.save();
    return true;
  }

  public async bulkDeleteRecords(tableName: keyof DatabaseSchema, ids: string[], permanent: boolean, authorEmail: string) {
    let successCount = 0;
    for (const id of ids) {
      const ok = await this.deleteRecord(tableName, id, permanent, authorEmail);
      if (ok) successCount++;
    }
    return successCount;
  }

  public async getTrashBin() {
    return this.data.deletedRecords;
  }

  private auditSync(userEmail: string, action: string, entityType: string, entityId: string, details: string) {
    this.data.auditLogs.unshift({
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userEmail,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString()
    });
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
  }

  public async audit(userEmail: string, action: string, entityType: string, entityId: string, details: string) {
    this.auditSync(userEmail, action, entityType, entityId, details);
    this.save();
  }

  public async getAuditLogs() {
    return this.data.auditLogs;
  }

  public async backupDatabase() {
    return JSON.stringify(this.data, null, 2);
  }

  public async restoreDatabaseBackup(jsonData: string, authorEmail: string) {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.users || !parsed.customers || !parsed.loans) {
        return { success: false, error: "Invalid backup format. Missing core tables." };
      }
      this.data = parsed;
      this.auditSync(authorEmail, "RESTORE_FULL_BACKUP", "database", "all", "Restored full database backup successfully");
      this.save();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to parse json backup" };
    }
  }

  public async getDashboardStats() {
    const activeLoans = this.data.loans.filter(l => !l.isDeleted && l.status !== "closed");
    const allActivePayments = this.data.loanPayments.filter(p => !p.isDeleted);
    const activeSavings = this.data.savings.filter(s => !s.isDeleted);

    const totalCapitalValue = 100000;
    const totalMoneyLent = activeLoans.reduce((acc, l) => acc + l.amount, 0);
    const totalPrincipalRemaining = activeLoans.reduce((acc, l) => acc + l.balance, 0);
    
    const profitListAll = this.data.profitRecords;
    const totalCumulativeProfit = profitListAll.reduce((acc, pr) => acc + pr.amount, 0);

    const thisMonthText = new Date().toISOString().substring(0, 7);
    const currentMonthProfit = profitListAll
      .filter(pr => pr.date.startsWith(thisMonthText))
      .reduce((acc, pr) => acc + pr.amount, 0);

    const totalSavings = activeSavings.reduce((acc, s) => acc + s.amount, 0);
    const overdueCount = activeLoans.filter(l => l.status === "overdue").length;

    const todayStr = new Date().toISOString().split("T")[0];
    const todayCollections = allActivePayments
      .filter(p => p.paymentDate.startsWith(todayStr))
      .reduce((acc, p) => acc + p.amount, 0);

    const months = [];
    const profitByMonth: { [key: string]: number } = {};
    const collectionsByMonth: { [key: string]: number } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const mKey = d.toISOString().substring(0, 7);
      months.push({ label: mLabel, key: mKey });
      profitByMonth[mKey] = 0;
      collectionsByMonth[mKey] = 0;
    }

    profitListAll.forEach(pr => {
      const mKey = pr.date.substring(0, 7);
      if (profitByMonth[mKey] !== undefined) {
        profitByMonth[mKey] += pr.amount;
      }
    });

    allActivePayments.forEach(pay => {
      const mKey = pay.paymentDate.substring(0, 7);
      if (collectionsByMonth[mKey] !== undefined) {
        collectionsByMonth[mKey] += pay.amount;
      }
    });

    const monthlyTrends = months.map(m => ({
      name: m.label,
      profit: Number(profitByMonth[m.key].toFixed(2)),
      collections: Number(collectionsByMonth[m.key].toFixed(2))
    }));

    let totalDuesInWeekly = 0;
    let totalPaidInWeekly = 0;
    
    this.data.loans.filter(l => !l.isDeleted && l.type === "weekly" && l.repaymentSchedule).forEach(l => {
      l.repaymentSchedule?.forEach(inst => {
        totalDuesInWeekly++;
        if (inst.paid) {
          totalPaidInWeekly++;
        }
      });
    });

    const recoveryRate = totalDuesInWeekly > 0 ? Math.round((totalPaidInWeekly / totalDuesInWeekly) * 100) : 100;

    return {
      totalCapital: totalCapitalValue,
      totalMoneyLent,
      activeLoansCount: activeLoans.length,
      currentMonthProfit,
      totalCumulativeProfit,
      totalSavings,
      overdueLoansCount: overdueCount,
      todayCollectionsAmount: todayCollections,
      monthlyTrends,
      recoveryRate
    };
  }
}

// -------------------------------------------------------------------------
// SUPABASE DATABASE MANAGER
// -------------------------------------------------------------------------
export class SupabaseDatabaseManager implements IDatabase {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing! Falling back to Local Database Manager.");
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  public async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabase.from("users").select("*");
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      email: r.email,
      passwordHash: r.password_hash,
      fullName: r.full_name,
      role: r.role,
      createdAt: r.created_at
    }));
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase.from("users").select("*").eq("email", email.toLowerCase()).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      fullName: data.full_name,
      role: data.role,
      createdAt: data.created_at
    };
  }

  public async addUser(user: User): Promise<void> {
    const { error } = await this.supabase.from("users").insert({
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      full_name: user.fullName,
      role: user.role,
      created_at: user.createdAt
    });
    if (error) throw error;
  }

  public async updateUserProfile(email: string, fullName: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("users")
      .update({ full_name: fullName })
      .eq("email", email.toLowerCase())
      .select();
    if (error) throw error;
    return !!(data && data.length > 0);
  }

  public async changeUserPassword(email: string, oldPass: string, newPass: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user || user.passwordHash !== oldPass) return false;
    const { error } = await this.supabase.from("users")
      .update({ password_hash: newPass })
      .eq("email", email.toLowerCase());
    if (error) throw error;
    return true;
  }

  public async getCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase.from("customers").select("*").eq("is_deleted", false);
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      address: r.address,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isDeleted: r.is_deleted
    }));
  }

  public async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted
    };
  }

  public async addCustomer(c: Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">, authorEmail: string): Promise<Customer> {
    const id = `cust_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const { data, error } = await this.supabase.from("customers").insert({
      id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      created_at: createdAt,
      updated_at: createdAt,
      is_deleted: false
    }).select().single();
    if (error) throw error;

    await this.audit(authorEmail, "CREATE_CUSTOMER", "customers", id, `Created customer: ${c.name}`);
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted
    };
  }

  public async updateCustomer(id: string, updates: Partial<Omit<Customer, "id" | "createdAt">>, authorEmail: string): Promise<Customer | null> {
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
    if (updates.address !== undefined) mappedUpdates.address = updates.address;
    if (updates.notes !== undefined) mappedUpdates.notes = updates.notes;
    mappedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase.from("customers")
      .update(mappedUpdates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    await this.audit(authorEmail, "UPDATE_CUSTOMER", "customers", id, `Updated customer details for: ${data.name}`);
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted
    };
  }

  public async getLoans(includeDeleted = false): Promise<Loan[]> {
    const { data: loans, error } = await this.supabase.from("loans")
      .select("*, customers(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    let filtered = loans || [];
    if (!includeDeleted) {
      filtered = filtered.filter((l: any) => !l.is_deleted);
    }

    return filtered.map((l: any) => ({
      id: l.id,
      customerId: l.customer_id,
      customerName: l.customers ? l.customers.name : "Unknown Customer",
      type: l.type,
      amount: Number(l.amount),
      interestRate: Number(l.interest_rate),
      durationWeeks: l.duration_weeks,
      weeklyPayment: l.weekly_payment ? Number(l.weekly_payment) : undefined,
      monthlyInterest: l.monthly_interest ? Number(l.monthly_interest) : undefined,
      balance: Number(l.balance),
      status: l.status,
      totalProfit: Number(l.total_profit),
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      isDeleted: l.is_deleted,
      repaymentSchedule: l.repayment_schedule
    }));
  }

  public async addLoan(l: Omit<Loan, "id" | "balance" | "status" | "totalProfit" | "createdAt" | "updatedAt" | "isDeleted" | "repaymentSchedule">, authorEmail: string): Promise<Loan> {
    const id = `loan_${Date.now()}`;
    const customer = await this.getCustomerById(l.customerId);
    const customerName = customer ? customer.name : "Unknown";

    let balance = l.amount;
    let repaymentSchedule: Installment[] = [];

    if (l.type === "weekly") {
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
    }

    const { data, error } = await this.supabase.from("loans").insert({
      id,
      customer_id: l.customerId,
      type: l.type,
      amount: l.amount,
      interest_rate: l.interestRate,
      duration_weeks: l.durationWeeks,
      weekly_payment: l.weeklyPayment,
      monthly_interest: l.monthlyInterest,
      balance,
      status: "active",
      total_profit: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      repayment_schedule: l.type === "weekly" ? repaymentSchedule : null
    }).select().single();

    if (error) throw error;

    await this.audit(authorEmail, "CREATE_LOAN", "loans", id, `Issued ${l.type} loan of ₹${l.amount} to ${customerName}`);

    await this.supabase.from("notifications").insert({
      id: `not_disb_${Date.now()}`,
      loan_id: id,
      customer_name: customerName,
      title: "New Loan Disbursed",
      message: `A new ${l.type} loan of ₹${l.amount} was opened for ${customerName}.`,
      type: "upcoming",
      read: false,
      created_at: new Date().toISOString()
    });

    return {
      id: data.id,
      customerId: data.customer_id,
      customerName,
      type: data.type,
      amount: Number(data.amount),
      interestRate: Number(data.interest_rate),
      durationWeeks: data.duration_weeks,
      weeklyPayment: data.weekly_payment ? Number(data.weekly_payment) : undefined,
      monthlyInterest: data.monthly_interest ? Number(data.monthly_interest) : undefined,
      balance: Number(data.balance),
      status: data.status,
      totalProfit: Number(data.total_profit),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted,
      repaymentSchedule: data.repayment_schedule
    };
  }

  public async settleInterestOnlyPrincipal(loanId: string, amountPaid: number, authorEmail: string): Promise<Loan | null> {
    const { data: loan, error: errFetch } = await this.supabase.from("loans")
      .select("*, customers(name)")
      .eq("id", loanId)
      .maybeSingle();
    if (errFetch || !loan || loan.type !== "monthly_interest" || loan.status === "closed") return null;

    const newBalance = Math.max(0, Number(loan.balance) - amountPaid);
    const newStatus = newBalance === 0 ? "closed" : loan.status;

    const { data: updatedLoan, error: errUpdate } = await this.supabase.from("loans").update({
      balance: newBalance,
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq("id", loanId).select().single();
    if (errUpdate) throw errUpdate;

    const payId = `pay_principal_${Date.now()}`;
    const customerName = loan.customers ? loan.customers.name : "Unknown";
    await this.supabase.from("loan_payments").insert({
      id: payId,
      loan_id: loanId,
      customer_name: customerName,
      payment_date: new Date().toISOString(),
      amount: amountPaid,
      payment_method: "bank_transfer",
      notes: "Principal Part/Settle Outstanding Payment",
      is_deleted: false,
      created_at: new Date().toISOString()
    });

    await this.audit(authorEmail, "SETTLE_PRINCIPAL", "loans", loanId, `Principal settle payment of ₹${amountPaid} on loan #${loanId}`);

    return {
      id: updatedLoan.id,
      customerId: updatedLoan.customer_id,
      customerName,
      type: updatedLoan.type,
      amount: Number(updatedLoan.amount),
      interestRate: Number(updatedLoan.interest_rate),
      durationWeeks: updatedLoan.duration_weeks,
      weeklyPayment: updatedLoan.weekly_payment ? Number(updatedLoan.weekly_payment) : undefined,
      monthlyInterest: updatedLoan.monthly_interest ? Number(updatedLoan.monthly_interest) : undefined,
      balance: Number(updatedLoan.balance),
      status: updatedLoan.status,
      totalProfit: Number(updatedLoan.total_profit),
      createdAt: updatedLoan.created_at,
      updatedAt: updatedLoan.updated_at,
      isDeleted: updatedLoan.is_deleted,
      repaymentSchedule: updatedLoan.repayment_schedule
    };
  }

  public async recordPayment(pay: Omit<LoanPayment, "id" | "isDeleted" | "createdAt">, authorEmail: string): Promise<LoanPayment | null> {
    const { data: loan, error: errFetch } = await this.supabase.from("loans")
      .select("*, customers(name)")
      .eq("id", pay.loanId)
      .maybeSingle();
    if (errFetch || !loan) return null;
    const customerName = loan.customers ? loan.customers.name : "Unknown";

    const id = `pay_${Date.now()}`;
    const newPayment: LoanPayment = {
      id,
      loanId: pay.loanId,
      customerName,
      paymentDate: pay.paymentDate,
      amount: pay.amount,
      paymentMethod: pay.paymentMethod,
      notes: pay.notes || "",
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    let newBalance = Number(loan.balance);
    let newTotalProfit = Number(loan.total_profit);
    let repaymentSchedule = loan.repayment_schedule;

    if (loan.type === "advance_interest" && repaymentSchedule) {
      let remainingToApply = pay.amount;
      for (const inst of repaymentSchedule) {
        if (!inst.paid && remainingToApply >= inst.amount) {
          inst.paid = true;
          inst.paidDate = pay.paymentDate;
          inst.paymentId = id;
          remainingToApply -= inst.amount;
        }
      }

      newBalance = Math.max(0, newBalance - pay.amount);

      const totalRepayable = (loan.weekly_payment || 0) * (loan.duration_weeks || 0);
      const profitRatio = totalRepayable > 0 ? (totalRepayable - loan.amount) / totalRepayable : 0;
      const interestAmount = pay.amount * profitRatio;

      newTotalProfit += interestAmount;

      if (interestAmount > 0) {
        await this.supabase.from("profit_records").insert({
          id: `pr_${Date.now()}_${id}`,
          date: pay.paymentDate,
          amount: Number(interestAmount.toFixed(2)),
          type: "loan_interest",
          description: `${customerName} - Weekly Repay installment profit ratio share`,
          created_at: new Date().toISOString()
        });
      }
    } else {
      newTotalProfit += pay.amount;
      await this.supabase.from("profit_records").insert({
        id: `pr_${Date.now()}_${id}`,
        date: pay.paymentDate,
        amount: pay.amount,
        type: "loan_interest",
        description: `${customerName} - Interest Payment (Interest-Only Loan)`,
        created_at: new Date().toISOString()
      });
    }

    const newStatus = (loan.type === "advance_interest" && newBalance <= 0) ? "closed" : loan.status;

    await this.supabase.from("loans").update({
      balance: newBalance,
      total_profit: newTotalProfit,
      repayment_schedule: repaymentSchedule,
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq("id", pay.loanId);

    await this.supabase.from("loan_payments").insert({
      id,
      loan_id: pay.loanId,
      customer_name: customerName,
      payment_date: pay.paymentDate,
      amount: pay.amount,
      payment_method: pay.paymentMethod,
      notes: pay.notes || "",
      is_deleted: false,
      created_at: new Date().toISOString()
    });

    await this.audit(authorEmail, "RECORD_PAYMENT", "loanPayments", id, `Recorded payment of ₹${pay.amount} from ${customerName}`);

    // Asynchronously verify overdues after updates
    setTimeout(() => this.runOverdueChecks(), 100);

    return newPayment;
  }

  public async getSavings(): Promise<Saving[]> {
    const { data, error } = await this.supabase.from("savings").select("*").eq("is_deleted", false);
    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      amount: Number(s.amount),
      contributorName: s.contributor_name,
      notes: s.notes,
      isDeleted: s.is_deleted,
      createdAt: s.created_at
    }));
  }

  public async addSaving(s: Omit<Saving, "id" | "isDeleted" | "createdAt">, authorEmail: string): Promise<Saving> {
    const id = `sav_${Date.now()}`;
    const { data, error } = await this.supabase.from("savings").insert({
      id,
      date: s.date,
      amount: s.amount,
      contributor_name: s.contributorName,
      notes: s.notes,
      is_deleted: false,
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;

    await this.audit(authorEmail, "CREATE_SAVING", "savings", id, `Added daily savings of ₹${s.amount} under ${s.contributorName}`);

    return {
      id: data.id,
      date: data.date,
      amount: Number(data.amount),
      contributorName: data.contributor_name,
      notes: data.notes,
      isDeleted: data.is_deleted,
      createdAt: data.created_at
    };
  }

  public async getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await this.supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((n: any) => ({
      id: n.id,
      loanId: n.loan_id,
      customerName: n.customer_name,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.created_at
    }));
  }

  public async markNotificationRead(id: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("notifications").update({ read: true }).eq("id", id).select();
    if (error) throw error;
    return !!(data && data.length > 0);
  }

  public async dismissAllNotifications(): Promise<void> {
    const { error } = await this.supabase.from("notifications").update({ read: true }).eq("read", false);
    if (error) throw error;
  }

  public async deleteRecord(tableName: keyof DatabaseSchema, id: string, permanent: boolean, authorEmail: string): Promise<boolean> {
    const tableMapping: { [key: string]: string } = {
      customers: "customers",
      loans: "loans",
      loanPayments: "loan_payments",
      savings: "savings"
    };
    const dbTable = tableMapping[tableName];
    if (!dbTable) return false;

    if (permanent) {
      const { error } = await this.supabase.from(dbTable).delete().eq("id", id);
      if (error) return false;
      await this.audit(authorEmail, `PERMANENT_DELETE`, tableName, id, `Permanently deleted record from ${tableName}`);
    } else {
      const { data: record, error: errFetch } = await this.supabase.from(dbTable).select("*").eq("id", id).maybeSingle();
      if (errFetch || !record) return false;

      const { error: errUpdate } = await this.supabase.from(dbTable).update({ is_deleted: true }).eq("id", id);
      if (errUpdate) return false;

      await this.supabase.from("deleted_records").insert({
        id: `del_${Date.now()}_${id}`,
        original_table: tableName,
        record_data: record,
        deleted_at: new Date().toISOString(),
        deleted_by: authorEmail
      });

      await this.audit(authorEmail, `SOFT_DELETE`, tableName, id, `Moved record ${id} to Trash Bin`);
    }
    return true;
  }

  public async restoreRecord(trashId: string, authorEmail: string): Promise<boolean> {
    const { data: trashItem, error: errFetch } = await this.supabase.from("deleted_records")
      .select("*")
      .eq("id", trashId)
      .maybeSingle();
    if (errFetch || !trashItem) return false;

    const originalTable = trashItem.original_table;
    const recordData = trashItem.record_data;
    
    const tableMapping: { [key: string]: string } = {
      customers: "customers",
      loans: "loans",
      loanPayments: "loan_payments",
      savings: "savings"
    };
    const dbTable = tableMapping[originalTable];
    if (!dbTable) return false;

    const { data: existing } = await this.supabase.from(dbTable).select("id").eq("id", recordData.id).maybeSingle();
    if (existing) {
      await this.supabase.from(dbTable).update({ is_deleted: false }).eq("id", recordData.id);
    } else {
      recordData.is_deleted = false;
      await this.supabase.from(dbTable).insert(recordData);
    }

    await this.supabase.from("deleted_records").delete().eq("id", trashId);
    await this.audit(authorEmail, "RESTORE_RECORD", originalTable, recordData.id, `Restored deleted record from Trash Bin`);
    return true;
  }

  public async bulkDeleteRecords(tableName: keyof DatabaseSchema, ids: string[], permanent: boolean, authorEmail: string): Promise<number> {
    let successCount = 0;
    for (const id of ids) {
      const ok = await this.deleteRecord(tableName, id, permanent, authorEmail);
      if (ok) successCount++;
    }
    return successCount;
  }

  public async getTrashBin(): Promise<DeletedRecord[]> {
    const { data, error } = await this.supabase.from("deleted_records").select("*").order("deleted_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      originalTable: r.original_table,
      recordData: r.record_data,
      deletedAt: r.deleted_at,
      deletedBy: r.deleted_by
    }));
  }

  public async audit(userEmail: string, action: string, entityType: string, entityId: string, details: string): Promise<void> {
    await this.supabase.from("audit_logs").insert({
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString()
    });
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await this.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data || []).map((l: any) => ({
      id: l.id,
      userEmail: l.user_email,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      details: l.details,
      createdAt: l.created_at
    }));
  }

  public async backupDatabase(): Promise<string> {
    const users = await this.getUsers();
    const customers = await this.supabase.from("customers").select("*");
    const loans = await this.supabase.from("loans").select("*");
    const loanPayments = await this.supabase.from("loan_payments").select("*");
    const savings = await this.supabase.from("savings").select("*");
    const profitRecords = await this.supabase.from("profit_records").select("*");
    const notifications = await this.supabase.from("notifications").select("*");
    const auditLogs = await this.supabase.from("audit_logs").select("*");
    const deletedRecords = await this.supabase.from("deleted_records").select("*");

    return JSON.stringify({
      users,
      customers: customers.data || [],
      loans: loans.data || [],
      loanPayments: loanPayments.data || [],
      savings: savings.data || [],
      profitRecords: profitRecords.data || [],
      notifications: notifications.data || [],
      auditLogs: auditLogs.data || [],
      deletedRecords: deletedRecords.data || []
    }, null, 2);
  }

  public async restoreDatabaseBackup(jsonData: string, authorEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.users || !parsed.customers || !parsed.loans) {
        return { success: false, error: "Invalid backup format. Missing core tables." };
      }
      
      await this.supabase.from("deleted_records").delete().neq("id", "");
      await this.supabase.from("audit_logs").delete().neq("id", "");
      await this.supabase.from("notifications").delete().neq("id", "");
      await this.supabase.from("profit_records").delete().neq("id", "");
      await this.supabase.from("savings").delete().neq("id", "");
      await this.supabase.from("loan_payments").delete().neq("id", "");
      await this.supabase.from("loans").delete().neq("id", "");
      await this.supabase.from("customers").delete().neq("id", "");
      await this.supabase.from("users").delete().neq("id", "");

      if (parsed.users.length) {
        await this.supabase.from("users").insert(parsed.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          password_hash: u.passwordHash || u.password_hash,
          full_name: u.fullName || u.full_name,
          role: u.role,
          created_at: u.createdAt || u.created_at
        })));
      }

      if (parsed.customers.length) await this.supabase.from("customers").insert(parsed.customers);
      if (parsed.loans.length) await this.supabase.from("loans").insert(parsed.loans);
      if (parsed.loanPayments.length) await this.supabase.from("loan_payments").insert(parsed.loanPayments);
      if (parsed.savings.length) await this.supabase.from("savings").insert(parsed.savings);
      if (parsed.profitRecords.length) await this.supabase.from("profit_records").insert(parsed.profitRecords);
      if (parsed.notifications.length) await this.supabase.from("notifications").insert(parsed.notifications);
      if (parsed.auditLogs.length) await this.supabase.from("audit_logs").insert(parsed.auditLogs);
      if (parsed.deletedRecords.length) await this.supabase.from("deleted_records").insert(parsed.deletedRecords);

      await this.audit(authorEmail, "RESTORE_FULL_BACKUP", "database", "all", "Restored full database backup successfully");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to parse json backup" };
    }
  }

  public async getDashboardStats(): Promise<any> {
    const activeLoans = await this.getLoans();
    const { data: allActivePayments } = await this.supabase.from("loan_payments").select("*").eq("is_deleted", false);
    const { data: activeSavings } = await this.supabase.from("savings").select("*").eq("is_deleted", false);
    const { data: profitRecords } = await this.supabase.from("profit_records").select("*");

    const activeLoansCount = activeLoans.filter(l => l.status !== "closed").length;
    const totalCapitalValue = 100000;
    const totalMoneyLent = activeLoans.filter(l => l.status !== "closed").reduce((acc, l) => acc + l.amount, 0);
    
    const profitListAll = profitRecords || [];
    const totalCumulativeProfit = profitListAll.reduce((acc, pr) => acc + Number(pr.amount), 0);

    const thisMonthText = new Date().toISOString().substring(0, 7);
    const currentMonthProfit = profitListAll
      .filter(pr => pr.date.startsWith(thisMonthText))
      .reduce((acc, pr) => acc + Number(pr.amount), 0);

    const totalSavings = (activeSavings || []).reduce((acc, s) => acc + Number(s.amount), 0);
    const overdueCount = activeLoans.filter(l => l.status === "overdue").length;

    const todayStr = new Date().toISOString().split("T")[0];
    const todayCollections = (allActivePayments || [])
      .filter(p => p.payment_date.startsWith(todayStr))
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const months = [];
    const profitByMonth: { [key: string]: number } = {};
    const collectionsByMonth: { [key: string]: number } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const mKey = d.toISOString().substring(0, 7);
      months.push({ label: mLabel, key: mKey });
      profitByMonth[mKey] = 0;
      collectionsByMonth[mKey] = 0;
    }

    profitListAll.forEach(pr => {
      const mKey = pr.date.substring(0, 7);
      if (profitByMonth[mKey] !== undefined) {
        profitByMonth[mKey] += Number(pr.amount);
      }
    });

    (allActivePayments || []).forEach(pay => {
      const mKey = pay.payment_date.substring(0, 7);
      if (collectionsByMonth[mKey] !== undefined) {
        collectionsByMonth[mKey] += Number(pay.amount);
      }
    });

    const monthlyTrends = months.map(m => ({
      name: m.label,
      profit: Number(profitByMonth[m.key].toFixed(2)),
      collections: Number(collectionsByMonth[m.key].toFixed(2))
    }));

    let totalDuesInWeekly = 0;
    let totalPaidInWeekly = 0;
    activeLoans.filter(l => l.type === "weekly" && l.repaymentSchedule).forEach(l => {
      l.repaymentSchedule?.forEach(inst => {
        totalDuesInWeekly++;
        if (inst.paid) {
          totalPaidInWeekly++;
        }
      });
    });

    const recoveryRate = totalDuesInWeekly > 0 ? Math.round((totalPaidInWeekly / totalDuesInWeekly) * 100) : 100;

    const closedLoansCount = activeLoans.filter(l => l.status === "closed").length;
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
    };
  }

  public async runOverdueChecks(): Promise<void> {
    const now = new Date();
    const activeLoans = await this.getLoans();
    
    for (const loan of activeLoans) {
      if (loan.isDeleted || loan.status === "closed") continue;

      if (loan.type === "advance_interest" && loan.repaymentSchedule) {
        let isOverdue = false;
        
        loan.repaymentSchedule.forEach(inst => {
          const due = new Date(inst.dueDate);
          if (due.getTime() < now.getTime() && !inst.paid) {
            const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 3) {
              isOverdue = true;
            }
          }
        });

        const newStatus = isOverdue ? "overdue" : "active";
        if (loan.status !== newStatus) {
          await this.supabase.from("loans").update({ status: newStatus }).eq("id", loan.id);
          
          if (isOverdue) {
            const exists = await this.supabase.from("notifications")
              .select("id")
              .eq("loan_id", loan.id)
              .eq("type", "overdue")
              .eq("read", false)
              .maybeSingle();
            if (!exists.data) {
              await this.supabase.from("notifications").insert({
                id: `n_check_${Date.now()}_${loan.id}`,
                loan_id: loan.id,
                customer_name: loan.customerName || "Customer",
                title: "Overdue Loan Detected",
                message: `${loan.customerName} is marked Overdue. Paid installments are lagging.`,
                type: "overdue",
                read: false,
                created_at: new Date().toISOString()
              });
            }
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------------------
// DATABASE MANAGER EXPORT FACTORY
// -------------------------------------------------------------------------
const hasSupabase = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));

export const db: IDatabase = hasSupabase 
  ? new SupabaseDatabaseManager() 
  : new LocalDatabaseManager();
