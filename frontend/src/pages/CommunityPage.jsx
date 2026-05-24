import { useState } from 'react';
import {
  Heart, Send, Users, Wind, Loader2, MapPin,
  Calendar, UserPlus, Plus, X, Newspaper, Sparkles,
  CalendarDays, Clock3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format, isFuture, isToday, isTomorrow } from 'date-fns';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import useFeed from '@/features/community/hooks/useFeed';
import useCreatePost from '@/features/community/hooks/useCreatePost';
import useLikePost from '@/features/community/hooks/useLikePost';
import useEvents from '@/features/community/hooks/useEvents';
import useCreateEvent from '@/features/community/hooks/useCreateEvent';
import useJoinEvent from '@/features/community/hooks/useJoinEvent';
import useAuthStore from '@/features/auth/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '@/features/gamification/api/statsApi';

//  Constants 

const AQI_META = {
  1: { label: 'Good',      color: 'bg-green-100 text-green-700 border-green-200' },
  2: { label: 'Fair',      color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  3: { label: 'Moderate',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  4: { label: 'Poor',      color: 'bg-red-100 text-red-700 border-red-200' },
  5: { label: 'Very Poor', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const AQI_OPTIONS = [1, 2, 3, 4, 5];

const EVENT_CATEGORIES = [
  { id: 'ENVIRONMENT', label: '🌿 Environment', color: 'bg-green-100 text-green-700' },
  { id: 'CLEANUP',     label: '🧹 Cleanup',     color: 'bg-blue-100 text-blue-700'   },
  { id: 'HEALTH',      label: '❤️ Health',      color: 'bg-red-100 text-red-700'     },
  { id: 'EDUCATION',   label: '📚 Education',   color: 'bg-yellow-100 text-yellow-700'},
  { id: 'OTHER',       label: '✨ Other',        color: 'bg-gray-100 text-gray-700'   },
];

const BADGE_EMOJI = {
  first_breath: '🌱', week_warrior: '🔥', month_master: '🏆', air_guardian: '🌿',
};

//  Helpers 

const timeAgo = (dateStr) => {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ''; }
};

const formatEventDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isToday(d))    return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'dd MMM yyyy');
  } catch { return dateStr; }
};

