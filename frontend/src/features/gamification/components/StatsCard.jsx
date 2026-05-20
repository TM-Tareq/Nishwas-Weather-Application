import { useNavigate } from 'react-router-dom';
import { Flame, Star, Trophy, ArrowRight } from 'lucide-react';

const BADGES = {
  first_breath:  { icon: '🌱', label: 'First Breath',   desc: 'First check-in ever' },
  week_warrior:  { icon: '🔥', label: 'Week Warrior',   desc: '7-day streak' },
  month_master:  { icon: '🏆', label: 'Month Master',   desc: '30-day streak' },
  air_guardian:  { icon: '🌿', label: 'Air Guardian',   desc: 'Profile fully set up' },
};

const StatsCard = ({ data, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="flex gap-4">
          <div className="h-16 w-16 bg-gray-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-6 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalPoints, currentStreak, longestStreak, totalCheckIns, badges = [], checkedInToday } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Your Activity
        </p>
        <button
          onClick={() => navigate('/leaderboard')}
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Leaderboard <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Points */}
        <div className="flex flex-col items-center justify-center bg-brand-50 rounded-xl p-3 gap-1">
          <Star className="w-4 h-4 text-brand-500" />
          <p className="text-xl font-extrabold text-brand-700 tabular-nums">{totalPoints}</p>
          <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide">Points</p>
        </div>

        {/* Current streak */}
        <div className={`flex flex-col items-center justify-center rounded-xl p-3 gap-1 ${
          currentStreak > 0 ? 'bg-orange-50' : 'bg-gray-50'
        }`}>
          <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
          <p className={`text-xl font-extrabold tabular-nums ${currentStreak > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {currentStreak}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Streak</p>
        </div>

        {/* Check-ins */}
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-3 gap-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <p className="text-xl font-extrabold text-gray-700 tabular-nums">{totalCheckIns}</p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Check-ins</p>
        </div>
      </div>

      {/* Today status */}
      <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl mb-4 ${
        checkedInToday
          ? 'bg-green-50 text-green-700 border border-green-100'
          : 'bg-amber-50 text-amber-700 border border-amber-100'
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
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Badges Earned
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.map((badgeId) => {
              const badge = BADGES[badgeId];
              if (!badge) return null;
              return (
                <div
                  key={badgeId}
                  title={badge.desc}
                  className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1"
                >
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-[11px] font-semibold text-brand-700">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Longest streak footnote */}
      {longestStreak > 0 && (
        <p className="text-[10px] text-gray-300 mt-3">
          Longest streak: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
