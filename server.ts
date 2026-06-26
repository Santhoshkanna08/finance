import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

async function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  
  try {
    const users = await db.getUsers();
    const user = users.find(u => u.email === token);
    return user || null;
  } catch (e) {
    return null;
  }
}

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized access: Please authenticate" });
    return;
  }
  (req as any).user = user;
  next();
};

/* =========================================================================
   1. Authentication API Endpoints
   ========================================================================= */

app.post("/api/auth/register", async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ error: "Missing registration payloads" });
    return;
  }

  const existing = await db.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const newUser = {
    id: `u_${Date.now()}`,
    email: email.toLowerCase(),
    passwordHash: password,
    fullName,
    role: "staff",
    createdAt: new Date().toISOString()
  };
  
  await db.addUser(newUser);
  await db.audit(newUser.email, "REGISTER_USER", "users", newUser.id, `Created a new account for ${fullName}`);

  res.json({
    email: newUser.email,
    fullName: newUser.fullName,
    token: newUser.email,
    role: newUser.role
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Please enter your email and password" });
    return;
  }

  const user = await db.getUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await db.audit(user.email, "LOGIN_SUCCESS", "users", user.id, `${user.fullName} logged in successfully`);

  res.json({
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    token: user.email
  });
});

app.put("/api/auth/profile", requireAuth, async (req, res) => {
  const { fullName } = req.body;
  const user = (req as any).user;

  if (!fullName) {
    res.status(400).json({ error: "Full name is required" });
    return;
  }

  const success = await db.updateUserProfile(user.email, fullName);
  if (success) {
    res.json({ success: true, fullName });
  } else {
    res.status(404).json({ error: "User session not found" });
  }
});

app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = (req as any).user;

  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: "Old and new password fields are required" });
    return;
  }

  const success = await db.changeUserPassword(user.email, oldPassword, newPassword);
  if (success) {
    await db.audit(user.email, "CHANGE_PASSWORD", "users", user.id, "Successfully changed password");
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Incorrect current password" });
  }
});

/* =========================================================================
   2. Dashboard API Endpoints
   ========================================================================= */

app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
  await db.runOverdueChecks();
  const stats = await db.getDashboardStats();
  res.json(stats);
});

/* =========================================================================
   3. Customer Management API Endpoints
   ========================================================================= */

app.get("/api/customers", requireAuth, async (req, res) => {
  res.json(await db.getCustomers());
});

app.post("/api/customers", requireAuth, async (req, res) => {
  const { name } = req.body;
  const user = (req as any).user;

  if (!name) {
    res.status(400).json({ error: "Name is a required field" });
    return;
  }

  const newCust = await db.addCustomer({ name }, user.email);
  res.json(newCust);
});

app.put("/api/customers/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const user = (req as any).user;

  const updated = await db.updateCustomer(id, { name }, user.email);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: "Customer not found" });
  }
});

/* =========================================================================
   4. Loan Management API Endpoints
   ========================================================================= */

app.get("/api/loans", requireAuth, async (req, res) => {
  res.json(await db.getLoans());
});

app.post("/api/loans", requireAuth, async (req, res) => {
  const { customerId, type, amount, interestRate, durationWeeks, weeklyPayment, monthlyInterest } = req.body;
  const user = (req as any).user;

  if (!customerId || !type || !amount || !interestRate) {
    res.status(400).json({ error: "Missing required loan configuration values" });
    return;
  }

  const newLoan = await db.addLoan({
    customerId,
    type,
    amount: Number(amount),
    interestRate: Number(interestRate),
    durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
    weeklyPayment: weeklyPayment ? Number(weeklyPayment) : undefined,
    monthlyInterest: monthlyInterest ? Number(monthlyInterest) : undefined
  }, user.email);

  res.json(newLoan);
});

app.post("/api/loans/:id/settle-principal", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const user = (req as any).user;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "A valid positive settlement amount is required" });
    return;
  }

  const loan = await db.settleInterestOnlyPrincipal(id, Number(amount), user.email);
  if (loan) {
    res.json(loan);
  } else {
    res.status(404).json({ error: "Interest-Only Active Loan not found or already settled" });
  }
});

/* =========================================================================
   5. Payment Tracking API Endpoints
   ========================================================================= */

app.get("/api/payments", requireAuth, async (req, res) => {
  const loans = await db.getLoans();
  res.json(loans.flatMap(l => l.isDeleted ? [] : []));
});

