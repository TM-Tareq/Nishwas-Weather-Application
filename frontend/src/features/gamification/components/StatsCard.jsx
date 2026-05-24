import { useNavigate } from 'react-router-dom';
import { Flame, Star, Trophy, ArrowRight } from 'lucide-react';

const BADGES = {
  first_breath: { icon: '🌱', label: 'First Breath',  desc: 'First check-in ever' },
  week_warrior: { icon: '🔥', label: 'Week Warrior',  desc: '7-day streak' },
  month_master: { icon: '🏆', label: 'Month Master',  desc: '30-day streak' },
  air_guardian: { icon: '🌿', label: 'Air Guardian',  desc: 'Profile fully set up' },
};

const StatsCard = ({ data, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="flex gap-4">
          <div className="h-16 w-16 bg-white/5 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/5 rounded w-1/3" />
            <div className="h-6 bg-white/5 rounded w-1/2" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalPoints, currentStreak, longestStreak, totalCheckIns, badges = [], checkedInToday } = data;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Your Activity</p>
        <button
          onClick={() => navigate('/nexus?tab=leaderboard')}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Leaderboard <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex flex-col items-center justify-center rounded-xl p-3 gap-1"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Star className="w-4 h-4 text-emerald-400" />
          <p className="text-xl font-extrabold text-emerald-400 tabular-nums">{totalPoints}</p>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Points</p>
        </div>

        <div className={`flex flex-col items-center justify-center rounded-xl p-3 gap-1 ${
          currentStreak > 0
            ? 'border border-orange-500/20'
            : 'border border-white/5'
        }`} style={{ background: currentStreak > 0 ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)' }}>
          <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-400' : 'text-white/20'}`} />
          <p className={`text-xl font-extrabold tabular-nums ${currentStreak > 0 ? 'text-orange-400' : 'text-white/20'}`}>
            {currentStreak}
          </p>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wide">Streak</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl p-3 gap-1 border border-amber-500/20"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          <Trophy className="w-4 h-4 text-amber-400" />
          <p className="text-xl font-extrabold text-amber-400 tabular-nums">{totalCheckIns}</p>
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Check-ins</p>
        </div>
      </div>

      {/* Today status */}
      <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl mb-4 border ${
        checkedInToday
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}>
        <span>{checkedInToday ? '✅' : '⏰'}</span>
        <span>
          {checkedInToday
            ? `Checked in today · Streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}`
            : 'Check-in registered automatically on your first daily visit'}
        </span>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Badges Earned</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((badgeId) => {
              const badge = BADGES[badgeId];
              if (!badge) return null;
              return (
                <div key={badgeId} title={badge.desc}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20"
                  style={{ background: 'rgba(16,185,129,0.08)' }}>
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-[11px] font-semibold text-emerald-400">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {longestStreak > 0 && (
        <p className="text-[10px] text-white/20 mt-3">
          Longest streak: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
