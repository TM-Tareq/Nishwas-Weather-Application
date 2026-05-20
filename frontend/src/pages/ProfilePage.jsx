import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Briefcase, HeartPulse, ArrowRight, Leaf, Camera, Loader2, AlertCircle } from 'lucide-react';
import useAuthStore from '@/features/auth/store/authStore';
import useProfileStore from '@/features/profile/store/profileStore';
import usePhotoUpload from '@/features/profile/hooks/usePhotoUpload';
import Navbar from '@/components/organisms/Navbar';

const HEALTH_PROFILES = [
  { id: 'general',       icon: '🏃', label: 'General Public',       desc: 'No known health conditions' },
  { id: 'asthma',        icon: '🌬️', label: 'Asthma & Respiratory', desc: 'Asthma, COPD, or breathing issues' },
  { id: 'heart',         icon: '❤️', label: 'Heart & Cardiovascular', desc: 'Heart disease, hypertension' },
  { id: 'child_elderly', icon: '👶', label: 'Children / Elderly',    desc: 'Under 12 or over 65 years old' },
  { id: 'pregnant',      icon: '🤰', label: 'Pregnant Women',        desc: 'Currently pregnant' },
];

const OCCUPATIONS = [
  { id: 'indoor',  icon: '🏢', label: 'Office / Indoor',  desc: 'Work mostly indoors' },
  { id: 'outdoor', icon: '⛏️', label: 'Outdoor Worker',   desc: 'Construction, farming, delivery etc.' },
  { id: 'student', icon: '🎒', label: 'Student',          desc: 'School, college or university' },
  { id: 'other',   icon: '🔧', label: 'Other',            desc: 'Mixed or other occupation' },
];

// What each profile means in terms of AQI sensitivity
const PROFILE_IMPACT = {
  general:       { note: 'Standard recommendations apply. Most AQI levels are manageable with basic precautions.', color: 'text-brand-700 bg-brand-50 border-brand-100' },
  asthma:        { note: 'Stricter thresholds apply. Even moderate AQI may trigger symptoms — indoor days recommended more often.', color: 'text-orange-700 bg-orange-50 border-orange-100' },
  heart:         { note: 'Cardiovascular sensitivity means poor air days carry higher risk. Extra caution advised outdoors.', color: 'text-red-700 bg-red-50 border-red-100' },
  child_elderly: { note: 'Higher vulnerability to pollutants. Recommendations lean toward caution even at fair AQI levels.', color: 'text-amber-700 bg-amber-50 border-amber-100' },
  pregnant:      { note: 'Air quality affects both mother and baby. Recommendations err on the safe side for all AQI levels.', color: 'text-purple-700 bg-purple-50 border-purple-100' },
};

const OCCUPATION_IMPACT = {
  indoor:  'No outdoor exposure adjustment needed.',
  outdoor: 'Outdoor workers face significantly higher exposure — extra warnings and shorter safe durations will be shown.',
  student: 'School commutes and campus time are considered. Moderate AQI advice will include commute tips.',
  other:   'General outdoor exposure assumed.',
};

const SelectionCard = ({ item, isSelected, onSelect }) => (
  <button
    onClick={() => onSelect(item.id)}
    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
      isSelected
        ? 'border-brand-500 bg-brand-50 shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
    }`}
  >
    <span className="text-xl shrink-0">{item.icon}</span>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold ${isSelected ? 'text-brand-700' : 'text-gray-800'}`}>
        {item.label}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
    </div>
    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
      isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
    }`}>
      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  </button>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { healthProfile, occupation, photoUrl, setHealthProfile, setOccupation } = useProfileStore();
  const { uploading, error: uploadError, fileInputRef, openFilePicker, handleFileChange } = usePhotoUpload();
  const [saved, setSaved] = useState(false);

  const handleSelect = (setter, value) => {
    setter(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const profileImpact = PROFILE_IMPACT[healthProfile];
  const occupationImpact = OCCUPATION_IMPACT[occupation];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-5 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* User identity card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex items-center gap-4">
          {/* Avatar with upload button */}
          <div className="relative shrink-0 group">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-14 h-14 rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-md shadow-brand-100">
                <span className="text-2xl font-extrabold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Camera overlay */}
            <button
              onClick={openFilePicker}
              disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change photo"
            >
              {uploading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            <button
              onClick={openFilePicker}
              disabled={uploading}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-0.5 transition-colors"
            >
              {uploading ? 'Uploading…' : photoUrl ? 'Change photo' : 'Add profile photo'}
            </button>
            {uploadError && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                <p className="text-xs text-red-500">{uploadError}</p>
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full shrink-0">
            Member
          </span>
        </div>

        {/* Auto-save toast */}
        <div
          className={`flex items-center gap-2 text-sm font-medium mb-4 transition-all duration-300 ${
            saved ? 'text-brand-600 opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Saved automatically
        </div>

        {/* ── Health Profile ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-gray-900">Health Profile</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Personalizes the "Should I go outside?" recommendation based on your health sensitivity.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {HEALTH_PROFILES.map((profile) => (
              <SelectionCard
                key={profile.id}
                item={profile}
                isSelected={healthProfile === profile.id}
                onSelect={(v) => handleSelect(setHealthProfile, v)}
              />
            ))}
          </div>

          {/* Impact note */}
          <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${profileImpact.color}`}>
            <Leaf className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{profileImpact.note}</p>
          </div>
        </div>

        {/* ── Occupation ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-gray-900">Occupation Type</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Outdoor workers spend more time in polluted air — this adjusts safe duration and mask advice.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {OCCUPATIONS.map((occ) => (
              <SelectionCard
                key={occ.id}
                item={occ}
                isSelected={occupation === occ.id}
                onSelect={(v) => handleSelect(setOccupation, v)}
              />
            ))}
          </div>

          {/* Impact note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">{occupationImpact}</p>
          </div>
        </div>

        {/* ── Go to Outdoor Check CTA ───────────────────────────────── */}
        <button
          onClick={() => navigate('/outdoor')}
          className="w-full flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-2xl px-5 py-4 shadow-md shadow-brand-100 transition-all hover:shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div className="text-left">
              <p className="font-bold text-sm">See My Outdoor Recommendation</p>
              <p className="text-xs text-white/75">Based on current AQI + your profile</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>
    </div>
  );
};

export default ProfilePage;