const Avatar = ({ name, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm shrink-0`}>
      <span className="font-bold text-white">{name?.charAt(0).toUpperCase()}</span>
    </div>
  );
};

const CategoryBadge = ({ cat }) => {
  const meta = EVENT_CATEGORIES.find((c) => c.id === cat) ?? EVENT_CATEGORIES[4];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
      {meta.label}
    </span>
  );
};

//  TAB 1: Feed 

const AqiBadge = ({ level }) => {
  if (!level) return null;
  const meta = AQI_META[level];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
      <Wind className="w-3 h-3" /> AQI {level} · {meta.label}
    </span>
  );
};

const PostCard = ({ post }) => {
  const { mutate: like, isPending } = useLikePost();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.authorName} />
          <div>
            <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <AqiBadge level={post.aqiLevel} />
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        {post.cityName ? (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />{post.cityName}
          </span>
        ) : <span />}
        <button
          onClick={() => like(post.id)}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <Heart className="w-4 h-4" /> {post.likes}
        </button>
      </div>
    </div>
  );
};

const CreatePostForm = ({ onClose }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [city, setCity] = useState('');
  const [aqiLevel, setAqiLevel] = useState('');
  const { mutate: create, isPending } = useCreatePost();

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    create(
      { content: content.trim(), cityName: city.trim() || null, aqiLevel: aqiLevel ? Number(aqiLevel) : null },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={submit} className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-brand-800">Share an observation</p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="What's the air like in your area? Share a tip or report…"
        maxLength={500} rows={3}
        className="w-full text-sm text-gray-700 placeholder-gray-400 border border-brand-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition"
      />
      <div className="flex gap-2">
        <input
          value={city} onChange={(e) => setCity(e.target.value)}
          placeholder="City / Area (optional)"
          className="flex-1 text-sm border border-brand-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition"
        />
        <select
          value={aqiLevel} onChange={(e) => setAqiLevel(e.target.value)}
          className="text-sm border border-brand-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-gray-600 transition"
        >
          <option value="">AQI (optional)</option>
          {AQI_OPTIONS.map((v) => (
            <option key={v} value={v}>AQI {v} · {AQI_META[v].label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl transition">Cancel</button>
        <button type="submit" disabled={isPending || !content.trim()}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </form>
  );
};

const FeedTab = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: posts, isLoading, error } = useFeed();

  return (
    <div className="flex flex-col gap-3">
      {showForm ? (
        <CreatePostForm onClose={() => setShowForm(false)} />
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 rounded-2xl px-5 py-3.5 transition-all text-left group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-gray-400 group-hover:text-brand-600 transition-colors">
            Share an air quality observation…
          </span>
        </button>
      )}

      {isLoading && [1,2,3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      {error && <p className="text-center py-10 text-gray-400 text-sm">Could not load posts.</p>}
      {!isLoading && !error && posts?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-gray-500 font-semibold">No posts yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to share a report!</p>
        </div>
      )}
      {posts?.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
};

//  TAB 2: Events 

const EventCard = ({ event }) => {
  const { mutate: join, isPending } = useJoinEvent();
  const dateStr = formatEventDate(event.eventDate);
  const upcoming = isFuture(new Date(event.eventDate)) || isToday(new Date(event.eventDate));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
      {/* Color stripe by category */}
      <div className={`h-1.5 w-full ${
        event.category === 'ENVIRONMENT' ? 'bg-green-400' :
        event.category === 'CLEANUP'     ? 'bg-blue-400'  :
        event.category === 'HEALTH'      ? 'bg-red-400'   :
        event.category === 'EDUCATION'   ? 'bg-yellow-400':
        'bg-gray-300'
      }`} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Date box */}
          <div className="shrink-0 flex flex-col items-center justify-center bg-brand-50 border border-brand-100 rounded-xl w-14 py-2">
            <span className="text-[10px] font-bold text-brand-400 uppercase">
              {format(new Date(event.eventDate), 'MMM')}
            </span>
            <span className="text-xl font-extrabold text-brand-700 leading-tight">
              {format(new Date(event.eventDate), 'd')}
            </span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>
              <CategoryBadge cat={event.category} />
            </div>
            {event.description && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{event.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              {event.cityName && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.cityName}</span>
              )}
              <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{dateStr}</span>
              <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" />{event.participantCount} going</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <Avatar name={event.organizerName} size="sm" />
            <span className="text-xs text-gray-500">by <span className="font-semibold text-gray-700">{event.organizerName}</span></span>
          </div>
          {upcoming && (
            <button
              onClick={() => join(event.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateEventForm = ({ onClose }) => {
  const [form, setForm] = useState({ title: '', description: '', eventDate: '', cityName: '', category: 'ENVIRONMENT' });
  const { mutate: create, isPending } = useCreateEvent();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.eventDate) return;
    create({ ...form, cityName: form.cityName || null }, { onSuccess: onClose });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={submit} className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-brand-800">Create an Event</p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      <input value={form.title} onChange={set('title')} placeholder="Event title *" maxLength={150}
        className="w-full text-sm border border-brand-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition" />

      <textarea value={form.description} onChange={set('description')} placeholder="Description (optional)" rows={2} maxLength={500}
        className="w-full text-sm border border-brand-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition" />

      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={form.eventDate} onChange={set('eventDate')} min={today}
          className="text-sm border border-brand-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition" />
        <input value={form.cityName} onChange={set('cityName')} placeholder="City / Area"
          className="text-sm border border-brand-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition" />
      </div>

      <div className="flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map((cat) => (
          <button key={cat.id} type="button" onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              form.category === cat.id ? 'border-brand-400 bg-brand-100 text-brand-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl">Cancel</button>
        <button type="submit" disabled={isPending || !form.title.trim() || !form.eventDate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
          Create Event
        </button>
      </div>
    </form>
  );
};

const EventsTab = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: events, isLoading, error } = useEvents();

  return (
    <div className="flex flex-col gap-3">
      {showForm ? (
        <CreateEventForm onClose={() => setShowForm(false)} />
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md shadow-brand-200 transition-all">
          <Plus className="w-4 h-4" /> Create Event
        </button>
      )}

      {isLoading && [1,2,3].map((i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
      {error && <p className="text-center py-10 text-gray-400 text-sm">Could not load events.</p>}
      {!isLoading && !error && events?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 font-semibold">No upcoming events</p>
          <p className="text-gray-400 text-sm mt-1">Organize a clean air walk or tree planting!</p>
        </div>
      )}
      {events?.map((e) => <EventCard key={e.id} event={e} />)}
    </div>
  );
};

//  TAB 3: Members 

const MembersTab = () => {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3,4,5].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!members.length) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">👥</p>
      <p className="text-gray-500 font-semibold">No members yet</p>
      <p className="text-gray-400 text-sm mt-1">Check in daily to appear here!</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Top Active Members</p>
      {members.map((m, idx) => (
        <div key={m.rank} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
          m.isMe ? 'bg-brand-50 border-brand-200 ring-2 ring-brand-200' : 'bg-white border-gray-100'
        }`}>
          {/* Rank */}
          <div className="w-8 text-center shrink-0">
            {idx === 0 ? <span className="text-xl">🥇</span> :
             idx === 1 ? <span className="text-xl">🥈</span> :
             idx === 2 ? <span className="text-xl">🥉</span> :
             <span className="text-sm font-bold text-gray-400">#{m.rank}</span>}
          </div>

          <Avatar name={m.name} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {m.name}
              {m.isMe && <span className="ml-1.5 text-[10px] font-semibold text-brand-500 bg-brand-100 px-1.5 py-0.5 rounded-full">you</span>}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-orange-500 font-semibold">🔥 {m.currentStreak}d streak</span>
              <span className="flex gap-0.5">
                {m.badges.slice(0, 3).map((b) => (
                  <span key={b} className="text-xs">{BADGE_EMOJI[b] ?? '🏅'}</span>
                ))}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-base font-extrabold text-brand-700 tabular-nums">{m.totalPoints}</p>
            <p className="text-[10px] text-gray-400">points</p>
          </div>
        </div>
      ))}
    </div>
  );
};

//  Community Page 

const TABS = [
  { id: 'feed',    label: 'Feed',    icon: Newspaper   },
  { id: 'events',  label: 'Events',  icon: Calendar    },
  { id: 'members', label: 'Members', icon: Users       },
];

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="min-h-screen page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            Community
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Share reports, join events, connect with members
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'feed'    && <FeedTab />}
        {activeTab === 'events'  && <EventsTab />}
        {activeTab === 'members' && <MembersTab />}

      </div>
    </div>
  );
};

export default CommunityPage;
