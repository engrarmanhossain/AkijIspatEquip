import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, CompanySettings } from '../types';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';

interface AuthContextType {
  currentUser: Employee | null;
  employees: Employee[];
  companySettings: CompanySettings;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean; // Manager / Assistant Manager (can add/delete equipment directly)
  isLowerManagement: boolean; // Lower level management (needs manager approval)
  isNonManagement: boolean;
  myProfileModalOpen: boolean;
  editEmployeeModalOpen: boolean;
  companySettingsModalOpen: boolean;
  targetEmployeeForEdit: Employee | null;

  // Actions
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateCompanySettings: (settings: Partial<CompanySettings>) => { success: boolean; error?: string };
  addEmployee: (data: Omit<Employee, 'id'>) => { success: boolean; error?: string };
  updateEmployee: (id: string, data: Partial<Employee>) => { success: boolean; error?: string };
  updateOwnProfile: (id: string, data: Partial<Employee>) => { success: boolean; error?: string };
  deleteEmployee: (id: string) => { success: boolean; error?: string };
  openMyProfileModal: () => void;
  closeMyProfileModal: () => void;
  openEditEmployeeModal: (employee: Employee | null) => void;
  closeEditEmployeeModal: () => void;
  openCompanySettingsModal: () => void;
  closeCompanySettingsModal: () => void;
  resetEmployeesToDefault: () => void;
}

