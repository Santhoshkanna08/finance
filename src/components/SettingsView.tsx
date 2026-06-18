import React from "react";
import { 
  Settings, 
  User, 
  Lock, 
  FileJson, 
  Sun, 
  Moon, 
  Database, 
  Key, 
  Upload, 
  Download,
  Terminal,
  Copy,
  Check
} from "lucide-react";

interface SettingsViewProps {
  user: { fullName: string; email: string; role: string } | null;
  onUpdateProfile: (name: string) => Promise<boolean>;
  onChangePassword: (old: string, updated: string) => Promise<boolean>;
  onImportBackup: (jsonContent: string) => Promise<boolean>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsView({
  user,
  onUpdateProfile,
  onChangePassword,
  onImportBackup,
  isDarkMode,
  onToggleDarkMode
}: SettingsViewProps) {
  // Profiles states
  const [profileName, setProfileName] = React.useState(user?.fullName || "");
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [profileError, setProfileError] = React.useState("");

  // Passwords states
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [passSuccess, setPassSuccess] = React.useState("");
  const [passError, setPassError] = React.useState("");

  // DB Backup file upload references
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importSuccess, setImportSuccess] = React.useState("");
  const [importError, setImportError] = React.useState("");

  // Copy Schema SQL states
  const [copied, setCopied] = React.useState(false);

  // Sync profile name on load
  React.useEffect(() => {
    if (user) setProfileName(user.fullName);
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    const ok = await onUpdateProfile(profileName);
    if (ok) {
      setProfileSuccess("Business profile updated successfully!");
    } else {
      setProfileError("Failed to update profile name.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess("");
    setPassError("");
    const ok = await onChangePassword(oldPassword, newPassword);
    if (ok) {
      setPassSuccess("Password key updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } else {
      setPassError("Incorrect current password verification.");
    }
  };

  // Export JSON Backup
  const handleDownloadBackup = () => {
    window.open("/api/database/export", "_blank");
  };

  // Import JSON Backup
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportSuccess("");
    setImportError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Verify valid json parse
        JSON.parse(text);
        
        const ok = await onImportBackup(text);
        if (ok) {
          setImportSuccess("Database restored successfully from backup JSON! Synchronizing details.");
        } else {
          setImportError("Database structure mismatch inside file.");
        }
      } catch (err) {
        setImportError("Invalid JSON text content. Please verify backup file integrity.");
      }
    };
    reader.readAsText(file);
  };

  // Postgres Supabase SQL tables schema script
  const sqlSchema = `
-- SUPABASE POSTGRESQL TABLES SCHEMA
-- ----------------------------------------------------

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create loans table
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('weekly', 'interest_only')),
    amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    duration_weeks INT,
    weekly_payment NUMERIC(15, 2),
    monthly_interest NUMERIC(15, 2),
    balance NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('active', 'closed', 'overdue')) DEFAULT 'active',
    total_profit NUMERIC(15, 2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT false,
    repayment_schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS public.loan_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'gpay', 'phonepe', 'other')),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create savings table
CREATE TABLE IF NOT EXISTS public.savings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    contributor_name VARCHAR(255),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on all tables (if using Row Level Policies)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
  `.trim();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans">
      
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Manage system security keys, trigger raw database backups, toggle graphic layouts, and acquire Supabase SQL structures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        {/* Profile Card and Passwords (Grid column 1) */}
        <div className="space-y-5">
          
          {/* Layout visual toggles box */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <h3 className="font-bold text-[13px] tracking-wide mb-4 flex items-center justify-between">
              <span>Graphic Theme settings</span>
              <span className="font-mono text-[10px] text-slate-400">Layout Appearance</span>
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 font-medium">Dark Mode Interface</span>
              <button
                onClick={onToggleDarkMode}
                className="p-2 bg-emerald-500 text-white rounded-xl shadow cursor-pointer shadow-emerald-550/20"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Profile Name */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <h3 className="font-bold text-[13px] tracking-wide mb-4">Update Profile Information</h3>

            {profileSuccess && <p className="text-emerald-500 p-2 text-[11px] font-semibold bg-emerald-500/10 rounded-lg mb-4">{profileSuccess}</p>}
            {profileError && <p className="text-rose-500 p-2 text-[11px] font-semibold bg-rose-500/10 rounded-lg mb-4">{profileError}</p>}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 font-mono">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none opacity-50 bg-slate-100 ${
                    isDarkMode ? "dark:bg-slate-950 dark:border-slate-850" : "border-slate-200"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 font-mono">Manager Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "border-slate-50"
                  }`}
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Update Profile
              </button>
            </form>
          </div>

          {/* Change Database Passwords keys */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <h3 className="font-bold text-[13px] tracking-wide mb-4">Change Security Password</h3>

            {passSuccess && <p className="text-emerald-500 p-2 text-[11px] font-semibold bg-emerald-500/10 rounded-lg mb-4">{passSuccess}</p>}
            {passError && <p className="text-rose-500 p-2 text-[11px] font-semibold bg-rose-500/10 rounded-lg mb-4">{passError}</p>}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 font-mono">Current Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "border-slate-50"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 font-mono">New Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none focus:border-emerald-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "border-slate-50"
                  }`}
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Change Password Key
              </button>
            </form>
          </div>

        </div>

        {/* Database backup exports and raw SQL integrations (Grid column 2) */}
        <div className="space-y-5 text-xs">
          
          {/* Export JSON backup and restoration block */}
          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <h3 className="font-bold text-[13px] tracking-wide mb-2 flex items-center gap-1.5 text-slate-400 font-mono uppercase">
              <Database className="w-4 h-4 text-emerald-500 animate-pulse" />
              Database Backups
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Lodge backup parameters client side. Downloading compiles a complete JSON file representing all customers, weekly schedules, payments history, savings, and notifications.
            </p>

            {importSuccess && <p className="text-emerald-500 p-2 text-[11px] font-semibold bg-emerald-500/10 rounded-lg mb-4">{importSuccess}</p>}
            {importError && <p className="text-rose-500 p-2 text-[11px] font-semibold bg-rose-500/10 rounded-lg mb-4">{importError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadBackup}
                className="py-3 px-4 rounded-xl border border-dashed text-slate-700 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 dark:text-slate-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <Download className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-xs">Download JSON Backup</span>
                <span className="text-[9px] text-slate-400 mt-1">Export full database file</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-xl border border-dashed text-slate-700 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 dark:text-slate-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <Upload className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-xs">Import JSON Backup</span>
                <span className="text-[9px] text-slate-400 mt-1">Scribe and restore file</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Raw SQL structures block for Supabase Postgres integration */}
          <div className={`p-6 rounded-2xl border flex flex-col h-[340px] ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-[13px] tracking-wide flex items-center gap-1.5 uppercase font-mono text-slate-400">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  Supabase Integration SQL
                </h3>
                <p className="text-[10px] text-slate-500 leading-snug mt-1">
                  Copy this DDL Script into your Supabase SQL editor to scaffold the PostgreSQL database tables.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  copied 
                    ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" 
                    : "text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Copy SQL Schema Script"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 leading-relaxed max-h-52">
              <pre className="whitespace-pre-wrap">{sqlSchema}</pre>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
