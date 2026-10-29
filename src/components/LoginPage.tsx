import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Sun,
  Moon,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme state: defaults to dark mode per user request!
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('equipguard_login_theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('equipguard_login_theme', next ? 'dark' : 'light');
  };

  // Helper modals
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
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

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? 'bg-[#0f141f] text-slate-100 selection:bg-cyan-500'
          : 'bg-[#ebf0f7] text-slate-800 selection:bg-blue-500'
      } flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden font-sans`}
    >
      {/* Neumorphic Dark/Light Mode Theme Switcher Pill in Top-Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all select-none ${
            isDarkMode
              ? 'neu-dark-button-raised text-cyan-300 hover:text-cyan-200'
              : 'neu-button-raised text-slate-700 hover:text-slate-900'
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background soft ambient accents */}
      {isDarkMode ? (
        <>
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/50 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
        </>
      )}

      <div className="w-full max-w-[370px] sm:max-w-[390px] relative z-10 space-y-4">
        {/* Neumorphic Soft UI Main Card */}
        <div
          className={`${
            isDarkMode ? 'neu-dark-card' : 'neu-card'
          } rounded-[38px] p-7 sm:p-9 flex flex-col items-center relative transition-all duration-300`}
        >
          {/* Top Raised Circular Lock Badge (Exact Match to Reference UI) */}
          <div
            className={`w-20 h-20 rounded-full ${
              isDarkMode ? 'neu-dark-badge-raised ring-1 ring-white/5' : 'neu-badge-raised'
            } flex items-center justify-center -mt-3 mb-6 transition-transform hover:scale-105 select-none`}
          >
            <span
              className="text-3xl filter drop-shadow-sm select-none"
              role="img"
              aria-label="Lock"
            >
              🔐
            </span>
          </div>

          {/* Heading */}
          <h1
            className={`text-3xl font-extrabold ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            } tracking-tight text-center`}
          >
            Welcome
          </h1>
          <p
            className={`text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            } font-medium text-center mt-1.5 mb-6`}
          >
            Login to continue your journey
          </p>

          {/* Error Message Pill */}
          {errorMessage && (
            <div
              className={`w-full mb-4 p-3 rounded-2xl ${
                isDarkMode
                  ? 'neu-dark-groove-inset border border-rose-500/40 text-rose-300'
                  : 'neu-groove-inset border border-rose-400/40 text-rose-600'
              } text-xs flex items-center space-x-2 animate-in fade-in`}
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4 text-xs">
            {/* Email Field with Inset Neumorphic Groove */}
            <div
              className={`${
                isDarkMode ? 'neu-dark-groove-inset' : 'neu-groove-inset'
              } rounded-[22px] px-5 py-2.5 transition-all`}
            >
              <label
                className={`block text-[11px] font-bold ${
                  isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                } mb-0.5 tracking-wide`}
              >
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mhatre.nilesh@gmail.com"
                className={`w-full bg-transparent ${
                  isDarkMode
                    ? 'text-white placeholder:text-slate-500'
                    : 'text-slate-800 placeholder:text-slate-400/80'
                } text-xs sm:text-sm font-medium focus:outline-none`}
              />
            </div>

            {/* Password Field with Inset Neumorphic Groove & Eye Toggle */}
            <div
              className={`${
                isDarkMode ? 'neu-dark-groove-inset' : 'neu-groove-inset'
              } rounded-[22px] px-5 py-2.5 transition-all`}
            >
              <label
                className={`block text-[11px] font-bold ${
                  isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                } mb-0.5 tracking-wide`}
              >
                Password
              </label>
              <div className="flex items-center justify-between">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full bg-transparent ${
                    isDarkMode
                      ? 'text-white placeholder:text-slate-500'
                      : 'text-slate-800 placeholder:text-slate-400/80'
                  } text-xs sm:text-sm font-medium focus:outline-none font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className={`${
                    isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-500 hover:text-slate-800'
                  } transition p-1 ml-2 focus:outline-none select-none`}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <span
                      className="text-base select-none leading-none"
                      role="img"
                      aria-label="Show password"
                    >
                      👁️
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div
              className={`flex items-center justify-between text-xs px-1 pt-1 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`${
                    isDarkMode ? 'neu-dark-checkbox' : 'neu-checkbox'
                  } w-4 h-4 rounded-md`}
                />
                <span className="text-xs font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className={`text-xs font-semibold ${
                  isDarkMode
                    ? 'text-cyan-400 hover:text-cyan-300'
                    : 'text-blue-600 hover:text-blue-700'
                } hover:underline transition select-none`}
              >
                Forgot Password?
              </button>
            </div>

            {/* Raised LOGIN Button (Extruded Neumorphic Pill) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-[22px] ${
                isDarkMode
                  ? 'neu-dark-button-raised text-cyan-400 hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'neu-button-raised text-blue-600 hover:text-blue-700'
              } font-extrabold text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer select-none mt-5 active:scale-[0.99] disabled:opacity-60 shadow-sm`}
            >
              {isSubmitting ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-[32px] ${
              isDarkMode ? 'neu-dark-card text-slate-100' : 'neu-card text-slate-800'
            } p-6 relative`}
          >
            <button
              onClick={() => {
                setForgotModalOpen(false);
                setForgotSubmitted(false);
              }}
              className={`absolute top-5 right-5 p-1.5 rounded-full ${
                isDarkMode
                  ? 'neu-dark-circle-btn text-slate-400 hover:text-white'
                  : 'neu-circle-btn text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div
                className={`w-14 h-14 mx-auto rounded-full ${
                  isDarkMode ? 'neu-dark-badge-raised' : 'neu-badge-raised'
                } flex items-center justify-center text-2xl`}
              >
                🔑
              </div>
              <h3 className="text-lg font-bold">Password Recovery</h3>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                } leading-relaxed`}
              >
                For plant security, employee credentials are managed by the System Administrator.
              </p>

              {forgotSubmitted ? (
                <div
                  className={`p-3 rounded-xl ${
                    isDarkMode
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  } text-xs`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                  <span>
                    Request sent to <strong>armanhossain.eee.info@gmail.com</strong>. You will
                    receive reset instructions shortly.
                  </span>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div
                    className={`${
                      isDarkMode ? 'neu-dark-groove-inset' : 'neu-groove-inset'
                    } rounded-2xl px-4 py-2.5 text-left`}
                  >
                    <label
                      className={`block text-[10px] font-bold ${
                        isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                      } mb-0.5`}
                    >
                      Your Registered Email
                    </label>
                    <input
                      type="email"
                      defaultValue={email}
                      placeholder="employee@plant04.com"
                      className={`w-full bg-transparent text-xs ${
                        isDarkMode ? 'text-white' : 'text-slate-800'
                      } focus:outline-none`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotSubmitted(true)}
                    className={`w-full py-2.5 rounded-xl ${
                      isDarkMode
                        ? 'neu-dark-button-raised text-cyan-400'
                        : 'neu-button-raised text-blue-600'
                    } font-bold text-xs uppercase`}
                  >
                    Send Reset Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
