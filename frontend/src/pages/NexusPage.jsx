import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users, Trophy, Heart, Send, Wind, MapPin,
  Plus, X, Loader2, Flame, Star, CalendarDays, Clock3,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import useFeed        from '@/features/community/hooks/useFeed';
import useCreatePost  from '@/features/community/hooks/useCreatePost';
import useLikePost    from '@/features/community/hooks/useLikePost';
import useEvents      from '@/features/community/hooks/useEvents';
import useCreateEvent from '@/features/community/hooks/useCreateEvent';
import useJoinEvent   from '@/features/community/hooks/useJoinEvent';
import useAuthStore   from '@/features/auth/store/authStore';
import useUserStats   from '@/features/gamification/hooks/useUserStats';
import { fetchLeaderboard } from '@/features/gamification/api/statsApi';
import useWebSocket   from '@/hooks/useWebSocket';

//  Constants
const AQI_META = {
  1: { label: 'Good',      color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  2: { label: 'Fair',      color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'    },
  3: { label: 'Moderate',  color: 'bg-orange-500/15 border-orange-500/30 text-orange-400'    },
  4: { label: 'Poor',      color: 'bg-red-500/15 border-red-500/30 text-red-400'             },
  5: { label: 'Very Poor', color: 'bg-purple-500/15 border-purple-500/30 text-purple-400'    },
};

const AQI_OPTIONS = [1, 2, 3, 4, 5];
const AQI_LABELS  = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

const EVENT_CATS = [
  { id: 'ENVIRONMENT', label: '🌿 Environment', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'CLEANUP',     label: '🧹 Cleanup',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/30'         },
  { id: 'HEALTH',      label: '❤️ Health',      color: 'bg-red-500/15 text-red-400 border-red-500/30'            },
  { id: 'EDUCATION',   label: '📚 Education',   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'   },
  { id: 'OTHER',       label: '✨ Other',        color: 'bg-white/5 text-white/50 border-white/10'                },
];

const BADGES = { first_breath: '🌱', week_warrior: '🔥', month_master: '🏆', air_guardian: '🌿' };

const RANK_STYLES = {
  1: { bg: 'border-amber-500/30 bg-amber-500/10',  text: 'text-amber-400',  trophy: '🥇' },
  2: { bg: 'border-white/10 bg-white/5',            text: 'text-white/40',   trophy: '🥈' },
  3: { bg: 'border-orange-500/20 bg-orange-500/8',  text: 'text-orange-400', trophy: '🥉' },
};

const timeAgo = (d) => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } };

const fmtEventDate = (d, t) => {
  try {
    const dt = new Date(d);
    if (isToday(dt))    return t('nexus.event.today');
    if (isTomorrow(dt)) return t('nexus.event.tomorrow');
    return format(dt, 'dd MMM yyyy');
  } catch { return d; }
};

//  Avatar
const Avatar = ({ name, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shrink-0`}>
      <span className="font-bold text-white">{name?.charAt(0).toUpperCase()}</span>
    </div>
  );
};

//  Community Tab
const CommunityTab = () => {
  const { t } = useTranslation();
  const { data: feed = [], isLoading: feedLoading }     = useFeed();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { mutate: createPost,  isPending: postPending }  = useCreatePost();
  const { mutate: createEvent, isPending: eventPending } = useCreateEvent();
  const { mutate: joinEvent }                            = useJoinEvent();
  const { mutate: likePost }                             = useLikePost();

  const [postContent, setPostContent] = useState('');
  const [postAqi, setPostAqi]         = useState('');
  const [postCity, setPostCity]       = useState('');
  const [showPostForm, setShowPost]   = useState(false);
  const [showEventForm, setShowEvent] = useState(false);

  const [evTitle, setEvTitle] = useState('');
  const [evDate,  setEvDate]  = useState('');
  const [evLoc,   setEvLoc]   = useState('');
  const [evCat,   setEvCat]   = useState('ENVIRONMENT');
  const [evDesc,  setEvDesc]  = useState('');

  const submitPost = (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    createPost(
      { content: postContent.trim(), cityName: postCity.trim() || null, aqiLevel: postAqi ? Number(postAqi) : null },
      { onSuccess: () => { setPostContent(''); setPostAqi(''); setPostCity(''); setShowPost(false); } },
    );
  };

  const submitEvent = (e) => {
    e.preventDefault();
    if (!evTitle.trim() || !evDate) return;
    createEvent(
      { title: evTitle, eventDate: evDate, cityName: evLoc, category: evCat, description: evDesc },
      { onSuccess: () => { setEvTitle(''); setEvDate(''); setEvLoc(''); setEvDesc(''); setShowEvent(false); } },
    );
  };

  return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => { setShowPost(p => !p); setShowEvent(false); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl flex-1 justify-center transition-all ${showPostForm ? 'glass-accent text-emerald-400' : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'}`}>
          <Plus className="w-4 h-4" /> {t('nexus.newPost')}
        </button>
        <button onClick={() => { setShowEvent(p => !p); setShowPost(false); }}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl flex-1 justify-center transition-all ${showEventForm ? 'glass-accent text-emerald-400' : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'}`}>
          <CalendarDays className="w-4 h-4" /> {t('nexus.newEvent')}
        </button>
      </div>

      {/* Post form */}
      {showPostForm && (
        <form onSubmit={submitPost} className="glass-card p-4 space-y-3 animate-fade-in">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('nexus.post.heading')}</p>
          <div>
            <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.post.messageLabel')} <span className="text-red-400">*</span></label>
            <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
              placeholder={t('nexus.post.messagePlaceholder')}
              rows={3}
              className="w-full glass px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none resize-none rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.post.cityLabel')} <span className="text-white/20">{t('nexus.post.optional')}</span></label>
              <input value={postCity} onChange={e => setPostCity(e.target.value)} placeholder={t('nexus.post.cityPlaceholder')}
                className="w-full glass px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.post.aqiLabel')} <span className="text-white/20">{t('nexus.post.optional')}</span></label>
              <select value={postAqi} onChange={e => setPostAqi(e.target.value)}
                className="glass px-3 py-2 text-xs focus:outline-none rounded-xl cursor-pointer h-[34px]">
                <option value="">{t('nexus.post.aqiPlaceholder')}</option>
                {AQI_OPTIONS.map(l => <option key={l} value={l}>{l} · {AQI_LABELS[l]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowPost(false)} className="text-white/30 hover:text-white text-xs px-3 py-2">{t('nexus.post.cancel')}</button>
            <button type="submit" disabled={!postContent.trim() || postPending}
              className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1.5">
              {postPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {t('nexus.post.submit')}
            </button>
          </div>
        </form>
      )}

      {/* Event form */}
      {showEventForm && (
        <form onSubmit={submitEvent} className="glass-card p-4 space-y-3 animate-fade-in">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('nexus.event.heading')}</p>
          <div>
            <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.event.titleLabel')} <span className="text-red-400">*</span></label>
            <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder={t('nexus.event.titlePlaceholder')} required
              className="w-full glass px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.event.dateLabel')} <span className="text-red-400">*</span></label>
              <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} required
                className="w-full glass px-3 py-2 text-xs focus:outline-none rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.event.cityLabel')} <span className="text-white/20">{t('nexus.post.optional')}</span></label>
              <input value={evLoc} onChange={e => setEvLoc(e.target.value)} placeholder={t('nexus.event.cityPlaceholder')}
                className="w-full glass px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.event.categoryLabel')}</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_CATS.map(c => (
                <button key={c.id} type="button" onClick={() => setEvCat(c.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${evCat === c.id ? c.color : 'border-white/8 text-white/30 hover:border-white/20'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-white/40 mb-1 ml-1">{t('nexus.event.descLabel')} <span className="text-white/20">{t('nexus.post.optional')}</span></label>
            <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder={t('nexus.event.descPlaceholder')} rows={2}
              className="w-full glass px-3 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none resize-none rounded-xl" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowEvent(false)} className="text-white/30 text-xs px-3 py-2">{t('nexus.event.cancel')}</button>
            <button type="submit" disabled={!evTitle.trim() || !evDate || eventPending}
              className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1.5">
              {eventPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {t('nexus.event.submit')}
            </button>
          </div>
        </form>
      )}

      {/* Upcoming events */}
      {events.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">{t('nexus.event.upcomingHeading')}</p>
          <div className="space-y-2">
            {events.slice(0, 3).map(ev => {
              const catMeta = EVENT_CATS.find(c => c.id === ev.category) ?? EVENT_CATS[4];
              return (
                <div key={ev.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-12">
                    <CalendarDays className="w-4 h-4 text-white/30" />
                    <p className="text-[10px] font-bold text-white/50 text-center">{fmtEventDate(ev.eventDate, t)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                    {ev.cityName && <p className="text-[11px] text-white/30 truncate"><MapPin className="w-3 h-3 inline mr-0.5" />{ev.cityName}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.color}`}>{catMeta.label}</span>
                    <button onClick={() => joinEvent(ev.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${ev.joined ? 'bg-emerald-500/20 text-emerald-400' : 'glass text-white/40 hover:text-white'}`}>
                      {ev.joined ? t('nexus.event.joined') : t('nexus.event.join')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feed */}
      <div>
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">{t('nexus.post.feedHeading')}</p>
        {feedLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-24 animate-pulse" />)}</div>
        ) : feed.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-10">{t('nexus.post.empty')}</p>
        ) : (
          <div className="space-y-3">
            {feed.map(post => {
              const aqiM = post.aqiLevel ? AQI_META[post.aqiLevel] : null;
              return (
                <div key={post.id} className="glass-card p-4 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={post.authorName} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-white">{post.authorName}</p>
                        <p className="text-xs text-white/30">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    {aqiM && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${aqiM.color}`}>
                        <Wind className="w-3 h-3" />AQI {post.aqiLevel} · {aqiM.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    {post.cityName ? <span className="text-xs text-white/30 flex items-center gap-1"><MapPin className="w-3 h-3" />{post.cityName}</span> : <span />}
                    <button onClick={() => likePost(post.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white/30 hover:text-red-400 transition-colors">
                      <Heart className="w-4 h-4" />{post.likes}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

//  Leaderboard Tab
const LeaderboardTab = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: board = [], isLoading: boardLoading } = useQuery({
    queryKey: ['leaderboard'], queryFn: fetchLeaderboard, staleTime: 120000,
  });
  const { data: myStats } = useUserStats();

  return (
    <div className="space-y-5">
      {/* My stats */}
      {myStats && myStats.totalPoints > 0 && (
        <div className="glass-card p-4 flex items-center gap-4 border border-emerald-500/20">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <span className="text-sm font-extrabold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name} <span className="text-emerald-400 font-normal text-xs">({t('nexus.board.you')})</span></p>
            <p className="text-xs text-white/40 mt-0.5">{myStats.totalPoints} {t('nexus.board.points')} · 🔥 {myStats.currentStreak}d streak</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {myStats.badges?.slice(0, 3).map(b => <span key={b} className="text-lg">{BADGES[b] ?? '🏅'}</span>)}
          </div>
        </div>
      )}

      {/* Board */}
      {boardLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)}</div>
      ) : board.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-white/40 text-sm">{t('nexus.board.empty')}</p>
          <p className="text-white/20 text-xs mt-1">{t('nexus.board.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {board.map(entry => {
            const rankStyle = RANK_STYLES[entry.rank] ?? { bg: 'border-white/8 bg-white/3', text: 'text-white/30', trophy: null };
            const isMe = entry.isMe;
            return (
              <div key={entry.rank}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all ${rankStyle.bg} ${isMe ? 'neon-border' : ''}`}>
                <div className="w-8 text-center shrink-0">
                  {rankStyle.trophy
                    ? <span className="text-xl">{rankStyle.trophy}</span>
                    : <span className={`text-sm font-extrabold ${rankStyle.text}`}>#{entry.rank}</span>}
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-white">{entry.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {entry.name}
                    {isMe && <span className="ml-2 text-[10px] font-bold text-emerald-400 glass-accent px-1.5 py-0.5 rounded-full">{t('nexus.board.you')}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.currentStreak > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-semibold">
                        <Flame className="w-3 h-3" />{entry.currentStreak}d
                      </span>
                    )}
                    <span className="flex gap-0.5">
                      {entry.badges?.slice(0, 4).map(b => <span key={b} className="text-sm">{BADGES[b] ?? '🏅'}</span>)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-white">{entry.totalPoints}</p>
                  <p className="text-[10px] text-white/30">{t('nexus.board.points')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

//  Nexus Page
const NexusPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab     = searchParams.get('tab') === 'leaderboard' ? 'leaderboard' : 'community';
  const [tab, setTab]  = useState(defaultTab);
  const queryClient    = useQueryClient();

  const wsHandlers = useCallback(() => ({
    '/topic/feed':        () => queryClient.invalidateQueries({ queryKey: ['communityFeed'] }),
    '/topic/leaderboard': () => queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
  }), [queryClient]);
  useWebSocket(wsHandlers());

  const TABS = [
    { id: 'community',   label: t('nexus.community'),   icon: Users   },
    { id: 'leaderboard', label: t('nexus.leaderboard'), icon: Trophy  },
  ];

  return (
    <div className="min-h-screen bg-page page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-1440 mx-auto px-4 lg:px-8 py-6 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{t('nexus.title')}</h1>
            <p className="text-xs text-white/30">{t('nexus.subtitle')}</p>
          </div>
        </div>

        <div className="flex glass-card p-1 gap-1 mb-6 max-w-sm">
          {TABS.map(t2 => (
            <button key={t2.id} onClick={() => setTab(t2.id)}
              className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t2.id ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white/40 hover:text-white/70'
              }`}>
              <t2.icon className="w-3.5 h-3.5" />{t2.label}
            </button>
          ))}
        </div>

        <div className="page-enter max-w-2xl">
          {tab === 'community'   ? <CommunityTab />   : <LeaderboardTab />}
        </div>
      </div>
    </div>
  );
};

export default NexusPage;
