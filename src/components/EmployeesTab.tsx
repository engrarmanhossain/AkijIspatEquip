import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Shield,
  ShieldCheck,
  Briefcase,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  Lock,
  CheckCircle2,
  Calendar,
  KeyRound,
  UserCheck,
  Camera,
  Upload,
} from 'lucide-react';
import type { Employee, UserRole } from '../types';

export const EmployeesTab: React.FC = () => {
  const {
    employees,
    currentUser,
    isAdmin,
    openEditEmployeeModal,
    openMyProfileModal,
    deleteEmployee,
    updateEmployee,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const handlePhotoUpload = (empId: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile photo must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateEmployee(empId, { avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Filtered list
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q);

    const matchRole = roleFilter === 'All' || emp.role === roleFilter;
    const matchStatus = statusFilter === 'All' || emp.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  const totalStaff = employees.length;
  const executiveManagerCount = employees.filter((e) => e.role === 'manager' || e.role === 'admin').length;
  const managementCount = employees.filter((e) => e.role === 'management').length;
  const nonManagementCount = employees.filter((e) => e.role === 'non_management').length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            System Admin
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Plant Manager
          </span>
        );
      case 'management':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Junior Management
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Non-Management
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Plant Staff Directory & Access Permissions</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Role-Based Access Control (RBAC): Management oversight, Non-Management field technicians, and System Administration.
            </p>
          </div>

          {/* Admin CTA */}
          {isAdmin ? (
            <button
              onClick={() => openEditEmployeeModal(null)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center space-x-2 self-start lg:self-auto transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Employee Profile</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Only Administrator can add or reassign staff roles</span>
            </div>
          )}
        </div>

        {/* Tally Metrics */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Monitored Staff</span>
            <span className="text-2xl font-extrabold font-mono text-white mt-0.5 block">{totalStaff}</span>
            <span className="text-[11px] text-slate-400">Plant 04 Operations & Maintenance</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Managers & Leadership</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-300 mt-0.5 block">
              {executiveManagerCount}
            </span>
            <span className="text-[11px] text-slate-400">Direct Equipment Authority</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Junior Staff & Techs</span>
            <span className="text-2xl font-extrabold font-mono text-amber-300 mt-0.5 block">
              {managementCount + nonManagementCount}
            </span>
            <span className="text-[11px] text-slate-400">
              {managementCount} Junior Supervisors • {nonManagementCount} Field Techs
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, designation..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none placeholder:text-slate-500 text-xs"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs"
            >
              <option value="All">All Staff Tiers</option>
              <option value="admin">System Administrator</option>
              <option value="manager">Plant Manager (Direct Authority)</option>
              <option value="management">Junior Management (Approval Req.)</option>
              <option value="non_management">Non-Management (Technicians)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Duty</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const isCurrentUser = currentUser?.id === emp.id;
          return (
            <div
              key={emp.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xl relative ${
                isCurrentUser
                  ? 'bg-slate-900/90 border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Avatar (Photo or Initials), Name, Role */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-sm overflow-hidden shrink-0 relative group">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        emp.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      )}

                      {isAdmin && (
                        <label
                          title="Admin: Click to upload or change profile photo"
                          className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white"
                        >
                          <Camera className="w-4 h-4 text-cyan-300" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(emp.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="text-sm font-bold text-white line-clamp-1">{emp.name}</h3>
                        {isCurrentUser && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-cyan-400 block">
                        {emp.employeeId}
                      </span>

                      {/* Admin Quick Profile Picture Actions */}
                      {isAdmin && (
                        <div className="flex items-center space-x-2 mt-1 text-[10px]">
                          <label
                            title="Admin: Upload employee profile picture"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer font-medium hover:underline"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{emp.avatarUrl ? 'Change Photo' : '+ Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(emp.id, file);
                              }}
                            />
                          </label>

                          {emp.avatarUrl && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Remove profile picture for ${emp.name}?`)) {
                                  updateEmployee(emp.id, { avatarUrl: '' });
                                }
                              }}
                              title="Admin: Remove employee profile picture"
                              className="text-rose-400 hover:text-rose-300 flex items-center space-x-0.5 font-medium hover:underline"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {getRoleBadge(emp.role)}
                </div>

                {/* Designation & Department */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-200 flex items-center">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-cyan-400 shrink-0" />
                    <span className="line-clamp-1">{emp.designation}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                    <span className="line-clamp-1">{emp.department}</span>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center text-slate-300 truncate">
                    <Mail className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Phone className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                </div>

                {/* Bio / Skills */}
                {emp.bio && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {emp.bio}
                  </p>
                )}

                {/* Permissions Badges */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {emp.permissions.canCreateWorkOrders && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Work Orders</span>
                  )}
                  {emp.permissions.canApproveWorkOrders && (
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300">Approvals</span>
                  )}
                  {emp.permissions.canSignOffMaintenance && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">Sign-Off</span>
                  )}
                  {emp.permissions.canManageEmployees && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">Admin Directory</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => openEditEmployeeModal(emp)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center space-x-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Profile & Rights</span>
                    </button>

                    {emp.email.toLowerCase() !== 'armanhossain.eee.info@gmail.com' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete profile for ${emp.name}?`)) {
                            deleteEmployee(emp.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 transition"
                        title="Delete staff record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : isCurrentUser ? (
                  <button
                    onClick={openMyProfileModal}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit My Profile</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Joined {emp.joinedDate}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