const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'equipguard_current_user_v2',
  EMPLOYEES: 'equipguard_employees_v2',
  COMPANY_SETTINGS: 'equipguard_company_settings_v2',
};

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'EquipGuard Industrial',
  plantCode: 'PLANT 04 — MAIN FACILITY',
  logoUrl: '',
  tagline: 'Condition-Based Asset Intelligence & Maintenance Register',
  googleDriveFolderUrl: 'https://drive.google.com/drive/folders/1_EquipGuard_Plant04_Uploads',
  googleSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1_EquipGuard_Industrial_CMMS_DB',
  googleAppsScriptUrl: '',
  syncEnabled: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEYS.EMPLOYEES);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEYS.COMPANY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  });

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const found = INITIAL_EMPLOYEES.find((e) => e.email.toLowerCase() === parsed.email?.toLowerCase());
      return found || parsed;
    } catch {
      return null;
    }
  });

  const [myProfileModalOpen, setMyProfileModalOpen] = useState(false);
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false);
  const [companySettingsModalOpen, setCompanySettingsModalOpen] = useState(false);
  const [targetEmployeeForEdit, setTargetEmployeeForEdit] = useState<Employee | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to save employees to LocalStorage', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(companySettings));
    } catch (e) {
      console.warn('Failed to save company settings', e);
    }
  }, [companySettings]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn('Failed to save current user session', e);
    }
  }, [currentUser]);

  // Login
  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const matched = employees.find(
      (emp) => emp.email.toLowerCase() === cleanEmail && emp.password === cleanPassword
    );

    if (!matched) {
      return {
        success: false,
        error: 'Invalid email or password. Please verify your credentials and try again.',
      };
    }

    if (matched.status === 'Inactive') {
      return {
        success: false,
        error: 'This employee account has been deactivated. Please contact your Plant Administrator.',
      };
    }

    setCurrentUser(matched);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setMyProfileModalOpen(false);
    setEditEmployeeModalOpen(false);
    setCompanySettingsModalOpen(false);
  };

  // Company Name and Logo Update (Admin only)
  const updateCompanySettings = (settings: Partial<CompanySettings>): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only System Administrator can modify Company Name and Logo.' };
    }

    setCompanySettings((prev) => ({
      ...prev,
      ...settings,
    }));

    return { success: true };
  };

  // Add Employee (Admin only)
  const addEmployee = (data: Omit<Employee, 'id'>): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only Administrator can add employee profiles.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const emailExists = employees.some((e) => e.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return { success: false, error: `An employee profile with email ${cleanEmail} already exists.` };
    }

    const newId = `EMP-${Date.now().toString().slice(-5)}`;
    const newEmployee: Employee = {
      ...data,
      id: newId,
      email: cleanEmail,
      joinedDate: data.joinedDate || new Date().toISOString().slice(0, 10),
      status: data.status || 'Active',
      permissions: data.permissions || {
        canCreateWorkOrders: true,
        canApproveWorkOrders: data.role === 'manager' || data.role === 'admin',
        canEditEquipmentBaseline: data.role === 'manager' || data.role === 'admin',
        canManageEmployees: data.role === 'admin',
        canExportReports: data.role !== 'non_management',
        canSignOffMaintenance: data.role !== 'non_management',
        canAddEquipmentDirectly: data.role === 'manager' || data.role === 'admin',
        canDeleteEquipmentDirectly: data.role === 'manager' || data.role === 'admin',
      },
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    return { success: true };
  };

  // Update Employee (Admin only - full edit)
  const updateEmployee = (id: string, data: Partial<Employee>): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required to manage profiles.' };
    }

    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      const conflict = employees.some((e) => e.id !== id && e.email.toLowerCase() === cleanEmail);
      if (conflict) {
        return { success: false, error: `Email ${cleanEmail} is already assigned to another staff member.` };
      }
    }

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;
        const updated = {
          ...emp,
          ...data,
          email: data.email ? data.email.trim().toLowerCase() : emp.email,
        };
        if (currentUser && currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    return { success: true };
  };

  // Self Profile Update (EVERYONE can update their Profile Picture, Name, Phone, Dept, Bio, Emergency Contact!)
  // Non-admins CANNOT update Email, Password, or Designation
  const updateOwnProfile = (id: string, data: Partial<Employee>): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.id !== id) {
      return { success: false, error: 'You can only edit your own personal profile.' };
    }

    const sanitizedData: Partial<Employee> = {
      name: data.name,
      phone: data.phone,
      department: data.department,
      bio: data.bio,
      emergencyContact: data.emergencyContact,
      avatarUrl: data.avatarUrl, // Profile Picture upload for EVERYONE!
    };

    // If Admin, also permit editing email, password, and designation
    if (currentUser.role === 'admin') {
      if (data.email) sanitizedData.email = data.email.trim().toLowerCase();
      if (data.password) sanitizedData.password = data.password;
      if (data.designation) sanitizedData.designation = data.designation;
    }

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;
        const updated = { ...emp, ...sanitizedData };
        setCurrentUser(updated);
        return updated;
      })
    );

    return { success: true };
  };

  // Delete Employee (Admin only)
  const deleteEmployee = (id: string): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only Administrator can remove staff profiles.' };
    }

    const target = employees.find((e) => e.id === id);
    if (!target) return { success: false, error: 'Employee not found.' };

    if (target.email.toLowerCase() === 'armanhossain.eee.info@gmail.com') {
      return { success: false, error: 'Cannot delete the primary System Administrator profile.' };
    }

    setEmployees((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  };

  const openMyProfileModal = () => setMyProfileModalOpen(true);
  const closeMyProfileModal = () => setMyProfileModalOpen(false);

  const openEditEmployeeModal = (employee: Employee | null) => {
    setTargetEmployeeForEdit(employee);
    setEditEmployeeModalOpen(true);
  };
  const closeEditEmployeeModal = () => {
    setTargetEmployeeForEdit(null);
    setEditEmployeeModalOpen(false);
  };

  const openCompanySettingsModal = () => setCompanySettingsModalOpen(true);
  const closeCompanySettingsModal = () => setCompanySettingsModalOpen(false);

  const resetEmployeesToDefault = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setCompanySettings(DEFAULT_COMPANY_SETTINGS);
    localStorage.removeItem(AUTH_STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(AUTH_STORAGE_KEYS.COMPANY_SETTINGS);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        employees,
        companySettings,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isManager: currentUser?.role === 'manager' || currentUser?.role === 'admin',
        isLowerManagement: currentUser?.role === 'management',
        isNonManagement: currentUser?.role === 'non_management',
        myProfileModalOpen,
        editEmployeeModalOpen,
        companySettingsModalOpen,
        targetEmployeeForEdit,
        login,
        logout,
        updateCompanySettings,
        addEmployee,
        updateEmployee,
        updateOwnProfile,
        deleteEmployee,
        openMyProfileModal,
        closeMyProfileModal,
        openEditEmployeeModal,
        closeEditEmployeeModal,
        openCompanySettingsModal,
        closeCompanySettingsModal,
        resetEmployeesToDefault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
