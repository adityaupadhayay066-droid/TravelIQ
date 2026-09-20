import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit3, Camera, Trash2, Save, X, Calendar, TrendingUp, DollarSign, Clock, FileText, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getBackendBaseURL } from '../utils/api';
import toast from 'react-hot-toast';

const API_BASE = getBackendBaseURL();

function AvatarUpload({ profileImage, onUpload, onRemove }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Type validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      return toast.error('Only JPG, PNG, and WEBP files are allowed');
    }
    
    // Size validation
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5MB');
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    toast.success('Preview loaded! Click Upload to save.');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', selectedFile);
    try {
      console.log('[Frontend] Uploading avatar image...');
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(data.profile_image);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Avatar updated successfully!');
    } catch (err) {
      console.error('[Frontend] Avatar upload failed:', err);
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const getAvatarUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${API_BASE}${img}`;
  };

  return (
    <div className="relative group flex flex-col items-center gap-3">
      <div
        className={`w-28 h-28 rounded-xl overflow-hidden border-2 transition-all duration-300 relative ${dragOver ? 'border-[#173F3A] dark:border-[#EEF2ED] scale-105' : 'border-[#E3DED2] dark:border-[#2A403A] group-hover:border-[#173F3A]/50 dark:group-hover:border-[#EEF2ED]/50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
      >
        {previewUrl || profileImage ? (
          <img src={previewUrl || getAvatarUrl(profileImage)} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center">
            <User className="w-12 h-12 text-[#173F3A] dark:text-[#EEF2ED]" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-[#263238]/60 flex items-center justify-center rounded-xl">
            <Loader2 className="w-6 h-6 text-[#FFFFFF] animate-spin" />
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {!previewUrl ? (
          <button 
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 bg-[#173F3A] hover:bg-[#0F332F] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" /> Choose Image
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button 
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1.5 bg-[#4F7D62] text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer"
            >
              Upload
            </button>
            <button 
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="px-3 py-1.5 bg-[#E3DED2] dark:bg-[#2A403A] text-[#263238] dark:text-[#F7F5EF] rounded-lg text-xs font-semibold hover:bg-[#D4CEBF] dark:hover:bg-[#1B2C28] transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
        {profileImage && !previewUrl && (
          <button 
            type="button"
            onClick={onRemove}
            className="p-1.5 bg-[#B94A48]/10 text-[#B94A48] hover:bg-[#B94A48] hover:text-white rounded-lg transition-all cursor-pointer"
            title="Remove Avatar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-all shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
      <div className={`p-2.5 rounded-xl bg-[#EEF2ED] dark:bg-[#213530]`}>
        <Icon className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
      </div>
      <div>
        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-[#263238] dark:text-[#F7F5EF]">{value}</p>
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bio: '', location: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/profile');
      setProfile(data);
      setForm({ name: data.name || '', phone: data.phone || '', bio: data.bio || '', location: data.location || '' });
    } catch {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/profile', form);
      setProfile(prev => ({ ...prev, ...data.user }));
      updateUser({ name: form.name });
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleAvatarUpload = (imageUrl) => {
    setProfile(prev => ({ ...prev, profile_image: imageUrl }));
    updateUser({ profile_image: imageUrl });
  };

  const handleAvatarRemove = async () => {
    try {
      await api.delete('/profile/avatar');
      setProfile(prev => ({ ...prev, profile_image: null }));
      updateUser({ profile_image: null });
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F5EF] dark:bg-[#12201D]">
        <div className="space-y-4 w-full max-w-2xl px-6">
          {[1,2,3].map(i => <div key={i} className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 animate-pulse shadow-sm"><div className="h-6 bg-[#E3DED2] dark:bg-[#2A403A] rounded w-1/3 mb-3" /><div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-2/3" /></div>)}
        </div>
      </div>
    );
  }

  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A';

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Profile Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl overflow-hidden relative shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
          {/* Banner */}
          <div className="h-32 bg-[#EEF2ED] dark:bg-[#213530] border-b border-[#E3DED2] dark:border-[#2A403A] relative">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjA1KSIvPjwvc3ZnPg==')]" />
          </div>

          {/* Profile info */}
          <div className="px-6 pb-6 -mt-14 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <AvatarUpload
                profileImage={profile?.profile_image}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
              />
              <div className="flex-1 mt-2 sm:mt-0 sm:mb-1">
                <h1 className="text-2xl font-bold text-[#173F3A] dark:text-[#EEF2ED]">{profile?.name}</h1>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {profile?.email}
                </p>
                {profile?.location && (
                  <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </p>
                )}
              </div>
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-2 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#263238] dark:text-[#F7F5EF] px-4 py-2 rounded-lg text-sm font-medium transition-all">
                {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {profile?.bio && !editing && (
              <p className="text-[#263238] dark:text-[#A3B0AB] text-sm mt-4 leading-relaxed max-w-xl">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#66736F] dark:text-[#A3B0AB]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Member since {memberSince}</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#4F7D62]" /> Account {profile?.account_status || 'active'}</span>
            </div>
          </div>
        </motion.div>

        {/* Edit Form */}
        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 space-y-4 overflow-hidden shadow-sm">
              <h3 className="text-[#173F3A] dark:text-[#EEF2ED] font-semibold flex items-center gap-2"><Edit3 className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" /> Edit Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest mb-1 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-[#263238] dark:text-[#F7F5EF] text-sm focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest mb-1 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-[#263238] dark:text-[#F7F5EF] text-sm focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest mb-1 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                    <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., New Delhi, India"
                      className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest mb-1 block">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={500} placeholder="Tell us about yourself..."
                  className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 px-4 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] resize-none focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
                <p className="text-right text-[10px] text-[#66736F] dark:text-[#A3B0AB] mt-1">{form.bio.length}/500</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-[#66736F] dark:text-[#A3B0AB] text-sm hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-[#D96C4F] hover:bg-[#C75D43] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Trips" value={profile?.stats?.total_trips || 0} delay={0.1} />
          <StatCard icon={FileText} label="Bookings" value={profile?.stats?.total_bookings || 0} delay={0.15} />
          <StatCard icon={DollarSign} label="Money Saved" value={`₹${(profile?.stats?.money_saved || 0).toLocaleString()}`} delay={0.2} />
          <StatCard icon={Clock} label="Time Saved" value={`${profile?.stats?.time_saved || 0}h`} delay={0.25} />
        </div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl divide-y divide-[#E3DED2] dark:divide-[#2A403A] shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
          {[
            { label: 'My Trips', desc: 'View your travel history', href: '/dashboard/my-trips', icon: TrendingUp },
            { label: 'Account Settings', desc: 'Password, theme, security', href: '/dashboard/settings', icon: Shield },
          ].map((item, i) => (
            <a key={i} href={item.href} className="flex items-center justify-between p-4 hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-colors group rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center group-hover:bg-[#173F3A]/10 dark:group-hover:bg-[#EEF2ED]/10 transition-colors">
                  <item.icon className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                </div>
                <div>
                  <p className="text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">{item.label}</p>
                  <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB] group-hover:text-[#173F3A] dark:group-hover:text-[#EEF2ED] group-hover:translate-x-1 transition-all" />
            </a>
          ))}
        </motion.div>

      </div>
    </div>
  );
}

