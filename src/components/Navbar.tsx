import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ShieldAlert,
  Wrench,
  ClipboardList,
  BarChart3,
  Flame,
  PlusCircle,
  Play,
  Pause,
  Clock,
  RotateCcw,
  Users,
  LogOut,
  User,
  ChevronDown,
  Building,
  FileCheck2,
  Settings,
  FolderGit2,
  FileSpreadsheet,
  ExternalLink,
  History,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenFaultModal: () => void }> = ({ onOpenFaultModal }) => {
  const {
    activeTab,
    setActiveTab,
    isSimulating,
    toggleSimulation,
    stats,
    equipmentRequests,
    openCreateWorkOrder,
    openEquipmentRequestModal,
    openAuditModal,
    resetAllDataToDefaults,
  } = useDashboard();

  const {
    currentUser,
    logout,
    openMyProfileModal,
    companySettings,
    openCompanySettingsModal,
    isAdmin,
    isManager,
  } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
          ' ' +
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    {
      id: 'health',
      label: 'Equipment Health',
      icon: ShieldAlert,
      badge: stats.criticalCount > 0 ? stats.criticalCount : undefined,
    },
    { id: 'troubleshoot', label: 'Troubleshoot & Diagnostics', icon: Wrench },
    { id: 'register', label: 'Maintenance Register', icon: ClipboardList },
    { id: 'analytics', label: 'Reliability KPIs', icon: BarChart3 },
    { id: 'employees', label: 'Staff Directory', icon: Users },
  ] as const;

  const initials = currentUser
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const pendingRequestsCount = equipmentRequests.filter((r) => r.status === 'Pending').length;

  return (
    <header className="sticky top-0 z-40 bg-[#0c1322]/90 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 shadow-2xl shadow-black/40">
      {/* Top Banner Bar */}
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-2 border-b border-slate-800/60 gap-3">
          {/* Logo & Plant Identity (Supports Dynamic Company Branding & Logo Change) */}
          <div className="flex items-center space-x-3 shrink-0 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 overflow-hidden shrink-0">
              {companySettings.logoUrl ? (
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.companyName}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Activity className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
                  {companySettings.companyName || 'EquipGuard'}
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{companySettings.plantCode || 'PLANT 04'}</span>
                </span>
                {isAdmin && (
                  <button
                    onClick={openCompanySettingsModal}
                    title="Change Company Name & Logo (Admin Permission)"
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block truncate max-w-xs">
                {companySettings.tagline || 'Industrial Health Telemetry & Maintenance Register'}
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Live Clock (Displayed on 2xl screens to avoid mobile/laptop overcrowding) */}
            <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs font-mono text-slate-300 whitespace-nowrap shrink-0 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime}</span>
            </div>

            {/* Quick Link: Google Drive Folder (if configured) */}
            {companySettings.googleDriveFolderUrl && (
              <a
                href={companySettings.googleDriveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Google Drive Cloud Storage (Photos & Work Proofs)"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-cyan-300 font-semibold transition whitespace-nowrap shrink-0 shadow-sm"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden xl:inline">Drive</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
              </a>
            )}

            {/* Quick Link: Google Spreadsheet Database (if configured) */}
            {companySettings.googleSpreadsheetUrl && (
              <a
                href={companySettings.googleSpreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Google Spreadsheet CMMS Database Ledger"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-emerald-300 font-semibold transition whitespace-nowrap shrink-0 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden xl:inline">Sheets DB</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
              </a>
            )}

            {/* Quick Link: GitHub Remote Auto-Sync Repository */}
            <a
              href="https://github.com/engrarmanhossain/AkijIspatEquip"
              target="_blank"
              rel="noopener noreferrer"
              title="View GitHub Repository & Auto-Sync Commits (main branch)"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 font-semibold transition whitespace-nowrap shrink-0 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden xl:inline">GitHub</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
            </a>

            {/* Approval Queue for Managers & Admin */}
            {(isManager || isAdmin) && (
              <button
                onClick={openEquipmentRequestModal}
                title="Review equipment addition & deletion approval requests"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition whitespace-nowrap shrink-0 shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden lg:inline">Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            {/* Simulation Status Pill */}
            <button
              onClick={toggleSimulation}
              title={isSimulating ? 'Pause telemetry stream simulation' : 'Start live telemetry stream simulation'}
              className={`hidden md:flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap shrink-0 ${
                isSimulating
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isSimulating && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isSimulating ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                ></span>
              </span>
              <span>{isSimulating ? 'Live' : 'Paused'}</span>
              {isSimulating ? <Pause className="w-3 h-3 ml-0.5" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Fault Simulator Trigger */}
            <button
              onClick={onOpenFaultModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-sm whitespace-nowrap shrink-0"
              title="Test real-world machine failures & watch alerts trigger"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <span className="hidden lg:inline">Simulator</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset all dashboard telemetry, work orders, and alerts back to default seed data?')) {
                  resetAllDataToDefaults();
                }
              }}
              title="Reset all demo data to baseline"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 transition hidden sm:block shrink-0 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* + New Work Order CTA */}
            <button
              onClick={() => openCreateWorkOrder()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 transition-all transform active:scale-95 whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Log Service</span>
            </button>

            {/* User Profile Pill & Dropdown (Supports Profile Picture Upload for Everyone) */}
            {currentUser && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition whitespace-nowrap shrink-0 shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ring-1 ring-white/10">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="text-left hidden xl:block pr-1 max-w-[130px]">
                    <span className="text-xs font-bold text-slate-200 block truncate leading-tight whitespace-nowrap">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 block leading-tight whitespace-nowrap">
                      {currentUser.role === 'admin'
                        ? 'Admin'
                        : currentUser.role === 'manager'
                        ? 'Manager'
                        : currentUser.role === 'management'
                        ? 'Management'
                        : 'Technician'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in space-y-1 text-xs">
                    <div className="p-2.5 border-b border-slate-800">
                      <span className="font-bold text-slate-100 block">{currentUser.name}</span>
                      <span className="text-[11px] text-slate-400 block font-mono truncate">{currentUser.email}</span>
                      <span className="text-[10px] text-cyan-400 block mt-0.5 line-clamp-1">
                        {currentUser.designation}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        openMyProfileModal();
                        setUserMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 flex items-center space-x-2 transition"
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>My Profile & Photo</span>
                    </button>

                    <button
                      onClick={() => {
                        openAuditModal();
                        setUserMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 flex items-center space-x-2 transition"
                    >
                      <History className="w-4 h-4 text-cyan-400" />
                      <span>Parameter Input Audit Log</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          openCompanySettingsModal();
                          setUserMenuOpen(false);
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-cyan-300 flex items-center space-x-2 transition font-medium"
                      >
                        <Building className="w-4 h-4 text-cyan-400" />
                        <span>Company & Cloud Settings (Admin)</span>
                      </button>
                    )}

                    {companySettings.googleSpreadsheetUrl && (
                      <a
                        href={companySettings.googleSpreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>Google Sheets Database</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    )}

                    {companySettings.googleDriveFolderUrl && (
                      <a
                        href={companySettings.googleDriveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <FolderGit2 className="w-4 h-4 text-cyan-400" />
                          <span>Google Drive Photos</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    )}

                    {(isManager || isAdmin) && (
                      <button
                        onClick={() => {
                          openEquipmentRequestModal();
                          setUserMenuOpen(false);
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <FileCheck2 className="w-4 h-4 text-blue-400" />
                          <span>Approval Queue</span>
                        </div>
                        {pendingRequestsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {pendingRequestsCount}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('employees');
                        setUserMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 flex items-center space-x-2 transition"
                    >
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Staff Directory</span>
                    </button>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-rose-950/40 text-rose-300 flex items-center space-x-2 transition font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modern Segmented Tab Navigation Bar */}
        <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
