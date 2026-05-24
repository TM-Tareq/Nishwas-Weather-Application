import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  BarChart,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, Loader2, BookHeart, Wind, Smile, Activity } from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { useMyDiary } from '@/features/diary/hooks/useMyDiary';

const FEELING_SCORE = { GOOD: 4, OKAY: 3, UNWELL: 2, SICK: 1 };
const FEELING_EMOJI = { GOOD: '😊', OKAY: '😐', UNWELL: '😷', SICK: '🤒' };
const FEELING_LABEL = { GOOD: 'Good', OKAY: 'Okay', UNWELL: 'Unwell', SICK: 'Sick' };

const AQI_COLOR = {
  1: '#10b981', // emerald
  2: '#f59e0b', // amber
  3: '#f97316', // orange
  4: '#ef4444', // red
  5: '#9333ea', // purple
};

const AQI_LABEL = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

const SYMPTOMS_ALL = [
  'Cough', 'Runny Nose', 'Headache', 'Eye Irritation',
  'Chest Tightness', 'Fatigue', 'Shortness of Breath', 'Throat Irritation',
];

//  Stat Card 
const StatCard = ({ icon: Icon, label, value, sub, iconClass = 'text-brand-500' }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
    <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon className={`w-5 h-5 ${iconClass}`} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xl font-extrabold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

//  Custom Tooltip 
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[150px]">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </div>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

//  Main Page 
const InsightsPage = () => {
  const { data: history, isLoading } = useMyDiary();

  //  Data processing 
  const entries = history ?? [];

  const totalEntries = entries.length;

  const aqiEntries = entries.filter(e => e.aqiAtTime != null);
  const avgAqi = aqiEntries.length
    ? (aqiEntries.reduce((s, e) => s + e.aqiAtTime, 0) / aqiEntries.length).toFixed(1)
    : null;

  const feelingCounts = entries.reduce((acc, e) => {
    acc[e.feeling] = (acc[e.feeling] ?? 0) + 1;
    return acc;
  }, {});
  const topFeeling = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const symptomCounts = {};
  entries.forEach(e => {
    (e.symptoms ?? []).forEach(s => {
      symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
    });
  });
  const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Chart data — last 14 entries, ascending
  const chartData = [...entries]
    .slice(0, 14)
    .reverse()
    .map(e => ({
      date: format(new Date(e.date), 'MMM d'),
      aqi: e.aqiAtTime ?? null,
      aqiColor: AQI_COLOR[e.aqiAtTime] ?? '#94a3b8',
      feeling: FEELING_SCORE[e.feeling] ?? null,
      feelingLabel: FEELING_EMOJI[e.feeling] ? `${FEELING_EMOJI[e.feeling]} ${FEELING_LABEL[e.feeling]}` : e.feeling,
      aqiLabel: e.aqiAtTime ? `${AQI_LABEL[e.aqiAtTime]} (${e.aqiAtTime})` : '—',
    }));

  // Symptom frequency chart data
  const symptomChartData = SYMPTOMS_ALL
    .map(s => ({ symptom: s, count: symptomCounts[s] ?? 0 }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  //  Empty state 
  const isEmpty = !isLoading && totalEntries === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/20 page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Health Insights</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your AQI exposure vs. how you've been feeling</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Analyzing your diary…</span>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">📊</span>
            <p className="text-lg font-bold text-gray-700">No data yet</p>
            <p className="text-sm text-gray-400 mt-1">Log your first diary entry to see insights here</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={BookHeart}
                label="Days Logged"
                value={totalEntries}
                sub="diary entries"
                iconClass="text-brand-500"
              />
              <StatCard
                icon={Wind}
                label="Avg AQI"
                value={avgAqi ?? '—'}
                sub={avgAqi ? `${AQI_LABEL[Math.round(avgAqi)] ?? ''}` : 'no AQI data'}
                iconClass="text-orange-500"
              />
              <StatCard
                icon={Smile}
                label="Top Feeling"
                value={topFeeling ? `${FEELING_EMOJI[topFeeling]} ${FEELING_LABEL[topFeeling]}` : '—'}
                sub={topFeeling ? `${feelingCounts[topFeeling]} day${feelingCounts[topFeeling] > 1 ? 's' : ''}` : ''}
                iconClass="text-emerald-500"
              />
              <StatCard
                icon={Activity}
                label="Top Symptom"
                value={topSymptom ?? '—'}
                sub={topSymptom ? `${symptomCounts[topSymptom]} time${symptomCounts[topSymptom] > 1 ? 's' : ''}` : 'none reported'}
                iconClass="text-red-400"
              />
            </div>

            {/* AQI vs Feeling Chart */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <h2 className="text-sm font-bold text-gray-700 mb-1">AQI Exposure vs Feeling Score</h2>
                <p className="text-xs text-gray-400 mb-5">
                  Bars = AQI at time of entry &nbsp;·&nbsp; Line = feeling score (4 = Good, 1 = Sick)
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis yAxisId="aqi" domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'AQI', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', dy: 20 }} />
                    <YAxis yAxisId="feel" orientation="right" domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Feeling', angle: 90, position: 'insideRight', fontSize: 10, fill: '#94a3b8', dy: -20 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar yAxisId="aqi" dataKey="aqi" name="AQI" radius={[4, 4, 0, 0]} maxBarSize={36}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.aqiColor} fillOpacity={0.75} />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="feel"
                      type="monotone"
                      dataKey="feeling"
                      name="Feeling"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* AQI color legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-50">
                  {Object.entries(AQI_LABEL).map(([lvl, label]) => (
                    <div key={lvl} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: AQI_COLOR[lvl] }} />
                      {label}
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
                    <div className="w-6 h-0.5 bg-brand-600 rounded flex-shrink-0" />
                    Feeling (4=Good, 1=Sick)
                  </div>
                </div>
              </div>
            )}

            {/* Symptom Frequency */}
            {symptomChartData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <h2 className="text-sm font-bold text-gray-700 mb-1">Symptom Frequency</h2>
                <p className="text-xs text-gray-400 mb-5">How often each symptom was reported</p>
                <ResponsiveContainer width="100%" height={symptomChartData.length * 38 + 20}>
                  <BarChart
                    data={symptomChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 32, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="symptom" width={120} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip
                      formatter={(v) => [`${v} time${v > 1 ? 's' : ''}`, 'Reported']}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #f1f5f9' }}
                    />
                    <Bar dataKey="count" name="Times reported" fill="#16a34a" fillOpacity={0.8} radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Feeling breakdown */}
            {Object.keys(feelingCounts).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Feeling Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['GOOD', 'OKAY', 'UNWELL', 'SICK'].map(key => {
                    const count = feelingCounts[key] ?? 0;
                    const pct = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
                    return (
                      <div key={key} className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-2xl mb-1">{FEELING_EMOJI[key]}</div>
                        <div className="text-lg font-extrabold text-gray-800">{pct}%</div>
                        <div className="text-xs text-gray-400 font-medium">{FEELING_LABEL[key]}</div>
                        <div className="text-xs text-gray-300 mt-0.5">{count} day{count !== 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
