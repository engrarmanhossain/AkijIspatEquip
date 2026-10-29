import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Building,
  UserCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper modals
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
      setIsSubmitting(false);
    }, 350);
  };

  const handleDemoFill = (role: 'admin' | 'manager' | 'tech') => {
    setErrorMessage(null);
    if (role === 'admin') {
      setEmail('armanhossain.eee.info@gmail.com');
      setPassword('arman2026**');
    } else if (role === 'manager') {
      setEmail('marcus.vance@plant04.com');
      setPassword('manager2026');
    } else {
      setEmail('david.chen@plant04.com');
      setPassword('tech2026');
    }
  };

  return (
    <div className="min-h-screen bg-[#ebf0f7] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-500 selection:text-white relative">
      {/* Background soft ambient accents */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[370px] sm:max-w-[390px] relative z-10 space-y-4">
        {/* Neumorphic Soft UI Main Card */}
        <div className="neu-card rounded-[38px] p-7 sm:p-9 flex flex-col items-center relative transition-all">
          
          {/* Top Raised Circular Lock Badge (Exact Match to Reference UI) */}
          <div className="w-20 h-20 rounded-full neu-badge-raised flex items-center justify-center -mt-3 mb-6 transition-transform hover:scale-105 select-none">
            <span className="text-3xl filter drop-shadow-sm select-none" role="img" aria-label="Lock">
              🔐
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center">
            Welcome
          </h1>
          <p className="text-xs text-slate-500 font-medium text-center mt-1.5 mb-6">
            Login to continue your journey
          </p>

          {/* Error Message Pill */}
          {errorMessage && (
            <div className="w-full mb-4 p-3 rounded-2xl neu-groove-inset border border-rose-400/40 text-rose-600 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4 text-xs">
            {/* Email Field with Inset Neumorphic Groove */}
            <div className="neu-groove-inset rounded-[22px] px-5 py-2.5 transition-all">
              <label className="block text-[11px] font-bold text-blue-600 mb-0.5 tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mhatre.nilesh@gmail.com"
                className="w-full bg-transparent text-slate-800 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400/80"
              />
            </div>

            {/* Password Field with Inset Neumorphic Groove & Eye Toggle */}
            <div className="neu-groove-inset rounded-[22px] px-5 py-2.5 transition-all">
              <label className="block text-[11px] font-bold text-blue-600 mb-0.5 tracking-wide">
                Password
              </label>
              <div className="flex items-center justify-between">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent text-slate-800 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-slate-400/80 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="text-slate-500 hover:text-slate-800 transition p-1 ml-2 focus:outline-none select-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  ) : (
                    <span className="text-base select-none leading-none" role="img" aria-label="Show password">
                      👁️
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs px-1 pt-1 text-slate-600">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="neu-checkbox w-4 h-4 rounded-md"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition select-none"
              >
                Forgot Password?
              </button>
            </div>

            {/* Raised LOGIN Button (Extruded Neumorphic Pill) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-[22px] neu-button-raised text-blue-600 hover:text-blue-700 font-extrabold text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer select-none mt-5 active:scale-[0.99] disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>

          {/* Don't have an account? + Raised Circle Button */}
          <div className="flex items-center justify-center space-x-3 pt-6 text-xs text-slate-500 font-medium select-none">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => setRegisterModalOpen(true)}
              title="Request New Account Access"
              className="w-8 h-8 rounded-full neu-circle-btn flex items-center justify-center text-blue-600 font-bold text-lg leading-none cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Social / SSO Circular Raised Buttons at Bottom (G, f, in) */}
          <div className="flex items-center justify-center space-x-4 pt-4 pb-1">
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              title="Admin Quick Fill (Arman Hossain)"
              className="w-9 h-9 rounded-full neu-circle-btn flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold text-xs cursor-pointer select-none"
            >
              G
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('manager')}
              title="Manager Quick Fill"
              className="w-9 h-9 rounded-full neu-circle-btn flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold text-xs cursor-pointer select-none"
            >
              f
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('tech')}
              title="Technician Quick Fill"
              className="w-9 h-9 rounded-full neu-circle-btn flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold text-xs cursor-pointer select-none"
            >
              in
            </button>
          </div>
        </div>

        {/* Quick Demo Credentials Bar below the Neumorphic Card */}
        <div className="neu-badge-raised rounded-2xl p-3 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center space-x-1 font-semibold text-slate-700">
            <span>Demo Fill:</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] shadow-sm hover:bg-blue-700 transition"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('manager')}
              className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold text-[10px] hover:bg-slate-300 transition"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('tech')}
              className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold text-[10px] hover:bg-slate-300 transition"
            >
              Tech
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-[32px] neu-card p-6 relative">
            <button
              onClick={() => {
                setForgotModalOpen(false);
                setForgotSubmitted(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full neu-circle-btn text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div className="w-14 h-14 mx-auto rounded-full neu-badge-raised flex items-center justify-center text-2xl">
                🔑
              </div>
              <h3 className="text-lg font-bold text-slate-800">Password Recovery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                For plant security, employee credentials are managed by the System Administrator.
              </p>

              {forgotSubmitted ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span>Request sent to <strong>armanhossain.eee.info@gmail.com</strong>. You will receive reset instructions shortly.</span>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="neu-groove-inset rounded-2xl px-4 py-2.5 text-left">
                    <label className="block text-[10px] font-bold text-blue-600 mb-0.5">
                      Your Registered Email
                    </label>
                    <input
                      type="email"
                      defaultValue={email}
                      placeholder="employee@plant04.com"
                      className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotSubmitted(true)}
                    className="w-full py-2.5 rounded-xl neu-button-raised text-blue-600 font-bold text-xs uppercase"
                  >
                    Send Reset Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Access / Account Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-[32px] neu-card p-6 relative">
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full neu-circle-btn text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div className="w-14 h-14 mx-auto rounded-full neu-badge-raised flex items-center justify-center text-2xl">
                📋
              </div>
              <h3 className="text-lg font-bold text-slate-800">New Staff Registration</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Staff accounts (Management and Non-Management) are provisioned directly by the Plant Administrator:
              </p>

              <div className="p-3.5 rounded-2xl neu-groove-inset text-left space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">Plant Director & Admin:</span>
                </div>
                <p className="font-mono text-[11px] text-blue-700 pl-6">
                  armanhossain.eee.info@gmail.com
                </p>
                <p className="text-[10px] text-slate-500 pl-6">
                  Contact admin to receive official Employee ID & login password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                className="w-full py-2.5 rounded-xl neu-button-raised text-blue-600 font-bold text-xs uppercase mt-3"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
