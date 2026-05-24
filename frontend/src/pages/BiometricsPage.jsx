import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Activity, User, BookHeart, Leaf, Camera, Loader2,
  AlertCircle, CheckCircle2, Clock, ShieldAlert, XCircle,
  AlertTriangle, Sparkles, CalendarDays,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import useAuthStore    from '@/features/auth/store/authStore';
import useProfileStore from '@/features/profile/store/profileStore';
import usePhotoUpload  from '@/features/profile/hooks/usePhotoUpload';
import useGeolocation  from '@/hooks/useGeolocation';
import useAirQuality   from '@/features/weather/hooks/useAirQuality';
import { useMyDiary }  from '@/features/diary/hooks/useMyDiary';
import { useLogEntry } from '@/features/diary/hooks/useLogEntry';
import { fetchTodayEntry } from '@/features/diary/api/diaryApi';

//  AQI meta
const AQI_META = {
  1: { label: 'Good',     text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  2: { label: 'Fair',     text: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30'   },
  3: { label: 'Moderate', text: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30'   },
  4: { label: 'Poor',     text: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30'         },
  5: { label: 'Very Poor',text: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/30'   },
};

// Returns verdictKey ('yes'|'caution'|'avoid'|'no') and reasonKey for i18n
const getBioVulnerabilityVerdict = (aqi = 1, humidity = 60, windSpeed = 3, profileId = 'general') => {
  const humidityRisk = humidity > 85;
  const highWind     = windSpeed > 8;

  if (profileId === 'asthma') {
    if (humidityRisk && aqi >= 3) return { verdictKey: 'avoid', reasonKey: 'asthmaHumid',  color: 'text-red-400',    icon: ShieldAlert  };
    if (aqi >= 4)                 return { verdictKey: 'no',    reasonKey: 'asthmaHighAqi', color: 'text-purple-400', icon: XCircle      };
    if (aqi >= 3)                 return { verdictKey: 'caution',reasonKey: 'asthmaModAqi', color: 'text-orange-400', icon: AlertTriangle };
  }
  if (profileId === 'heart') {
    if (aqi >= 3)                     return { verdictKey: 'avoid',   reasonKey: 'heartHighAqi', color: 'text-red-400',    icon: ShieldAlert  };
    if (aqi >= 2 && !highWind)        return { verdictKey: 'caution', reasonKey: 'heartLowWind', color: 'text-orange-400', icon: AlertTriangle };
  }
  if (profileId === 'child_elderly') {
    if (aqi >= 3) return { verdictKey: 'avoid',   reasonKey: 'childHighAqi', color: 'text-red-400',    icon: ShieldAlert  };
    if (aqi >= 2) return { verdictKey: 'caution', reasonKey: 'childModAqi',  color: 'text-yellow-400', icon: AlertTriangle };
  }
  if (profileId === 'pregnant') {
    if (aqi >= 3) return { verdictKey: 'avoid',   reasonKey: 'pregnantHighAqi', color: 'text-red-400',    icon: ShieldAlert  };
    if (aqi >= 2) return { verdictKey: 'caution', reasonKey: 'pregnantModAqi',  color: 'text-yellow-400', icon: AlertTriangle };
  }
  if (aqi >= 5) return { verdictKey: 'no',      reasonKey: 'generalVeryPoor', color: 'text-purple-400', icon: XCircle      };
  if (aqi >= 4) return { verdictKey: 'avoid',   reasonKey: 'generalPoor',     color: 'text-red-400',    icon: ShieldAlert  };
  if (aqi >= 3) return { verdictKey: 'caution', reasonKey: 'generalModerate', color: 'text-orange-400', icon: AlertTriangle };
  if (aqi >= 2) return { verdictKey: 'yes',     reasonKey: 'generalFair',     color: 'text-yellow-400', icon: CheckCircle2 };
  return             { verdictKey: 'yes',     reasonKey: 'generalGood',     color: 'text-emerald-400', icon: CheckCircle2 };
};

// Returns biometrics.outdoor.* key suffix
const getDuration = (aqi, profileId) => {
  const sensitive = ['asthma', 'heart', 'child_elderly', 'pregnant'].includes(profileId);
  if (aqi >= 5) return 'stayIndoors';
  if (aqi >= 4) return sensitive ? 'avoidMax10'  : 'dur3045lim';
  if (aqi >= 3) return sensitive ? 'dur3045max'  : 'dur3h';
  if (aqi >= 2) return sensitive ? 'dur2h'       : 'durFree';
  return 'durFree';
};

const getMask = (aqi, profileId) => {
  const sensitive = ['asthma', 'heart', 'child_elderly', 'pregnant'].includes(profileId);
  if (aqi >= 4) return 'maskN95';
  if (aqi >= 3) return sensitive ? 'maskN95rec' : 'maskStandard';
  if (aqi >= 2) return sensitive ? 'maskCarry'  : 'maskNone';
  return 'maskNone';
};

//  Static data
const HEALTH_PROFILES = [
  { id: 'general',       icon: '🏃' },
  { id: 'asthma',        icon: '🌬️' },
  { id: 'heart',         icon: '❤️' },
  { id: 'child_elderly', icon: '👶' },
  { id: 'pregnant',      icon: '🤰' },
];

const OCCUPATIONS = [
  { id: 'indoor',  icon: '🏢' },
  { id: 'outdoor', icon: '⛏️' },
  { id: 'student', icon: '🎒' },
  { id: 'other',   icon: '🔧' },
];

const FEELINGS = [
  { key: 'GOOD',   emoji: '😊', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { key: 'OKAY',   emoji: '😐', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'   },
  { key: 'UNWELL', emoji: '😷', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400'   },
  { key: 'SICK',   emoji: '🤒', color: 'border-red-500/40 bg-red-500/10 text-red-400'            },
];

const SYMPTOMS = [
  'Cough', 'Runny Nose', 'Headache', 'Eye Irritation',
  'Chest Tightness', 'Fatigue', 'Shortness of Breath', 'Throat Irritation',
];

const SYMPTOM_KEYS = {
  'Cough': 'cough', 'Runny Nose': 'runnyNose', 'Headache': 'headache',
  'Eye Irritation': 'eyeIrritation', 'Chest Tightness': 'chestTightness',
  'Fatigue': 'fatigue', 'Shortness of Breath': 'shortnessOfBreath',
  'Throat Irritation': 'throatIrritation',
};

const AQI_THRESH = [
  { level: 1, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { level: 2, color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'   },
  { level: 3, color: 'border-orange-500/40 bg-orange-500/10 text-orange-400'   },
  { level: 4, color: 'border-red-500/40 bg-red-500/10 text-red-400'            },
  { level: 5, color: 'border-purple-500/40 bg-purple-500/10 text-purple-400'   },
];

//  Tab: Profile
const ProfileTab = ({ user, photoUrl, uploading, uploadError, openFilePicker, handleFileChange, fileInputRef }) => {
  const { t } = useTranslation();
  const { healthProfile, occupation, aqiThreshold, setHealthProfile, setOccupation, setAqiThreshold } = useProfileStore();
  const [saved, setSaved] = useState(false);

  const handleSelect = (setter, value) => {
    setter(value); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="relative shrink-0 group">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-2xl font-extrabold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <button onClick={openFilePicker} disabled={uploading}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{user?.name}</p>
          <p className="text-sm text-white/40 truncate">{user?.email}</p>
          <button onClick={openFilePicker} disabled={uploading} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium mt-0.5">
            {uploading ? t('biometrics.profile.uploading') : photoUrl ? t('biometrics.profile.changePhoto') : t('biometrics.profile.addPhoto')}
          </button>
          {uploadError && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{uploadError}</p>}
        </div>
        <span className="text-xs font-bold text-emerald-400 glass-accent px-3 py-1 rounded-full">{t('biometrics.profile.member')}</span>
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> {t('biometrics.profile.saved')}
        </div>
      )}

      {/* Health profile */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-1">{t('biometrics.profile.healthProfile')}</h3>
        <p className="text-xs text-white/30 mb-4">{t('biometrics.profile.healthDesc')}</p>
        <div className="flex flex-col gap-2">
          {HEALTH_PROFILES.map(p => (
            <button key={p.id} onClick={() => handleSelect(setHealthProfile, p.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                healthProfile === p.id ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/8 hover:border-white/15 hover:bg-white/5'
              }`}>
              <span className="text-xl shrink-0">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${healthProfile === p.id ? 'text-emerald-400' : 'text-white'}`}>{t(`biometrics.hp.${p.id}_label`)}</p>
                <p className="text-xs text-white/30 mt-0.5">{t(`biometrics.hp.${p.id}_desc`)}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${healthProfile === p.id ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}`}>
                {healthProfile === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Occupation */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-1">{t('biometrics.profile.occupation')}</h3>
        <p className="text-xs text-white/30 mb-4">{t('biometrics.profile.occupationDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          {OCCUPATIONS.map(o => (
            <button key={o.id} onClick={() => handleSelect(setOccupation, o.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all text-left ${
                occupation === o.id ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/8 hover:border-white/15 hover:bg-white/5'
              }`}>
              <span className="text-lg">{o.icon}</span>
              <div>
                <p className={`text-xs font-bold ${occupation === o.id ? 'text-emerald-400' : 'text-white'}`}>{t(`biometrics.occ.${o.id}_label`)}</p>
                <p className="text-[10px] text-white/30">{t(`biometrics.occ.${o.id}_desc`)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AQI threshold */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-1">{t('biometrics.profile.aqiThreshold')}</h3>
        <p className="text-xs text-white/30 mb-4">{t('biometrics.profile.aqiThresholdDesc')}</p>
        <div className="flex flex-wrap gap-2">
          {AQI_THRESH.map(({ level, color }) => (
            <button key={level} onClick={() => handleSelect(setAqiThreshold, level)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${aqiThreshold === level ? color + ' scale-105 shadow-lg' : 'border-white/10 bg-white/5 text-white/30 hover:border-white/20'}`}>
              {level} — {t(`aqi.level.${level}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/30 mt-3">{t('biometrics.profile.thresholdLabel')} <span className="text-white font-semibold">{aqiThreshold}</span></p>
      </div>
    </div>
  );
};

//  Tab: Outdoor Safety
const OutdoorTab = ({ aqi, humidity, windSpeed }) => {
  const { t } = useTranslation();
  const { healthProfile } = useProfileStore();
  const [profileId, setProfileId] = useState(healthProfile ?? 'general');
  const [analyzing, setAnalyzing] = useState(false);
  const [checked, setChecked]     = useState(false);

  const result = getBioVulnerabilityVerdict(aqi ?? 1, humidity, windSpeed, profileId);
  const VIcon  = result.icon;

  const handleCheck = () => {
    setAnalyzing(true); setChecked(false);
    setTimeout(() => { setAnalyzing(false); setChecked(true); }, 900);
  };

  const aqiMeta = aqi ? AQI_META[aqi] : null;

  return (
    <div className="space-y-4">
      {/* Current AQI pill */}
      {aqiMeta && (
        <div className={`glass-card px-4 py-3 flex items-center gap-3 border ${aqiMeta.bg}`}>
          <span className="text-2xl">🌬️</span>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{t('biometrics.outdoor.currentAqi')}</p>
            <p className={`text-sm font-extrabold ${aqiMeta.text}`}>Level {aqi} · {t(`aqi.level.${aqi}`)}</p>
          </div>
          {humidity != null && (
            <div className="ml-auto text-right">
              <p className="text-[10px] text-white/30">{t('biometrics.outdoor.humidWind')}</p>
              <p className="text-xs font-bold text-white/60">{humidity}% · {(windSpeed * 3.6).toFixed(1)} km/h</p>
            </div>
          )}
        </div>
      )}

      {/* Profile select */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{t('biometrics.outdoor.healthProfile')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HEALTH_PROFILES.map(p => (
            <button key={p.id} onClick={() => { setProfileId(p.id); setChecked(false); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                profileId === p.id ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/8 text-white/60 hover:bg-white/5'
              }`}>
              <span>{p.icon}</span><span className="truncate">{t(`biometrics.hp.${p.id}_label`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Check button / result */}
      {!checked && !analyzing && (
        <button onClick={handleCheck}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> {t('biometrics.outdoor.analyzeBtn')}
        </button>
      )}

      {analyzing && (
        <div className="glass-card p-4 flex items-center gap-3 text-emerald-400 font-medium">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t('biometrics.outdoor.analyzing')}</span>
        </div>
      )}

      {checked && (
        <div className="glass-card overflow-hidden">
          <div className={`p-4 border-b border-white/8 flex items-center gap-3 ${result.color}`}>
            <VIcon className="w-7 h-7 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest">{t('biometrics.outdoor.verdictLabel')}</p>
              <p className="text-xl font-extrabold">{t(`outdoor.decision.${result.verdictKey}`)}</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-white/70 leading-relaxed">{t(`biometrics.outdoor.reasons.${result.reasonKey}`)}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass px-3 py-2.5 rounded-xl">
                <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1 mb-1"><Clock className="w-3 h-3" />{t('biometrics.outdoor.safeDuration')}</p>
                <p className="text-sm font-bold text-white">{t(`biometrics.outdoor.${getDuration(aqi ?? 1, profileId)}`)}</p>
              </div>
              <div className="glass px-3 py-2.5 rounded-xl">
                <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1 mb-1"><ShieldAlert className="w-3 h-3" />{t('biometrics.outdoor.maskAdvice')}</p>
                <p className="text-sm font-bold text-white">{t(`biometrics.outdoor.${getMask(aqi ?? 1, profileId)}`)}</p>
              </div>
            </div>
            <button onClick={() => setChecked(false)} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold glass-accent px-4 py-2 rounded-lg transition-colors">
              {t('biometrics.outdoor.reAnalyze')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

//  Tab: Diary
const DiaryTab = ({ currentAqi }) => {
  const { t } = useTranslation();
  const { data: history,    isLoading: histLoading } = useMyDiary();
  const { data: todayEntry, isLoading: todayLoading } = useQuery({ queryKey: ['diary', 'today'], queryFn: fetchTodayEntry });
  const { mutate: save,     isPending: saving, isSuccess: savedOk } = useLogEntry();

  const [feeling, setFeeling]     = useState('');
  const [symptoms, setSymptoms]   = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (todayEntry) { setFeeling(todayEntry.feeling ?? ''); setSymptoms(todayEntry.symptoms ?? []); } }, [todayEntry]);
  useEffect(() => { if (savedOk) setSubmitted(true); }, [savedOk]);

  const toggle = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSave = () => {
    if (!feeling) return;
    save({ feeling, symptoms, aqiAtTime: currentAqi ?? null });
    setSubmitted(false);
  };

  const alreadyLogged = !!todayEntry && submitted;

  const formatDayLabel = (d) => {
    if (isToday(d))     return t('biometrics.diary.today');
    if (isYesterday(d)) return t('biometrics.diary.yesterday');
    return format(d, 'MMM d, yyyy');
  };

  return (
    <div className="space-y-5">
      {/* Today's entry */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookHeart className="w-4 h-4 text-emerald-400" />
          <p className="text-sm font-bold text-white">{t('biometrics.diary.todaysEntry')}</p>
          {currentAqi && (
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${AQI_META[currentAqi]?.bg} ${AQI_META[currentAqi]?.text}`}>
              AQI {currentAqi} · {t(`aqi.level.${currentAqi}`)}
            </span>
          )}
        </div>

        {alreadyLogged ? (
          <div className="flex items-center gap-2 text-emerald-400 py-6 justify-center">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">{t('biometrics.diary.logged')}</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">{t('biometrics.diary.howFeeling')}</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {FEELINGS.map(f => (
                <button key={f.key} onClick={() => setFeeling(f.key)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${feeling === f.key ? f.color : 'border-white/8 text-white/50 hover:bg-white/5'}`}>
                  <span className="text-xl">{f.emoji}</span>{t(`biometrics.feelings.${f.key}`)}
                </button>
              ))}
            </div>

            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">{t('biometrics.diary.symptoms')}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {SYMPTOMS.map(s => (
                <button key={s} onClick={() => toggle(s)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    symptoms.includes(s) ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' : 'border-white/8 text-white/40 hover:border-white/20'
                  }`}>{t(`biometrics.symptoms.${SYMPTOM_KEYS[s]}`)}</button>
              ))}
            </div>

            <button onClick={handleSave} disabled={!feeling || saving}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />{t('biometrics.diary.saving')}</>
                : <><CheckCircle2 className="w-4 h-4" />{t('biometrics.diary.logEntry')}</>}
            </button>
          </>
        )}
      </div>

      {/* History */}
      <div>
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{t('biometrics.diary.history')}</p>
        {histLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)}</div>
        ) : history?.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">{t('biometrics.diary.noHistory')}</p>
        ) : (
          <div className="space-y-2">
            {history?.slice(0, 14).map(entry => {
              const f    = FEELINGS.find(x => x.key === entry.feeling);
              const aqiM = entry.aqiAtTime ? AQI_META[entry.aqiAtTime] : null;
              const d    = new Date(entry.date);
              return (
                <div key={entry.id} className="glass-card p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{f?.emoji ?? '❓'}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{f ? t(`biometrics.feelings.${f.key}`) : entry.feeling}</p>
                        <p className="text-[11px] text-white/30 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDayLabel(d)}</p>
                      </div>
                    </div>
                    {aqiM && <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${aqiM.bg} ${aqiM.text}`}>AQI {entry.aqiAtTime} · {t(`aqi.level.${entry.aqiAtTime}`)}</span>}
                  </div>
                  {entry.symptoms?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.symptoms.map(s => (
                        <span key={s} className="text-[10px] bg-white/5 border border-white/8 text-white/50 px-2 py-0.5 rounded-full">
                          {SYMPTOM_KEYS[s] ? t(`biometrics.symptoms.${SYMPTOM_KEYS[s]}`) : s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

//  Biometrics Page
const BiometricsPage = () => {
  const { t } = useTranslation();
  const [searchParams]  = useSearchParams();
  const defaultTab      = searchParams.get('tab') ?? 'profile';
  const [tab, setTab]   = useState(['profile','outdoor','diary'].includes(defaultTab) ? defaultTab : 'profile');

  const user      = useAuthStore((s) => s.user);
  const { photoUrl } = useProfileStore();
  const { uploading, error: uploadError, fileInputRef, openFilePicker, handleFileChange } = usePhotoUpload();

  const { location } = useGeolocation();
  const { data: aqiData }     = useAirQuality(location);
  const { data: weatherData } = useQuery({
    queryKey: ['weather', location?.lat, location?.lon],
    queryFn:  () => import('@/features/weather/api/weatherApi').then(m => m.fetchCurrentWeather(location)),
    enabled:  !!location,
  });

  const currentAqi = aqiData?.list?.[0]?.main?.aqi;
  const humidity   = weatherData?.main?.humidity ?? 60;
  const windSpeed  = weatherData?.wind?.speed ?? 3;

  const TABS = [
    { id: 'profile', label: t('biometrics.tabProfile'), icon: User      },
    { id: 'outdoor', label: t('biometrics.tabOutdoor'), icon: Leaf      },
    { id: 'diary',   label: t('biometrics.tabDiary'),   icon: BookHeart },
  ];

  return (
    <div className="min-h-screen bg-page page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-1440 mx-auto px-4 lg:px-8 py-6 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{t('biometrics.title')}</h1>
            <p className="text-xs text-white/30">{t('biometrics.subtitle')}</p>
          </div>
        </div>

        <div className="flex glass-card p-1 gap-1 mb-6">
          {TABS.map(tab2 => (
            <button key={tab2.id} onClick={() => setTab(tab2.id)}
              className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === tab2.id ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white/40 hover:text-white/70'
              }`}>
              <tab2.icon className="w-3.5 h-3.5" />{tab2.label}
            </button>
          ))}
        </div>

        <div className="page-enter">
          {tab === 'profile' && (
            <ProfileTab user={user} photoUrl={photoUrl} uploading={uploading} uploadError={uploadError}
              openFilePicker={openFilePicker} handleFileChange={handleFileChange} fileInputRef={fileInputRef} />
          )}
          {tab === 'outdoor' && <OutdoorTab aqi={currentAqi} humidity={humidity} windSpeed={windSpeed} />}
          {tab === 'diary'   && <DiaryTab currentAqi={currentAqi} />}
        </div>
      </div>
    </div>
  );
};

export default BiometricsPage;
