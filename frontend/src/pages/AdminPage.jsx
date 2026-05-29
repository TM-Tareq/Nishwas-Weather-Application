import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MessageSquare, Server,
  Shield, ShieldOff, Trash2, Search, RefreshCw,
  ArrowLeft, TrendingUp, Activity, Database,
  CheckCircle2, XCircle, Crown, Star, Zap,
  ChevronUp, ChevronDown, Clock, MapPin, Heart,
  AlertTriangle, LogOut, Eye,
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import useAuthStore from '@/features/auth/store/authStore';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const AQI_LABEL = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
const AQI_COLOR = { 1: '#10b981', 2: '#f59e0b', 3: '#f97316', 4: '#ef4444', 5: '#a855f7' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateShort = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};
const truncate = (str, n = 60) => str && str.length > n ? str.slice(0, n) + '…' : (str ?? '');

// ── KPI card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, gradient, loading }) => (
  <div className="rounded-2xl overflow-hidden flex-1 min-w-0"
    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} bg-opacity-20`}
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <Icon className="w-5 h-5 text-white/70" />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-20 rounded-lg bg-white/10 animate-pulse mb-1" />
        : <p className="text-3xl font-black text-white mb-1">{value?.toLocaleString() ?? '—'}</p>
      }
      <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">{label}</p>
      {sub && <p className="text-[11px] text-emerald-400 mt-1">{sub}</p>}
    </div>
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, count, onRefresh, loading, children }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      {count != null && (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
          {count.toLocaleString()}
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {children}
      <button onClick={onRefresh} disabled={loading}
        className="p-2 rounded-xl text-white/40 hover:text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  </div>
);

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) =>
  role === 'ADMIN'
    ? <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full"
        style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.35)' }}>
        <Crown className="w-3 h-3" /> Admin
      </span>
    : <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
        <Shield className="w-3 h-3" /> User
      </span>;

// ── Confirm button (two-click pattern) ───────────────────────────────────────
const ConfirmBtn = ({ onConfirm, icon: Icon, label, colorClass = 'text-red-400 hover:text-red-300', title }) => {
  const [pending, setPending] = useState(false);
  return pending
    ? <button onClick={() => { onConfirm(); setPending(false); }}
        className="text-[11px] font-bold text-red-400 border border-red-500/40 rounded-lg px-2 py-0.5 hover:bg-red-500/10 transition-all"
        onBlur={() => setTimeout(() => setPending(false), 200)}>
        Confirm
      </button>
    : <button onClick={() => setPending(true)} title={title}
        className={`p-1.5 rounded-lg transition-colors ${colorClass}`}
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <Icon className="w-3.5 h-3.5" />
      </button>;
};

// ── TABLE wrapper ─────────────────────────────────────────────────────────────
const Table = ({ headers, children, loading, empty }) => (
  <div className="rounded-2xl overflow-hidden"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {headers.map((h) => (
            <th key={h} className="text-left px-4 py-3 text-[10px] font-extrabold text-white/35 uppercase tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {headers.map((h) => (
                  <td key={h} className="px-4 py-3.5">
                    <div className="h-4 rounded bg-white/8 animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
              </tr>
            ))
          : children
        }
        {!loading && empty && (
          <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-white/25 text-sm">{empty}</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

// ── TR helper ────────────────────────────────────────────────────────────────
const TR = ({ children }) => (
  <tr className="transition-colors hover:bg-white/[0.03]"
    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    {children}
  </tr>
);
const TD = ({ children, className = '' }) => (
  <td className={`px-4 py-3.5 ${className}`}>{children}</td>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Main AdminPage
// ─────────────────────────────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const [section, setSection] = useState('overview');

  // Data state
  const [overview, setOverview]   = useState(null);
  const [users, setUsers]         = useState([]);
  const [posts, setPosts]         = useState([]);
  const [sysStatus, setSysStatus] = useState(null);

  // UI state
  const [loading, setLoading]     = useState({ overview: false, users: false, posts: false, sys: false });
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [userSort, setUserSort]   = useState({ key: 'createdAt', dir: 'desc' });
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    setLoading(l => ({ ...l, overview: true }));
    try {
      const { data } = await axiosInstance.get('/admin/overview');
      setOverview(data);
    } catch { showToast('Failed to load overview', 'error'); }
    finally { setLoading(l => ({ ...l, overview: false })); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(l => ({ ...l, users: true }));
    try {
      const { data } = await axiosInstance.get('/admin/users');
      setUsers(data);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(l => ({ ...l, users: false })); }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(l => ({ ...l, posts: true }));
    try {
      const { data } = await axiosInstance.get('/admin/posts');
      setPosts(data);
    } catch { showToast('Failed to load posts', 'error'); }
    finally { setLoading(l => ({ ...l, posts: false })); }
  }, []);

  const loadSystem = useCallback(async () => {
    setLoading(l => ({ ...l, sys: true }));
    const start = Date.now();
    try {
      await axiosInstance.get('/admin/overview');
      setSysStatus({ ok: true, latency: Date.now() - start });
    } catch {
      setSysStatus({ ok: false, latency: null });
    }
    finally { setLoading(l => ({ ...l, sys: false })); }
  }, []);

  // Load on section change
  useEffect(() => {
    if (section === 'overview') loadOverview();
    if (section === 'users')    loadUsers();
    if (section === 'posts')    loadPosts();
    if (section === 'system')   { loadSystem(); loadOverview(); }
  }, [section, loadOverview, loadUsers, loadPosts, loadSystem]);

  // ── User actions ────────────────────────────────────────────────────────────
  const handleToggleRole = async (u) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const { data } = await axiosInstance.put(`/admin/users/${u.id}/role`, { role: newRole });
      setUsers(prev => prev.map(x => x.id === u.id ? data : x));
      showToast(`${u.name} is now ${newRole}`);
    } catch { showToast('Role update failed', 'error'); }
  };

  const handleDeleteUser = async (u) => {
    try {
      await axiosInstance.delete(`/admin/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      if (overview) setOverview(o => ({ ...o, totalUsers: o.totalUsers - 1 }));
      showToast(`${u.name} deleted`);
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleDeletePost = async (p) => {
    try {
      await axiosInstance.delete(`/admin/posts/${p.id}`);
      setPosts(prev => prev.filter(x => x.id !== p.id));
      if (overview) setOverview(o => ({ ...o, totalPosts: o.totalPosts - 1 }));
      showToast('Post removed');
    } catch { showToast('Delete failed', 'error'); }
  };

  // ── Filtered / sorted data ──────────────────────────────────────────────────
  const filteredUsers = users
    .filter(u => {
      const q = userSearch.toLowerCase();
      return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const { key, dir } = userSort;
      let av = a[key], bv = b[key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1  : -1;
      return 0;
    });

  const filteredPosts = posts.filter(p => {
    const q = postSearch.toLowerCase();
    return !q
      || p.content?.toLowerCase().includes(q)
      || p.authorName?.toLowerCase().includes(q)
      || p.cityName?.toLowerCase().includes(q);
  });

  const toggleSort = (key) => setUserSort(s =>
    s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
  );
  const SortIcon = ({ k }) => userSort.key === k
    ? (userSort.dir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)
    : null;

  // ── Nav items ────────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'overview', label: 'Overview',    Icon: LayoutDashboard },
    { id: 'users',    label: 'Users',        Icon: Users           },
    { id: 'posts',    label: 'Posts',        Icon: MessageSquare   },
    { id: 'system',   label: 'System',       Icon: Server          },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#090D16', fontFamily: 'inherit' }}>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold transition-all
          ${toast.type === 'error'
            ? 'bg-red-500/20 border border-red-500/40 text-red-300'
            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Brand */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-none">Nishwas</p>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-none mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                  ${active
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                style={active ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)' } : {}}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-400' : ''}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-left">
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>
          <button onClick={() => { logout(); navigate('/auth'); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all text-left">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          {/* Logged in as */}
          <div className="mt-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Signed in as</p>
            <p className="text-xs font-bold text-white/80 truncate">{user?.name}</p>
            <p className="text-[10px] text-white/35 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">

        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{ background: 'rgba(9,13,22,0.9)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
          <div>
            <h1 className="text-xl font-black text-white capitalize">
              {NAV.find(n => n.id === section)?.label}
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role="ADMIN" />
          </div>
        </div>

        <div className="px-8 py-6">

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {section === 'overview' && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="flex gap-4">
                <KpiCard icon={Users}       label="Total Users"    value={overview?.totalUsers}        gradient="from-blue-500 to-indigo-500"   loading={loading.overview} />
                <KpiCard icon={TrendingUp}  label="New This Week"  value={overview?.newThisWeek}       gradient="from-emerald-500 to-teal-500"  loading={loading.overview} sub={overview?.newThisWeek > 0 ? `+${overview.newThisWeek} in last 7 days` : null} />
                <KpiCard icon={MessageSquare} label="Community Posts" value={overview?.totalPosts}     gradient="from-violet-500 to-purple-600" loading={loading.overview} />
                <KpiCard icon={Activity}    label="Health Entries" value={overview?.totalHealthEntries} gradient="from-orange-500 to-red-500"   loading={loading.overview} />
                <KpiCard icon={Zap}         label="Total Check-ins" value={overview?.totalCheckIns}   gradient="from-cyan-500 to-sky-500"      loading={loading.overview} />
              </div>

              {/* Recent rows */}
              <div className="grid grid-cols-2 gap-5">
                {/* Recent Users */}
                <div>
                  <SectionHeader title="Recent Users" onRefresh={loadOverview} loading={loading.overview} />
                  <div className="space-y-2">
                    {loading.overview
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                        ))
                      : (overview?.recentUsers ?? []).map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold text-sm"
                              style={{ background: 'linear-gradient(135deg,#7c3aed,#10b981)', color: '#fff' }}>
                              {u.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{u.name}</p>
                              <p className="text-[11px] text-white/35 truncate">{u.email}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <RoleBadge role={u.role} />
                              <span className="text-[10px] text-white/30">{fmtDateShort(u.createdAt)}</span>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* Recent Posts */}
                <div>
                  <SectionHeader title="Recent Posts" onRefresh={loadOverview} loading={loading.overview} />
                  <div className="space-y-2">
                    {loading.overview
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                        ))
                      : (overview?.recentPosts ?? []).map(p => (
                          <div key={p.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white/80 truncate">{p.authorName}</p>
                              <p className="text-[11px] text-white/40 leading-snug line-clamp-2 mt-0.5">{p.content}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {p.cityName && (
                                <p className="text-[10px] text-white/30 flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />{p.cityName}
                                </p>
                              )}
                              <p className="text-[10px] text-white/25 mt-0.5">{fmtDateShort(p.createdAt)}</p>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ────────────────────────────────────────────────────── */}
          {section === 'users' && (
            <div>
              <SectionHeader title="User Management" count={filteredUsers.length} onRefresh={loadUsers} loading={loading.users}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <input
                    value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search name or email…"
                    className="pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 220 }}
                  />
                </div>
              </SectionHeader>

              <Table
                headers={['User', 'Role', 'Points', 'Check-ins', 'Posts', 'Streak', 'Joined', 'Actions']}
                loading={loading.users}
                empty={userSearch ? 'No users match your search.' : 'No users found.'}
              >
                {filteredUsers.map(u => (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold text-xs"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#10b981)', color: '#fff' }}>
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate max-w-[140px]">{u.name}</p>
                          <p className="text-[11px] text-white/35 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD><RoleBadge role={u.role} /></TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm font-bold text-white/80">{u.points}</span>
                      </div>
                    </TD>
                    <TD><span className="text-sm text-white/70">{u.checkIns}</span></TD>
                    <TD><span className="text-sm text-white/70">{u.postCount}</span></TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="text-sm text-white/70">{u.streak}d</span>
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1 text-white/40">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{fmtDate(u.createdAt)}</span>
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleRole(u)}
                          title={u.role === 'ADMIN' ? 'Revoke admin' : 'Grant admin'}
                          className={`p-1.5 rounded-lg transition-colors ${u.role === 'ADMIN' ? 'text-violet-400 hover:text-violet-300' : 'text-white/30 hover:text-violet-400'}`}
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {u.role === 'ADMIN' ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        </button>
                        {/* Don't allow deleting yourself */}
                        {u.email !== user?.email && (
                          <ConfirmBtn icon={Trash2} onConfirm={() => handleDeleteUser(u)} title="Delete user" />
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </Table>
            </div>
          )}

          {/* ── POSTS ────────────────────────────────────────────────────── */}
          {section === 'posts' && (
            <div>
              <SectionHeader title="Post Moderation" count={filteredPosts.length} onRefresh={loadPosts} loading={loading.posts}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  <input
                    value={postSearch} onChange={e => setPostSearch(e.target.value)}
                    placeholder="Search posts…"
                    className="pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 220 }}
                  />
                </div>
              </SectionHeader>

              <Table
                headers={['#', 'Author', 'Content', 'City', 'AQI', 'Likes', 'Date', 'Remove']}
                loading={loading.posts}
                empty={postSearch ? 'No posts match your search.' : 'No posts found.'}
              >
                {filteredPosts.map((p, idx) => (
                  <TR key={p.id}>
                    <TD><span className="text-xs text-white/25 font-mono">{idx + 1}</span></TD>
                    <TD>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white/80 truncate max-w-[100px]">{p.authorName}</p>
                        <p className="text-[10px] text-white/30 truncate max-w-[100px]">{p.authorEmail}</p>
                      </div>
                    </TD>
                    <TD>
                      <p className="text-xs text-white/60 max-w-[220px] leading-relaxed">{truncate(p.content, 80)}</p>
                    </TD>
                    <TD>
                      {p.cityName
                        ? <div className="flex items-center gap-1 text-white/50"><MapPin className="w-3 h-3" /><span className="text-xs">{p.cityName}</span></div>
                        : <span className="text-white/20 text-xs">—</span>}
                    </TD>
                    <TD>
                      {p.aqiLevel
                        ? <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: AQI_COLOR[p.aqiLevel] + '28', color: AQI_COLOR[p.aqiLevel] }}>
                            {AQI_LABEL[p.aqiLevel]}
                          </span>
                        : <span className="text-white/20 text-xs">—</span>}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1 text-white/50">
                        <Heart className="w-3 h-3 text-pink-400" />
                        <span className="text-xs">{p.likes}</span>
                      </div>
                    </TD>
                    <TD><span className="text-xs text-white/35">{fmtDate(p.createdAt)}</span></TD>
                    <TD>
                      <ConfirmBtn icon={Trash2} onConfirm={() => handleDeletePost(p)} title="Delete post" />
                    </TD>
                  </TR>
                ))}
              </Table>
            </div>
          )}

          {/* ── SYSTEM ───────────────────────────────────────────────────── */}
          {section === 'system' && (
            <div className="space-y-5">
              <SectionHeader title="System Status" onRefresh={() => { loadSystem(); loadOverview(); }} loading={loading.sys || loading.overview} />

              {/* Status cards row */}
              <div className="grid grid-cols-3 gap-4">
                {/* API Health */}
                <div className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-white/50" />
                      <span className="text-sm font-bold text-white/70">API Health</span>
                    </div>
                    {loading.sys
                      ? <div className="w-20 h-6 rounded-lg bg-white/10 animate-pulse" />
                      : sysStatus?.ok
                        ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Online
                          </span>
                        : <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                            <span className="w-2 h-2 rounded-full bg-red-400" />Offline
                          </span>
                    }
                  </div>
                  <p className="text-3xl font-black text-white mb-1">
                    {sysStatus?.latency != null ? `${sysStatus.latency}ms` : '—'}
                  </p>
                  <p className="text-xs text-white/35">Response latency</p>
                </div>

                {/* Users stat */}
                <div className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-bold text-white/70">Database</span>
                  </div>
                  {loading.overview
                    ? <div className="h-8 w-24 rounded bg-white/10 animate-pulse mb-1" />
                    : <p className="text-3xl font-black text-white mb-1">{overview?.totalUsers ?? '—'}</p>
                  }
                  <p className="text-xs text-white/35">Total users in DB</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      ['Posts', overview?.totalPosts],
                      ['Health', overview?.totalHealthEntries],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{lbl}</p>
                        <p className="text-sm font-bold text-white">{loading.overview ? '…' : (val ?? '—')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* App info */}
                <div className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-bold text-white/70">Application</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      ['App',       'Nishwas Weather'],
                      ['Stack',     'React 19 + Spring Boot 3'],
                      ['Auth',      'JWT (stateless)'],
                      ['DB',        'MySQL · Hibernate'],
                      ['Maps',      'Leaflet + Windy embed'],
                      ['Weather',   'OpenWeatherMap API'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-xs">
                        <span className="text-white/35 font-medium">{k}</span>
                        <span className="text-white/70 font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin accounts */}
              <div>
                <h3 className="text-sm font-extrabold text-white/60 uppercase tracking-widest mb-3">Admin Accounts</h3>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {loading.users
                    ? <div className="p-6"><div className="h-4 w-48 rounded bg-white/10 animate-pulse" /></div>
                    : users.filter(u => u.role === 'ADMIN').length === 0
                      ? <div className="px-5 py-4 text-sm text-white/25">No admin accounts found.</div>
                      : users.filter(u => u.role === 'ADMIN').map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-5 py-3.5"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold"
                              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{u.name}</p>
                              <p className="text-xs text-white/35">{u.email}</p>
                            </div>
                            <RoleBadge role="ADMIN" />
                          </div>
                        ))
                  }
                </div>
              </div>

              {/* Warning banner */}
              <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-300 mb-0.5">Admin Access Control</p>
                  <p className="text-xs text-yellow-400/60 leading-relaxed">
                    Admin role is granted by setting the <code className="bg-black/30 px-1 rounded">ADMIN_EMAIL</code> environment variable on the server,
                    or by promoting a user via the Users tab. Keep admin accounts to a minimum.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminPage;
