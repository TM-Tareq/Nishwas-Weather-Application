import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboard } from '@/features/gamification/api/statsApi';
import useUserStats from '@/features/gamification/hooks/useUserStats';
import useAuthStore from '@/features/auth/store/authStore';
import Navbar from '@/components/organisms/Navbar';

const BADGES = {
  first_breath:  '🌱',
  week_warrior:  '🔥',
  month_master:  '🏆',
  air_guardian:  '🌿',
};

const RANK_STYLES = {
  1: { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-600',  trophy: '🥇' },
  2: { bg: 'bg-gray-50  border-gray-200',    text: 'text-gray-500',   trophy: '🥈' },
  3: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-500', trophy: '🥉' },
};

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: board = [], isLoading: boardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 2,
  });

  const { data: myStats } = useUserStats();

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

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Leaderboard</h2>
            <p className="text-sm text-gray-400">Top users by points — updated daily</p>
          </div>
        </div>

        {/* My stats summary */}
        {myStats && myStats.totalPoints > 0 && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4 flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shrink-0">
              <span className="text-sm font-extrabold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-800">{user?.name} <span className="text-brand-400 font-normal">(you)</span></p>
              <p className="text-xs text-brand-600 mt-0.5">
                {myStats.totalPoints} pts · {myStats.currentStreak} day streak
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {myStats.badges.slice(0, 3).map(b => (
                <span key={b} className="text-lg">{BADGES[b] ?? '🏅'}</span>
              ))}
            </div>
          </div>
        )}

        {/* Board */}
        {boardLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : board.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🌿</p>
            <p className="text-gray-400 text-sm">No one on the leaderboard yet.</p>
            <p className="text-gray-300 text-xs mt-1">Be the first — open the dashboard daily!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {board.map((entry) => {
              const rankStyle = RANK_STYLES[entry.rank] ?? { bg: 'bg-white border-gray-100', text: 'text-gray-400', trophy: null };
              const isMe = entry.name === user?.name;

              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all ${rankStyle.bg} ${
                    isMe ? 'ring-2 ring-brand-300 ring-offset-1' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {rankStyle.trophy ? (
                      <span className="text-xl">{rankStyle.trophy}</span>
                    ) : (
                      <span className={`text-sm font-extrabold ${rankStyle.text}`}>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {entry.name}
                      {isMe && <span className="ml-1.5 text-[10px] font-semibold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-full">you</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.currentStreak > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-500 font-semibold">
                          <Flame className="w-3 h-3" /> {entry.currentStreak}d
                        </span>
                      )}
                      <span className="flex gap-0.5">
                        {entry.badges.slice(0, 4).map(b => (
                          <span key={b} className="text-sm">{BADGES[b] ?? '🏅'}</span>
                        ))}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-base font-extrabold text-gray-900 tabular-nums">
                        {entry.totalPoints}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Points guide */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            How to earn points
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {[
              { icon: '📅', label: 'Daily check-in',       pts: '+10 pts' },
              { icon: '🔥', label: '7-day streak bonus',   pts: '+50 pts' },
              { icon: '🏆', label: '30-day streak bonus',  pts: '+200 pts' },
              { icon: '🌱', label: 'First check-in badge', pts: 'First Breath 🌱' },
            ].map(({ icon, label, pts }) => (
              <div key={label} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-base shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-700">{pts}</p>
                  <p className="text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardPage;
