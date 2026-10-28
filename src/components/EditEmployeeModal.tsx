import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  Mail,
  Lock,
  Briefcase,
  Phone,
  Building,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import type { Employee, UserRole, EmployeePermissions } from '../types';

export const EditEmployeeModal: React.FC = () => {
  const {
    editEmployeeModalOpen,
    targetEmployeeForEdit,
    closeEditEmployeeModal,
    addEmployee,
    updateEmployee,
  } = useAuth();

  const isCreating = !targetEmployeeForEdit;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<UserRole>('non_management');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [permissions, setPermissions] = useState<EmployeePermissions>({
    canCreateWorkOrders: true,
    canApproveWorkOrders: false,
    canEditEquipmentBaseline: false,
    canManageEmployees: false,
    canExportReports: false,
    canSignOffMaintenance: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (targetEmployeeForEdit) {
      setName(targetEmployeeForEdit.name || '');
      setEmail(targetEmployeeForEdit.email || '');
      setPassword(targetEmployeeForEdit.password || '');
      setDesignation(targetEmployeeForEdit.designation || '');
      setRole(targetEmployeeForEdit.role || 'non_management');
      setDepartment(targetEmployeeForEdit.department || '');
      setPhone(targetEmployeeForEdit.phone || '');
      setEmployeeId(targetEmployeeForEdit.employeeId || '');
      setStatus(targetEmployeeForEdit.status || 'Active');
      setBio(targetEmployeeForEdit.bio || '');
      setAvatarUrl(targetEmployeeForEdit.avatarUrl || '');
      setEmergencyContact(targetEmployeeForEdit.emergencyContact || '');
      setPermissions(
        targetEmployeeForEdit.permissions || {
          canCreateWorkOrders: true,
          canApproveWorkOrders: targetEmployeeForEdit.role === 'management',
          canEditEquipmentBaseline: targetEmployeeForEdit.role === 'management',
          canManageEmployees: targetEmployeeForEdit.role === 'admin',
          canExportReports: targetEmployeeForEdit.role !== 'non_management',
          canSignOffMaintenance: targetEmployeeForEdit.role !== 'non_management',
        }
      );
      setErrorMessage(null);
    } else {
      // Defaults for new employee
      setName('');
      setEmail('');
      setPassword('plant2026**');
      setDesignation('');
      setRole('non_management');
      setDepartment('Maintenance Operations');
      setPhone('+1 (555) 000-0000');
      setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
      setStatus('Active');
      setBio('');
      setAvatarUrl('');
      setEmergencyContact('');
      setPermissions({
        canCreateWorkOrders: true,
        canApproveWorkOrders: false,
        canEditEquipmentBaseline: false,
        canManageEmployees: false,
        canExportReports: false,
        canSignOffMaintenance: false,
      });
      setErrorMessage(null);
    }
  }, [targetEmployeeForEdit, editEmployeeModalOpen]);

  // Adjust default permissions when role is changed in create mode
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (isCreating) {
      setPermissions({
        canCreateWorkOrders: true,
        canApproveWorkOrders: newRole === 'management' || newRole === 'admin',
        canEditEquipmentBaseline: newRole === 'management' || newRole === 'admin',
        canManageEmployees: newRole === 'admin',
        canExportReports: newRole === 'management' || newRole === 'admin',
        canSignOffMaintenance: newRole === 'management' || newRole === 'admin',
      });
    }
  };

  const togglePermission = (key: keyof EmployeePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Profile photo must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!editEmployeeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !designation.trim()) {
      setErrorMessage('Please fill in Full Name, Email, and Official Designation.');
      return;
    }

    if (isCreating) {
      const res = addEmployee({
        employeeId: employeeId.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || 'plant2026**',
        designation: designation.trim(),
        role,
        department: department.trim(),
        phone: phone.trim(),
        joinedDate: new Date().toISOString().slice(0, 10),
        status,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        emergencyContact: emergencyContact.trim(),
        permissions,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create employee profile.');
        return;
      }
    } else {
      const res = updateEmployee(targetEmployeeForEdit.id, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        designation: designation.trim(),
        role,
        department: department.trim(),
        phone: phone.trim(),
        employeeId: employeeId.trim(),
        status,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        emergencyContact: emergencyContact.trim(),
        permissions,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update employee profile.');
        return;
      }
    }

    closeEditEmployeeModal();
  };

  const initials = name
    ? name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'EMP'
    : 'EMP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden shrink-0 border border-cyan-500/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name || 'Employee'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{initials}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {isCreating ? 'Add Employee Profile (Admin)' : `Edit Profile: ${name || 'Staff'}`}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage profile picture, credentials, role hierarchy, and equipment maintenance permissions.
              </p>
            </div>
          </div>
          <button
            onClick={closeEditEmployeeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[72vh] overflow-y-auto">
          {/* Profile Picture Uploader (Admin Add / Remove Option) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Employee Profile Picture (Admin Add / Remove)</span>
              </span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center space-x-1.5 bg-rose-950/50 hover:bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-800/50 transition shadow-sm"
                  title="Remove employee profile picture"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Picture</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg text-slate-500">{initials}</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 cursor-pointer transition font-medium">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>{avatarUrl ? 'Change Profile Picture' : 'Upload Profile Picture'} (PNG / JPG / WebP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-600 font-mono text-[11px]"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              As Administrator, you have full authority to upload, update, or remove profile pictures for all staff members.
            </p>
          </div>

          {/* Row 1: Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Official Designation *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Lead Mechanical Supervisor"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Login Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@plant04.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Access Password *
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure password"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 3: Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Employee Tier / Role *
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-semibold text-cyan-400"
              >
                <option value="non_management">Non-Management (Technician/Operator)</option>
                <option value="management">Management (Supervisor/Engineer)</option>
                <option value="admin">Administrator (Full Control)</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Mechanical Reliability"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Staff Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Active">Active Duty</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Deactivated / Inactive</option>
              </select>
            </div>
          </div>

          {/* Row 4: Phone & Employee ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Employee Identification Code
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-1045"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 5: Emergency Contact & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name & Contact number"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Certifications / Skills
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. ISO Cat II Vibration, MLT-1"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Admin Permissions Matrix Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
              Granular System Permissions (Admin Configurable)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canCreateWorkOrders}
                  onChange={() => togglePermission('canCreateWorkOrders')}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Can Create Maintenance Work Orders</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canApproveWorkOrders}
                  onChange={() => togglePermission('canApproveWorkOrders')}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Can Approve & Schedule Work Orders</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canSignOffMaintenance}
                  onChange={() => togglePermission('canSignOffMaintenance')}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Can Sign-Off Completed Repairs</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canEditEquipmentBaseline}
                  onChange={() => togglePermission('canEditEquipmentBaseline')}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Can Calibrate Telemetry Baselines</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canExportReports}
                  onChange={() => togglePermission('canExportReports')}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Can Export Register CSV & JSON Logs</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canManageEmployees}
                  onChange={() => togglePermission('canManageEmployees')}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Can Manage Employee Directory</span>
              </label>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={closeEditEmployeeModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/30 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCreating ? 'Create Staff Profile' : 'Update Profile & Rights'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
