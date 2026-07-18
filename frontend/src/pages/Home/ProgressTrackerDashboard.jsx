import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import moment from "moment";
import {
  Github, Linkedin, Twitter, Globe, GraduationCap,
  MapPin, BookOpen, Video, FileText, ArrowRight,
  CheckCircle, PlusCircle, Settings, Code2, Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";

/* ── Donut (SVG, zero deps) ─────────────────────────────────────────────── */
const DonutChart = ({ value, max, size = 84, stroke = 9, color = "#7c3aed" }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = max > 0 ? Math.min(value / max, 1) * circ : 0;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff0d" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <span className="absolute text-base font-bold text-white">{value}</span>
    </div>
  );
};

/* ── Horizontal topic bar ────────────────────────────────────────────────── */
const TopicBar = ({ topic, count, max }) => {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = pct === 100 ? "bg-violet-500" : pct >= 60 ? "bg-fuchsia-500" : "bg-blue-500";
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-right text-[11px] text-gray-400 truncate shrink-0">{topic}</span>
      <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
        <div className={`h-full ${color} rounded transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-7 text-[11px] text-gray-300 font-semibold text-right shrink-0">{count}</span>
    </div>
  );
};

/* ── Small stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-5 flex items-center gap-3">
    <Icon size={20} className={accent} />
    <div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtSheet = (id) =>
  (id || "Unknown").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

function buildTopics(progress) {
  const map = {};
  progress.forEach(s => {
    Object.entries(s.completedTopics || {}).forEach(([t, v]) => {
      map[t] = (map[t] || 0) + (typeof v === "number" ? v : v?.solved || 0);
    });
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([topic, count]) => ({ topic, count }));
}

function totalSolved(progress) {
  return progress.reduce((acc, s) =>
    acc + Object.values(s.completedTopics || {}).reduce((sum, v) =>
      sum + (typeof v === "number" ? v : v?.solved || 0), 0), 0);
}

/* ── Main ────────────────────────────────────────────────────────────────── */
const ProgressTrackerDashboard = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [sheetProgress, setSheetProgress] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sRes, rRes, pRes] = await Promise.all([
          axiosInstance.get(API_PATHS.SESSION.GET_ALL).catch(() => ({ data: [] })),
          axiosInstance.get(API_PATHS.RESUME.GET_ALL).catch(() => ({ data: { resumes: [] } })),
          axiosInstance.get("/api/user/sheet-progress").catch(() => ({ data: { progressList: [] } })),
        ]);
        setSessions(sRes.data || []);
        setResumes(rRes.data?.resumes || []);
        setSheetProgress(
          (pRes.data?.progressList || [])
            .filter(p => p.percentage > 0 || p.followed)
            .sort((a, b) => b.percentage - a.percentage)
        );
      } catch {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
      </div>
    );
  }

  const topicData   = buildTopics(sheetProgress);
  const maxCount    = topicData[0]?.count || 1;
  const solved      = totalSolved(sheetProgress);
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.name || "PrepPilot User";
  const initial  = displayName.charAt(0).toUpperCase();
  const socials  = user?.profileDetails?.socials || {};
  const edu      = user?.educationDetails || {};

  return (
    <div className="min-h-full bg-[var(--color-background)] dark:bg-[#0b1120] text-gray-900 dark:text-white">
      <div className="max-w-[1360px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* ══ TOP ROW: Profile + Stats ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

          {/* Profile card */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-3xl font-bold text-white">
                  {initial}
                </div>
              )}
              <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0b1120] ${user?.isEmailVerified ? "bg-emerald-400" : "bg-gray-400"}`} />
            </div>

            {/* Name + ID */}
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{displayName}</h2>
              {user?.prepPilotId && <p className="text-xs text-violet-400">@{user.prepPilotId}</p>}
              {user?.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{user.bio}</p>}
            </div>

            {/* Socials */}
            {(socials.github || socials.linkedin || socials.twitter || socials.portfolio) && (
              <div className="flex items-center gap-3 justify-center">
                {socials.github    && <a href={socials.github}    target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Github   size={15} /></a>}
                {socials.linkedin  && <a href={socials.linkedin}  target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors"><Linkedin size={15} /></a>}
                {socials.twitter   && <a href={socials.twitter}   target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-400  transition-colors"><Twitter  size={15} /></a>}
                {socials.portfolio && <a href={socials.portfolio} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-violet-400 transition-colors"><Globe    size={15} /></a>}
              </div>
            )}

            {/* Meta */}
            <div className="w-full text-left space-y-1.5 pt-3 border-t border-gray-100 dark:border-white/8">
              {user?.country && (
                <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={11} />{user.country}</div>
              )}
              {edu.school && (
                <div className="flex items-center gap-2 text-xs text-gray-500"><GraduationCap size={11} /><span className="truncate">{edu.school}</span></div>
              )}
              {edu.degree && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <BookOpen size={11} />
                  {edu.degree}{edu.branch ? ` · ${edu.branch}` : ""}{edu.graduationYear ? ` (${edu.graduationYear})` : ""}
                </div>
              )}
            </div>

            <button onClick={() => navigate("/settings")}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-violet-400/50 transition-all">
              <Settings size={12} /> Edit Profile
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 content-start">
            <StatCard label="Mock Sessions"  value={sessions.length}      icon={Video}       accent="text-violet-400" />
            <StatCard label="Saved Resumes"  value={resumes.length}       icon={FileText}    accent="text-blue-400" />
            <StatCard label="Active Sheets"  value={sheetProgress.length} icon={Code2}       accent="text-emerald-400" />
            <StatCard label="Topics Solved"  value={solved}               icon={CheckCircle} accent="text-fuchsia-400" />

            {/* Quick actions */}
            <button onClick={() => navigate("/role-prep")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
              <PlusCircle size={15} /> New Session
            </button>
            <button onClick={() => navigate("/coding-sheets")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/5 text-sm font-semibold transition-colors">
              <Code2 size={15} /> DSA Sheets
            </button>
          </div>
        </div>

        {/* ══ MIDDLE ROW: Analysis + Sessions ══════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* DSA Topic Analysis */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Code2 size={15} className="text-violet-400" /> DSA Topic Analysis
              </h2>
              <button onClick={() => navigate("/coding-sheets")}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                View Sheets <ArrowRight size={11} />
              </button>
            </div>
            {topicData.length > 0 ? (
              <div className="space-y-2.5">
                {topicData.map(({ topic, count }) => (
                  <TopicBar key={topic} topic={topic} count={count} max={maxCount} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Code2 size={28} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className="text-sm text-gray-500">Follow a DSA sheet to see topic breakdown.</p>
                <button onClick={() => navigate("/coding-sheets")}
                  className="mt-3 px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
                  Explore Sheets
                </button>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Video size={15} className="text-fuchsia-400" /> Recent Sessions
              </h2>
              <Link to="/role-prep" className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 transition-colors">
                View All <ArrowRight size={11} />
              </Link>
            </div>
            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.slice(0, 4).map(s => (
                  <button key={s._id} onClick={() => navigate(`/interview-prep/${s._id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/8 hover:border-fuchsia-400/30 hover:bg-fuchsia-500/5 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center shrink-0">
                      <Video size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-fuchsia-400 transition-colors">{s.role || "Untitled"}</p>
                      <p className="text-[11px] text-gray-500 truncate">{Array.isArray(s.topicsToFocus) ? s.topicsToFocus.join(", ") : s.topicsToFocus || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-gray-500">{s.questions?.length || 0}Q</p>
                      <p className="text-[10px] text-gray-400">{s.updatedAt ? moment(s.updatedAt).fromNow() : ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Video size={28} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className="text-sm text-gray-500 mb-3">No sessions yet.</p>
                <button onClick={() => navigate("/role-prep")}
                  className="px-4 py-1.5 text-xs font-semibold bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-colors">
                  Create Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ BOTTOM ROW: Sheet Progress + Solved Donuts + Resumes ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Sheet Progress */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <CheckCircle size={15} className="text-emerald-400" /> Sheet Progress
              </h2>
              <button onClick={() => navigate("/coding-sheets")}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">+ Add</button>
            </div>
            {sheetProgress.length > 0 ? (
              <div className="space-y-3.5">
                {sheetProgress.slice(0, 5).map(p => (
                  <button key={p.sheetId} onClick={() => navigate(`/sheet/${p.sheetId}`)} className="w-full text-left group">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors truncate max-w-[70%]">{fmtSheet(p.sheetId)}</span>
                      <span className="text-emerald-400 font-bold shrink-0">{Math.round(p.percentage)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${p.percentage}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">Follow a sheet to track progress</p>
            )}
          </div>

          {/* Problems Solved (donuts) */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
              <Star size={15} className="text-amber-400" /> Problems Solved
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2.5">Interview Prep</p>
                <div className="flex items-center gap-4">
                  <DonutChart value={sessions.length} max={Math.max(sessions.length, 10)} color="#a855f7" />
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-8">
                      <span className="text-violet-400 font-semibold">Sessions</span>
                      <span className="text-gray-900 dark:text-white font-bold">{sessions.length}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-blue-400 font-semibold">Resumes</span>
                      <span className="text-gray-900 dark:text-white font-bold">{resumes.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/8 pt-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2.5">DSA Sheets</p>
                <div className="flex items-center gap-4">
                  <DonutChart value={solved} max={Math.max(solved, 100)} color="#10b981" />
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-8">
                      <span className="text-emerald-400 font-semibold">Started</span>
                      <span className="text-gray-900 dark:text-white font-bold">{sheetProgress.filter(s => s.percentage < 40).length}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-yellow-400 font-semibold">Midway</span>
                      <span className="text-gray-900 dark:text-white font-bold">{sheetProgress.filter(s => s.percentage >= 40 && s.percentage < 80).length}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-red-400 font-semibold">Advanced</span>
                      <span className="text-gray-900 dark:text-white font-bold">{sheetProgress.filter(s => s.percentage >= 80).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumes */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <FileText size={15} className="text-blue-400" /> Resumes
              </h2>
              <button onClick={() => navigate("/resume-builder")}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                <PlusCircle size={11} /> New
              </button>
            </div>
            {resumes.length > 0 ? (
              <div className="space-y-2">
                {resumes.slice(0, 4).map(r => (
                  <button key={r._id} onClick={() => navigate("/resume-builder")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/8 hover:border-blue-400/30 hover:bg-blue-500/5 transition-all text-left group">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{r.title || "My Resume"}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{moment(r.updatedAt).fromNow()}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText size={28} className="text-gray-300 dark:text-white/20 mb-2" />
                <p className="text-sm text-gray-500 mb-3">No resumes yet.</p>
                <button onClick={() => navigate("/resume-builder")}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Build Resume
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgressTrackerDashboard;