app.get("/api/payments/history", requireAuth, async (req, res) => {
  const allPayments = await db.backupDatabase();
  const parsed = JSON.parse(allPayments);
  const activePayments = (parsed.loanPayments || []).filter((p: any) => !p.isDeleted);
  res.json(activePayments);
});

app.post("/api/payments", requireAuth, async (req, res) => {
  const { loanId, paymentDate, amount, paymentMethod, notes } = req.body;
  const user = (req as any).user;

  if (!loanId || !paymentDate || !amount || !paymentMethod) {
    res.status(400).json({ error: "Missing payment fields" });
    return;
  }

  const savedPayment = await db.recordPayment({
    loanId,
    paymentDate,
    amount: Number(amount),
    paymentMethod,
    notes: notes || ""
  }, user.email);

  if (savedPayment) {
    res.json(savedPayment);
  } else {
    res.status(404).json({ error: "Loan is inactive, already closed, or not found" });
  }
});

/* =========================================================================
   6. Savings Management API Endpoints
   ========================================================================= */

app.get("/api/savings", requireAuth, async (req, res) => {
  res.json(await db.getSavings());
});

app.post("/api/savings", requireAuth, async (req, res) => {
  const { date, amount, notes } = req.body;
  const user = (req as any).user;

  if (!date || !amount) {
    res.status(400).json({ error: "Saving deposit Date and Amount are required" });
    return;
  }

  const newSaving = await db.addSaving({
    date,
    amount: Number(amount),
    contributorName: user.fullName,
    notes: notes || ""
  }, user.email);

  res.json(newSaving);
});

/* =========================================================================
   7. Notifications API Endpoints
   ========================================================================= */

app.get("/api/notifications", requireAuth, async (req, res) => {
  res.json(await db.getNotifications());
});

app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
  const { id } = req.params;
  const success = await db.markNotificationRead(id);
  res.json({ success });
});

app.post("/api/notifications/dismiss-all", requireAuth, async (req, res) => {
  await db.dismissAllNotifications();
  res.json({ success: true });
});

/* =========================================================================
   8. Trash and Soft Deletions API Endpoints (Data Safety)
   ========================================================================= */

app.get("/api/trash", requireAuth, async (req, res) => {
  res.json(await db.getTrashBin());
});

app.post("/api/trash/restore/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  
  const ok = await db.restoreRecord(id, user.email);
  if (ok) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Deleted record not found in Trash" });
  }
});

app.delete("/api/:table/:id", requireAuth, async (req, res) => {
  const { table, id } = req.params;
  const { permanent } = req.query;
  const user = (req as any).user;

  const isPermanent = permanent === "true";
  
  const validTables = ["customers", "loans", "loanPayments", "savings"];
  if (!validTables.includes(table)) {
    res.status(400).json({ error: "Invalid target operation table" });
    return;
  }

  const success = await db.deleteRecord(table as any, id, isPermanent, user.email);
  if (success) {
    res.json({ success: true, id, permanent: isPermanent });
  } else {
    res.status(404).json({ error: "Record not found or failed to delete" });
  }
});

app.post("/api/:table/bulk-delete", requireAuth, async (req, res) => {
  const { table } = req.params;
  const { ids, permanent } = req.body;
  const user = (req as any).user;

  if (!ids || !Array.isArray(ids)) {
    res.status(400).json({ error: "Array of record ids required" });
    return;
  }

  const isPermanent = permanent === true;
  const validTables = ["customers", "loans", "loanPayments", "savings"];
  if (!validTables.includes(table)) {
    res.status(400).json({ error: "Invalid target table for bulk deletion" });
    return;
  }

  const count = await db.bulkDeleteRecords(table as any, ids, isPermanent, user.email);
  res.json({ success: true, count, permanent: isPermanent });
});

/* =========================================================================
   9. Audit Logs & Database Backup/Restore API Endpoints
   ========================================================================= */

app.get("/api/audit-logs", requireAuth, async (req, res) => {
  res.json(await db.getAuditLogs());
});

app.get("/api/database/export", requireAuth, async (req, res) => {
  const backupData = await db.backupDatabase();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=finance_backup.json");
  res.send(backupData);
});

app.post("/api/database/import", requireAuth, async (req, res) => {
  const { backupJson } = req.body;
  const user = (req as any).user;

  if (!backupJson) {
    res.status(400).json({ error: "Missing backup JSON payload" });
    return;
  }

  const result = await db.restoreDatabaseBackup(typeof backupJson === "string" ? backupJson : JSON.stringify(backupJson), user.email);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: result.error || "Failed to restore backup" });
  }
});

/* =========================================================================
   10. Vite Middleware & Static Output Files
   ========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Live and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
