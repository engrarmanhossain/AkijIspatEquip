import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { EquipmentHealthTab } from './components/EquipmentHealthTab';
import { TroubleshootTab } from './components/TroubleshootTab';
import { MaintenanceRegisterTab } from './components/MaintenanceRegisterTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { EmployeesTab } from './components/EmployeesTab';
import { FaultInjectorModal } from './components/FaultInjectorModal';
import { WorkOrderModal } from './components/WorkOrderModal';
import { MyProfileModal } from './components/MyProfileModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { AddEquipmentModal } from './components/AddEquipmentModal';
import { WorkUpdateModal } from './components/WorkUpdateModal';
import { EquipmentRequestsModal } from './components/EquipmentRequestsModal';
import { Shield, Cpu, Activity } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { activeTab } = useDashboard();
  const { isAuthenticated } = useAuth();
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Sticky Navigation Bar */}
      <div>
        <Navbar onOpenFaultModal={() => setIsFaultModalOpen(true)} />

        {/* Main Workspace Container */}
        <main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'health' && (
            <EquipmentHealthTab onOpenFaultModal={() => setIsFaultModalOpen(true)} />
          )}
          {activeTab === 'troubleshoot' && <TroubleshootTab />}
          {activeTab === 'register' && <MaintenanceRegisterTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'employees' && <EmployeesTab />}
        </main>
      </div>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-300 font-mono tracking-tight">EquipGuard v2.4</span>
            <span className="text-slate-500">|</span>
            <span>Condition-Based Monitoring & Maintenance Register</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-cyan-400" /> ISO 55001 Asset Management
            </span>
            <span className="flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Telemetry Frequency: 2.8s
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <FaultInjectorModal
        isOpen={isFaultModalOpen}
        onClose={() => setIsFaultModalOpen(false)}
      />
      <WorkOrderModal />
      <MyProfileModal />
      <EditEmployeeModal />
      <CompanySettingsModal />
      <AddEquipmentModal />
      <WorkUpdateModal />
      <EquipmentRequestsModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AuthProvider>
  );
}
