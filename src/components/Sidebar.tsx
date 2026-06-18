import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  ReceiptIndianRupee, 
  CircleDollarSign, 
  PiggyBank, 
  Bell, 
  History, 
  Trash2, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unresolvedNotificationsCount: number;
  user: { fullName: string; email: string; role: string } | null;
  onLogout: () => void;
  isDarkMode: boolean;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  unresolvedNotificationsCount,
  user,
  onLogout,
  isDarkMode
}: SidebarProps) {
  const [isOpenInput, setIsOpenInput] = React.useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customers", label: "Customers", icon: Users },
    { id: "loans", label: "Loans", icon: ReceiptIndianRupee },
    { id: "payments", label: "Payments", icon: CircleDollarSign },
    { id: "savings", label: "Savings", icon: PiggyBank },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: Bell, 
      count: unresolvedNotificationsCount 
    },
    { id: "logs", label: "Audit Logs", icon: History },
    { id: "trash", label: "Trash Bin", icon: Trash2 },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpenInput(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b ${
        isDarkMode ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white/80 border-slate-200 text-slate-800"
      } sticky top-0 z-30 backdrop-blur-md`}>
        <div className="flex items-center space-x-2">
          <ReceiptIndianRupee className="w-6 h-6 text-emerald-500 animate-pulse" />
          <span className="font-bold tracking-tight text-lg">FinManage</span>
        </div>
        <button 
          onClick={() => setIsOpenInput(!isOpenInput)}
          className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
        >
          {isOpenInput ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpenInput && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsOpenInput(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:sticky md:flex flex-col border-r h-screen transition-transform duration-300 ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
      } ${
        isOpenInput ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        {/* Core Header (Desktop only) */}
        <div className="hidden md:flex items-center space-x-3 px-6 py-6 border-b border-inherit">
          <div className="p-2 bg-emerald-500 rounded-lg text-white">
            <ReceiptIndianRupee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-emerald-500">CapitalFlow</h1>
            <p className="text-xs text-slate-400 font-mono">Microfinance Ledger</p>
          </div>
        </div>

        {/* User Info Capsule */}
        {user && (
          <div className="px-5 py-4 border-b border-inherit bg-inherit flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
              {user.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-sm truncate">{user.fullName}</h2>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                  isActive 
                    ? "bg-emerald-500 text-white" 
                    : isDarkMode 
                      ? "hover:bg-slate-800 text-slate-300" 
                      : "hover:bg-slate-200/60 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs font-mono rounded-full font-bold ${
                    isActive ? "bg-white text-emerald-600" : "bg-red-500 text-white animate-bounce"
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-inherit">
          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900 text-rose-400 hover:bg-rose-500/10"
                : "border-slate-200 bg-white text-rose-600 hover:bg-rose-50"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>
    </>
  );
}
