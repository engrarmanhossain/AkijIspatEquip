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
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Trash2,
} from 'lucide-react';
import type { Employee } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

export const MyProfileModal: React.FC = () => {
  const {
    currentUser,
    myProfileModalOpen,
    closeMyProfileModal,
    updateOwnProfile,
    isAdmin,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPassword(currentUser.password || '');
      setDesignation(currentUser.designation || '');
      setDepartment(currentUser.department || '');
      setPhone(currentUser.phone || '');
      setEmergencyContact(currentUser.emergencyContact || '');
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setStatusMessage(null);
    }
  }, [currentUser, myProfileModalOpen]);

  if (!myProfileModalOpen || !currentUser) return null;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Profile photo must be under 5MB.' });
        return;
      }
      try {
        const compressed = await compressImageFile(file, 480, 0.85);
        setAvatarUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const payload: Partial<Employee> = {
      name: name.trim(),
      phone: phone.trim(),
      department: department.trim(),
      emergencyContact: emergencyContact.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    };

    if (isAdmin) {
      payload.email = email.trim();
      payload.password = password.trim();
      payload.designation = designation.trim();
    }

    const res = updateOwnProfile(currentUser.id, payload);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Personal profile & photo updated successfully!' });
      setTimeout(() => {
        closeMyProfileModal();
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-cyan-600/20 overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">My Employee Profile</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                      : currentUser.role === 'manager'
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      : currentUser.role === 'management'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                      : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                  }`}
                >
                  {currentUser.role === 'manager' ? 'Manager' : currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Staff ID: <span className="font-mono text-cyan-300">{currentUser.employeeId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeMyProfileModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Alert / Notice */}
        {!isAdmin && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300/90 text-xs flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="leading-relaxed">
              <strong>Employee Self-Update:</strong> You have full permission to update your <strong>Profile Picture</strong>, contact phone, department, bio, and emergency details. Updating <strong>Email</strong>, <strong>Password</strong>, or <strong>Designation</strong> requires Administrator privileges.
            </p>
          </div>
        )}

        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {/* Profile Picture Uploader for EVERYONE */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Personal Profile Picture</span>
              </span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg text-slate-500">{initials}</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 cursor-pointer transition font-medium">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Profile Photo (PNG / JPG)</span>
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
          </div>

          {/* Row 1: Full Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Designation (Locked for non-admin) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold uppercase tracking-wider text-slate-400">
                  Official Designation
                </label>
                {!isAdmin && (
                  <span className="text-[10px] text-amber-400 flex items-center font-mono font-medium">
                    <Lock className="w-3 h-3 mr-1" /> Locked (Admin Only)
                  </span>
                )}
              </div>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-slate-200 ${
                    !isAdmin
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed select-none'
                      : 'bg-slate-950 border-slate-800 focus:border-cyan-500 focus:outline-none'
                  }`}
                  title={!isAdmin ? 'Designation is locked and can only be updated by Administrator' : ''}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email & Password (Locked for non-admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold uppercase tracking-wider text-slate-400">
                  Account Email
                </label>
                {!isAdmin && (
                  <span className="text-[10px] text-amber-400 flex items-center font-mono font-medium">
                    <Lock className="w-3 h-3 mr-1" /> Locked (Admin Only)
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-slate-200 ${
                    !isAdmin
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed select-none'
                      : 'bg-slate-950 border-slate-800 focus:border-cyan-500 focus:outline-none'
                  }`}
                  title={!isAdmin ? 'Email is locked and can only be updated by Administrator' : ''}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold uppercase tracking-wider text-slate-400">
                  Security Password
                </label>
                {!isAdmin && (
                  <span className="text-[10px] text-amber-400 flex items-center font-mono font-medium">
                    <Lock className="w-3 h-3 mr-1" /> Locked (Admin Only)
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={isAdmin ? 'text' : 'password'}
                  disabled={!isAdmin}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono text-slate-200 ${
                    !isAdmin
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 cursor-not-allowed select-none'
                      : 'bg-slate-950 border-slate-800 focus:border-cyan-500 focus:outline-none'
                  }`}
                  title={!isAdmin ? 'Password is locked and can only be changed by Administrator' : ''}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Department & Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Department / Operational Cell
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Emergency Contact */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Emergency Contact (Name & Phone)
            </label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. Spouse / Relative Name (+1 555-000-0000)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Row 5: Bio / Technical Specialization */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Specializations, Certifications & Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Certified Level II Thermographer, laser alignment specialist, slurry pump overhaul technician."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={closeMyProfileModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/30 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Profile & Photo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
