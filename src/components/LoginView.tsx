import React from "react";
import { ReceiptIndianRupee, Lock, Mail, UserPlus, LogIn, Key, Eye, EyeOff } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (email: string, fullName: string, role: string, token: string) => void;
  isDarkMode: boolean;
}

export default function LoginView({ onLoginSuccess, isDarkMode }: LoginViewProps) {
  const [isRegister, setIsRegister] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Forgot password triggers
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body: any = isRegister ? { email, password, fullName } : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during authentication");
      }

      if (isRegister) {
        setSuccess("Registration successful! Switching to login...");
        setIsRegister(false);
        setPassword("");
      } else {
        onLoginSuccess(data.email, data.fullName, data.role, data.token);
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with authentication services.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please input a valid email address");
      return;
    }
    setSuccess(`A password reset instructions link has been sent to ${resetEmail}. Check your inbox.`);
    setShowForgotPassword(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? "bg-slate-950 text-slate-100" 
        : "bg-slate-50 text-slate-800"
    }`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border transition-all ${
        isDarkMode 
          ? "bg-slate-900 border-slate-800/80 shadow-emerald-500/5" 
          : "bg-white border-slate-200/60"
      }`}>
        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3.5 bg-emerald-500 rounded-2xl shadow-lg ring-4 ring-emerald-500/10 mb-4 text-white">
            <ReceiptIndianRupee className="w-8 h-8 animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Capital<span className="text-emerald-500">Flow</span>
          </h1>
          <p className="text-xs text-slate-500/85 tracking-widest uppercase font-mono mt-1">
            Finance & Loan Ledger
          </p>
        </div>

        {/* Action Toggle Tabs */}
        {!showForgotPassword && (
          <div className="p-1 rounded-xl bg-slate-100 flex space-x-1 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                !isRegister 
                  ? "bg-white text-slate-900 shadow" 
                  : "text-slate-500 hover:text-slate-700 "
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                isRegister 
                  ? "bg-white text-slate-900 shadow" 
                  : "text-slate-500 hover:text-slate-700 "
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Global info alerts */}
        {error && (
          <div className="p-3 mb-5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium">
            {success}
          </div>
        )}

        {showForgotPassword ? (
          /* Forgot Password form view */
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Forgot Password?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered business email and we'll send you an otp reference to self-resolve.
              </p>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 block font-mono">Business Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-850 text-white focus:border-emerald-500" 
                      : "bg-slate-50 border-slate-250 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Send Reset Code
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2 block hover:underline"
            >
              Return back to Sign In
            </button>
          </form>
        ) : (
          /* Standard Sign-In / Register Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Business Manager Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Santhosh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-850 text-white focus:border-emerald-500" 
                        : "bg-slate-50 border-slate-250 text-slate-900 focus:border-emerald-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 block font-mono">Business Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-850 text-white focus:border-emerald-500" 
                      : "bg-slate-50 border-slate-250 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 block font-mono">Password Key</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] text-emerald-500 hover:underline cursor-pointer"
                  >
                    Forgot Key?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-850 text-white focus:border-emerald-500" 
                      : "bg-slate-50 border-slate-250 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-transform flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95"
            >
              {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? "Processing..." : isRegister ? "Create Account" : "Access Console"}</span>
            </button>
          </form>
        )}

        {/* Demo instructions */}
        <div className={`mt-8 pt-5 border-t text-center leading-relaxed ${
          isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"
        }`}>
          <p className="text-[11px] font-mono flex items-center justify-center gap-1">
            <Key className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
            Default credentials for live preview:
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Email: <span className="font-mono text-emerald-500 selection:bg-emerald-500 selection:text-white">work.santhosh.fsd@gmail.com</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            Password: <span className="font-mono text-emerald-500">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
