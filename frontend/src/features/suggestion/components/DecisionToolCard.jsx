import { useState } from 'react';
import { Clock, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import useDecisionEngine from '../hooks/useDecisionEngine';

const HEALTH_PROFILES = [
  { id: 'general', label: 'General Public (No conditions)', icon: '🏃' },
  { id: 'asthma', label: 'Asthma & Respiratory issues', icon: '🌬️' },
  { id: 'heart', label: 'Heart & Cardiovascular conditions', icon: '❤️' },
  { id: 'child_elderly', label: 'Children / Elderly', icon: '👶' },
  { id: 'pregnant', label: 'Pregnant Women', icon: '🤰' },
];

const DecisionToolCard = ({ aqi = 1, isLoading = false, error = null }) => {
  const [profileId, setProfileId] = useState('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const recommendation = useDecisionEngine(aqi, profileId);

  const handleCheck = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasChecked(true);
    }, 850);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-12 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (error || !aqi) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-bold text-gray-900">Should I Go Outside?</h3>
      </div>

      <div className="space-y-4">
        {/* Profile Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Select Health Profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HEALTH_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  setProfileId(profile.id);
                  if (hasChecked) setHasChecked(false);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  profileId === profile.id
                    ? 'border-brand-500 bg-brand-50/50 text-brand-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                <span className="text-lg">{profile.icon}</span>
                <span>{profile.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Check Button or Analysis Status */}
        <div className="pt-2">
          {!hasChecked && !isAnalyzing ? (
            <button
              onClick={handleCheck}
              className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🏃‍♂️</span> Check Now
            </button>
          ) : isAnalyzing ? (
            <div className="flex items-center gap-3 bg-brand-50/50 border border-brand-100 rounded-xl p-4 text-brand-700 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              <span className="text-sm">Analyzing AQI data and health profile safety...</span>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-fade-in">
              {/* Header result strip */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100 ${recommendation.statusColor}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-75">Decision Recommendation</p>
                  <p className="text-2xl font-extrabold mt-0.5 tracking-tight">{recommendation.canGoOutside}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${recommendation.badgeColor} px-3 py-1 rounded-full uppercase`}>
                    AQI {aqi}
                  </span>
                </div>
              </div>

              {/* Actionable details */}
              <div className="p-4 bg-gray-50/40 space-y-4">
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                  {recommendation.advice}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Duration */}
                  <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                    <div className="p-2 rounded-lg bg-sky-50 text-sky-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Safe Duration</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{recommendation.duration}</p>
                    </div>
                  </div>

                  {/* Mask */}
                  <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                    <div className="p-2 rounded-lg bg-violet-50 text-violet-500">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mask Recommendation</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{recommendation.mask}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setHasChecked(false)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/70 px-4 py-2 rounded-lg transition-colors"
                  >
                    Change Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionToolCard;
