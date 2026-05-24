import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { useMyDiary } from '@/features/diary/hooks/useMyDiary';
import { useLogEntry } from '@/features/diary/hooks/useLogEntry';
import { fetchTodayEntry } from '@/features/diary/api/diaryApi';
import useGeolocation from '@/hooks/useGeolocation';
import useAirQuality from '@/features/weather/hooks/useAirQuality';
import { BookHeart, CheckCircle2, Wind, Loader2, CalendarDays } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const FEELINGS = [
  { key: 'GOOD',   emoji: '😊', label: 'Feeling Good',  color: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
  { key: 'OKAY',   emoji: '😐', label: 'Feeling Okay',  color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'     },
  { key: 'UNWELL', emoji: '😷', label: 'Feeling Unwell', color: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'     },
  { key: 'SICK',   emoji: '🤒', label: 'Feeling Sick',  color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'                 },
];

const SYMPTOMS = [
  'Cough', 'Runny Nose', 'Headache', 'Eye Irritation',
  'Chest Tightness', 'Fatigue', 'Shortness of Breath', 'Throat Irritation',
];

const AQI_META = {
  1: { label: 'Good',      badge: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'Fair',      badge: 'bg-yellow-100 text-yellow-700'   },
  3: { label: 'Moderate',  badge: 'bg-orange-100 text-orange-700'   },
  4: { label: 'Poor',      badge: 'bg-red-100 text-red-700'         },
  5: { label: 'Very Poor', badge: 'bg-purple-100 text-purple-700'   },
};

const feelingFor = (key) => FEELINGS.find(f => f.key === key);

const formatEntryDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
};

const HistoryCard = ({ entry }) => {
  const feeling = feelingFor(entry.feeling);
  const aqiMeta = entry.aqiAtTime ? AQI_META[entry.aqiAtTime] : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{feeling?.emoji ?? '❓'}</span>
          <div>
            <div className="text-sm font-bold text-gray-800">{feeling?.label ?? entry.feeling}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatEntryDate(entry.date)}
            </div>
          </div>
        </div>
        {aqiMeta && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${aqiMeta.badge}`}>
            AQI {entry.aqiAtTime} · {aqiMeta.label}
          </span>
        )}
      </div>
      {entry.symptoms?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.symptoms.map(s => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>
      )}
      {entry.notes && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">{entry.notes}</p>
      )}
    </div>
  );
};

const DiaryPage = () => {
  const location = useGeolocation();
  const { data: aqiData } = useAirQuality(location);
  const currentAqi = aqiData?.list?.[0]?.main?.aqi;

  const { data: history, isLoading: historyLoading } = useMyDiary();
  const { data: todayEntry, isLoading: todayLoading } = useQuery({
    queryKey: ['diary', 'today'],
    queryFn: fetchTodayEntry,
  });
  const { mutate: save, isPending: saving, isSuccess: saved } = useLogEntry();

  const [feeling, setFeeling] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (todayEntry) {
      setFeeling(todayEntry.feeling ?? '');
      setSelectedSymptoms(todayEntry.symptoms ?? []);
      setNotes(todayEntry.notes ?? '');
    }
  }, [todayEntry]);

  useEffect(() => {
    if (saved) setSubmitted(true);
  }, [saved]);

  const toggleSymptom = (sym) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = () => {
    if (!feeling) return;
    save({ feeling, symptoms: selectedSymptoms, notes, aqiAtTime: currentAqi ?? null });
    setSubmitted(false);
  };

  const alreadyLogged = !!todayEntry && submitted;
  const aqiMeta = currentAqi ? AQI_META[currentAqi] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/20 page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200 flex-shrink-0">
            <BookHeart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Health Diary</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your daily health alongside air quality</p>
          </div>
        </div>

        {/* Today's Log Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800">Today's Log</h2>
            <div className="flex items-center gap-2">
              {currentAqi && aqiMeta && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${aqiMeta.badge}`}>
                  <Wind className="w-3 h-3" /> AQI {currentAqi} · {aqiMeta.label}
                </span>
              )}
            </div>
          </div>

          {todayLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading today's entry…</span>
            </div>
          ) : (
            <>
              {/* Feeling selector */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">How are you feeling?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FEELINGS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFeeling(f.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-150 font-semibold text-sm
                        ${feeling === f.key
                          ? f.color + ' border-current scale-105 shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50'
                        }`}
                    >
                      <span className="text-2xl">{f.emoji}</span>
                      <span className="text-xs leading-tight text-center">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Any symptoms? <span className="font-normal text-gray-400">(optional)</span></p>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map(sym => (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-all duration-150 font-medium
                        ${selectedSymptoms.includes(sym)
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'
                        }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-600 mb-2">Notes <span className="font-normal text-gray-400">(optional)</span></p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How did the air quality affect you today? Any observations…"
                  rows={3}
                  className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!feeling || saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-brand-200 hover:shadow-lg hover:shadow-brand-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> {todayEntry ? 'Update Entry' : 'Save Entry'}</>
                  )}
                </button>
                {alreadyLogged && (
                  <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </span>
                )}
                {!feeling && (
                  <span className="text-xs text-gray-400">Select a feeling to continue</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* History */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-4">Past Entries</h2>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : !history?.length ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-3">📔</span>
              <p className="text-sm font-medium">No diary entries yet</p>
              <p className="text-xs mt-1">Log your first entry above</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map(entry => (
                <HistoryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;
