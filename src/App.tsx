import React from "react";
import Sidebar from "./components/Sidebar";
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import CustomersView from "./components/CustomersView";
import LoansView from "./components/LoansView";
import PaymentsView from "./components/PaymentsView";
import SavingsView from "./components/SavingsView";
import NotificationsView from "./components/NotificationsView";
import AuditView from "./components/AuditView";
import TrashView from "./components/TrashView";
import SettingsView from "./components/SettingsView";
import { 
  User, 
  Customer, 
  Loan, 
  LoanPayment, 
  Saving, 
  AppNotification, 
  AuditLog, 
  TrashRecord, 
  DashboardStats 
} from "./types";

export default function App() {
  // Session session variables
  const [user, setUser] = React.useState<User | null>(null);
  // Ref always holds the latest user so closures (setInterval, etc.) never go stale
  const userRef = React.useRef<User | null>(null);
  const [appMounted, setAppMounted] = React.useState(false);
  
  // App views
  const [currentTab, setCurrentTab] = React.useState("dashboard");
  
  // Theme settings
  const [isDarkMode, setIsDarkMode] = React.useState(true);

  // Database lists
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [payments, setPayments] = React.useState<LoanPayment[]>([]);
  const [savings, setSavings] = React.useState<Saving[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [trashItems, setTrashItems] = React.useState<TrashRecord[]>([]);

  // Page level error notifier
  const [globalError, setGlobalError] = React.useState("");

  // Keep userRef in sync with user state so stale closures always see the latest value
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Durably load cached preference variables
  React.useEffect(() => {
    // Session load
    const savedUser = localStorage.getItem("capitalflow_session");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        userRef.current = parsed;
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("capitalflow_session");
      }
    }

    // Theme preference load
    const savedTheme = localStorage.getItem("capitalflow_dark_mode");
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "true");
    } else {
      setIsDarkMode(true); // Default to gorgeous dark mode theme
    }

    setAppMounted(true);
  }, []);

  // Fetch helpers — reads from userRef so it is NEVER stale inside closures
  const getAuthHeaders = () => {
    const currentUser = userRef.current;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${currentUser?.token || ""}`
    };
  };

  // Main synchronized data fetcher — uses userRef so the setInterval copy is always fresh
  const synchronizeDatabaseTick = async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      const headers = getAuthHeaders();

      // Fetch stats
      const statsRes = await fetch("/api/dashboard/stats", { headers });
      if (statsRes.status === 401) { handleLogout(); return; }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch customers
      const custRes = await fetch("/api/customers", { headers });
      if (custRes.ok) setCustomers(await custRes.json());

      // Fetch loans
      const loanRes = await fetch("/api/loans", { headers });
      if (loanRes.ok) setLoans(await loanRes.json());

      // Fetch payments
      const payRes = await fetch("/api/payments/history", { headers });
      if (payRes.ok) setPayments(await payRes.json());

      // Fetch savings
      const savRes = await fetch("/api/savings", { headers });
      if (savRes.ok) setSavings(await savRes.json());

      // Fetch notifications
      const notifRes = await fetch("/api/notifications", { headers });
      if (notifRes.ok) setNotifications(await notifRes.json());

      // Fetch audit logs
      const auditRes = await fetch("/api/audit-logs", { headers });
      if (auditRes.ok) setAuditLogs(await auditRes.json());

      // Fetch trash items
      const trashRes = await fetch("/api/trash", { headers });
      if (trashRes.ok) setTrashItems(await trashRes.json());

    } catch (err: any) {
      console.error("Database sync ticker failed", err);
      setGlobalError("Database sync failed. Retrying in background...");
    }
  };

  // Synchronize on login session update — only one long-lived interval, stable via userRef
  React.useEffect(() => {
    if (user) {
      synchronizeDatabaseTick();
      // Periodically refresh dashboard parameters every 15 seconds
      const ticker = setInterval(() => synchronizeDatabaseTick(), 15000);
      return () => clearInterval(ticker);
    }
  }, [user]);

  // Auth hooks
  const handleLoginSuccess = (email: string, fullName: string, role: string, token: string) => {
    const sessionObj = { email, fullName, role, token };
    localStorage.setItem("capitalflow_session", JSON.stringify(sessionObj));
    // Update ref immediately so the very first synchronizeDatabaseTick after login has the token
    userRef.current = sessionObj;
    setUser(sessionObj);
    setCurrentTab("dashboard");
    setGlobalError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("capitalflow_session");
    userRef.current = null;
    setUser(null);
    setStats(null);
    setCustomers([]);
    setLoans([]);
    setPayments([]);
  };

  // Toggle layout themes
  const handleToggleDarkMode = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem("capitalflow_dark_mode", String(nextVal));
  };

  // Add customer handler
  const handleAddCustomer = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to log customer");
      }
      await synchronizeDatabaseTick();
      return true;
    } catch (e: any) {
      alert(e.message || "An error occurred");
      return false;
    }
  };

  // Edit customer details
  const handleEditCustomer = async (id: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      await synchronizeDatabaseTick();
      return true;
    } catch (e: any) {
      alert(e.message || "An error occurred");
      return false;
    }
  };

  // Delete customer (soft/hard)
  const handleDeleteCustomer = async (id: string, permanent: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customers/${id}?permanent=${permanent}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Delete operation failed");
      await synchronizeDatabaseTick();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Bulk Deletion
  const handleBulkDeleteCustomers = async (ids: string[], permanent: boolean): Promise<number> => {
    try {
      const res = await fetch("/api/customers/bulk-delete", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids, permanent })
      });
      if (!res.ok) throw new Error("Bulk delete operations failed");
      const data = await res.json();
      await synchronizeDatabaseTick();
      return data.count || 0;
    } catch (e) {
      return 0;
    }
  };

  // Add Loan handler
  const handleAddLoan = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to disburse loan portfolio asset");
      }
      await synchronizeDatabaseTick();
      return true;
    } catch (e: any) {
      alert(e.message || "An error occurred");
      return false;
    }
  };

  // Record payment installment
  const handleRecordPayment = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record transaction payment");
      }
      await synchronizeDatabaseTick();
      return true;
    } catch (e: any) {
      alert(e.message || "An error occurred");
      return false;
    }
  };

  // Settle principal
  const handleSettlePrincipal = async (loanId: string, amount: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/loans/${loanId}/settle-principal`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to settle principal");
      }
      await synchronizeDatabaseTick();
      return true;
    } catch (e: any) {
      alert(e.message || "An error occurred");
      return false;
    }
  }

  // Soft delete a loan
  const handleDeleteLoan = async (id: string, permanent: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/loans/${id}?permanent=${permanent}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Delete failed");
      await synchronizeDatabaseTick();
      return true;
    } catch (e) {
      return false;
    }
  }

  // Add savings logs
  const handleAddSaving = async (amount: number, date: string, notes: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, date, notes })
      });
      if (!res.ok) throw new Error("Failed deposit logging");
      await synchronizeDatabaseTick();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Match notification read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      await synchronizeDatabaseTick();
    } catch (e) {}
  };

  const handleDismissAllNotifications = async () => {
    try {
      await fetch("/api/notifications/dismiss-all", {
        method: "POST",
        headers: getAuthHeaders()
      });
      await synchronizeDatabaseTick();
    } catch (e) {}
  };

  // Restore deleted item from Trash
  const handleRestoreRecord = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/trash/restore/${id}`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Restore action rejected");
      await synchronizeDatabaseTick();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Permanent Delete trigger from Trash
  const handlePermanentDelete = async (table: string, id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/${table}/${id}?permanent=true`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Hard delete rejected");
      await synchronizeDatabaseTick();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Update Profile Name
  const handleUpdateProfile = async (fullName: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ fullName })
      });
      if (!res.ok) throw new Error("Update name rejected");
      
      const sessionObj = { ...user!, fullName };
      localStorage.setItem("capitalflow_session", JSON.stringify(sessionObj));
      setUser(sessionObj);
      await synchronizeDatabaseTick();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Change Password
  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  // Restore JSON Backup
  const handleImportBackup = async (jsonContent: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/database/import", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ backupJson: jsonContent })
      });
      if (res.ok) {
        await synchronizeDatabaseTick();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  if (!appMounted) {
    return (
      <div className="flex items-center justify-center p-20 min-h-screen bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-emerald-500 rounded-full mb-3 shadow animate-bounce"></div>
          <span className="text-white text-xs font-mono font-bold tracking-widest uppercase">Initializing Ledger...</span>
        </div>
      </div>
    );
  }

  // Route Guard unauthenticated redirect
  if (!user) {
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess} 
        isDarkMode={isDarkMode} 
      />
    );
  }

  const unresolvedNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-800"
    }`}>
      
      <div className="flex flex-col md:flex-row min-h-screen">
        
        {/* Navigation Sidebar (Collapsible print layout) */}
        <div className="print:hidden">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            unresolvedNotificationsCount={unresolvedNotificationsCount}
            user={user}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Core Main Panel Frame */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0">
          
          {globalError && (
            <div className="bg-rose-500/10 text-rose-500 p-2.5 rounded-lg border border-rose-500/20 text-xs font-mono mb-4 flex justify-between items-center print:hidden">
              <span>⚠️ {globalError}</span>
              <button 
                onClick={() => setGlobalError("")}
                className="hover:underline font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Render Active View Router */}
          <div className="max-w-6xl mx-auto">
            {currentTab === "dashboard" && (
              <DashboardView
                stats={stats}
                onNavigate={setCurrentTab}
                isDarkMode={isDarkMode}
                onRefresh={synchronizeDatabaseTick}
              />
            )}

            {currentTab === "customers" && (
              <CustomersView
                customers={customers}
                loans={loans}
                onAddCustomer={handleAddCustomer}
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onBulkDelete={handleBulkDeleteCustomers}
                userEmail={user.email}
              />
            )}

            {currentTab === "loans" && (
              <LoansView
                loans={loans}
                customers={customers}
                onAddLoan={handleAddLoan}
                onRecordPayment={handleRecordPayment}
                onSettlePrincipal={handleSettlePrincipal}
                onDeleteLoan={handleDeleteLoan}
                isDarkMode={isDarkMode}
              />
            )}

            {currentTab === "payments" && (
              <PaymentsView
                payments={payments}
                loans={loans}
                onRecordPayment={handleRecordPayment}
                isDarkMode={isDarkMode}
              />
            )}

            {currentTab === "savings" && (
              <SavingsView
                savings={savings}
                onAddSaving={handleAddSaving}
                isDarkMode={isDarkMode}
              />
            )}

            {currentTab === "notifications" && (
              <NotificationsView
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
                onDismissAll={handleDismissAllNotifications}
                isDarkMode={isDarkMode}
              />
            )}

            {currentTab === "logs" && (
              <AuditView
                logs={auditLogs}
                isDarkMode={isDarkMode}
              />
            )}

            {currentTab === "trash" && (
              <TrashView
                trashItems={trashItems}
                onRestore={handleRestoreRecord}
                onDeletePermanent={handlePermanentDelete}
                isDarkMode={isDarkMode}
                onRefresh={synchronizeDatabaseTick}
              />
            )}

            {currentTab === "settings" && (
              <SettingsView
                user={user}
                onUpdateProfile={handleUpdateProfile}
                onChangePassword={handleChangePassword}
                onImportBackup={handleImportBackup}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
              />
            )}
          </div>

        </main>
      </div>

    </div>
  );
}
