import React, { useState, useEffect } from "react";
import { Briefcase, Heart, MessageSquare, Plus, Share2, MapPin, DollarSign, Calendar, Filter, ArrowUpDown, Send, Search } from "lucide-react";
import { saveAppStateToStore, getActiveFirestore, getActiveAuth } from "../lib/firebaseSync";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";

export interface JobPost {
  id: string;
  roleTitle: string;
  companyName: string;
  location: string;
  salaryRate: string;
  description: string;
  authorName: string;
  likes: number;
  likesMap?: Record<string, boolean>; // per-user likes: { uid: true }
  userLiked?: boolean; // legacy only — do NOT use for current user check
  comments: JobComment[];
  createdAt: string;
  category: "tech" | "growth" | "design" | "other";
}

export interface JobComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

const DEFAULT_JOBS: JobPost[] = [];

export default function HiringBoard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uid, setUid] = useState<string>(() => {
    const currentUid = getActiveAuth()?.currentUser?.uid;
    return currentUid || "anon_" + (localStorage.getItem("hustle_hub_logged_name") || "user");
  });

  useEffect(() => {
    const auth = getActiveAuth();
    if (!auth) return;
    if (auth.currentUser?.uid) setUid(auth.currentUser.uid);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.uid) setUid(user.uid);
    });
    return unsub;
  }, []);
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("likes");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRate, setSalaryRate] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState<"tech" | "growth" | "design" | "other">("tech");
  const [commentText, setCommentText] = useState("");

  const getActiveProfile = () => {
    const savedProfile = localStorage.getItem("hustle_hub_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return String(parsed["Name"] || "");
      } catch {
        // fallback
      }
    }
    return localStorage.getItem("hustle_hub_logged_name") || "Guest";
  };

  useEffect(() => {
    const db = getActiveFirestore();
    if (!db) {
      const saved = localStorage.getItem("hustle_hub_jobs");
      if (saved) {
        try { setJobs(JSON.parse(saved)); } catch { setJobs(DEFAULT_JOBS); }
      } else {
        setJobs(DEFAULT_JOBS);
      }
      return;
    }

    const unsub = onSnapshot(doc(db, "founderdeck_app_state", "jobs"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          setJobs(data.value);
        }
      } else {
        saveAppStateToStore("jobs", DEFAULT_JOBS);
        setJobs(DEFAULT_JOBS);
      }
    });

    return () => unsub();
  }, []);

  const saveJobs = (newJobs: JobPost[]) => {
    setJobs(newJobs);
    localStorage.setItem("hustle_hub_jobs", JSON.stringify(newJobs));
    void saveAppStateToStore("jobs", newJobs);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const profileName = getActiveProfile();
    if (!roleTitle.trim() || !companyName.trim() || !profileName) return;

    const fresh: JobPost = {
      id: "job_" + Date.now(),
      roleTitle: roleTitle.trim(),
      companyName: companyName.trim(),
      location: location.trim() || "Remote",
      salaryRate: salaryRate.trim() || "Undisclosed",
      description: description.trim(),
      authorName: profileName,
      category: categoryInput,
      likes: 0,
      likesMap: {},
      createdAt: new Date().toISOString().split("T")[0],
      comments: []
    };

    saveJobs([fresh, ...jobs]);
    setShowForm(false);
    setRoleTitle("");
    setCompanyName("");
    setLocation("");
    setSalaryRate("");
    setDescription("");
  };

  const handleLike = (jobId: string) => {
    const updated = jobs.map((j) => {
      if (j.id !== jobId) return j;
      const currentMap: Record<string, boolean> = { ...(j.likesMap || {}) };
      if (currentMap[uid]) {
        delete currentMap[uid];
      } else {
        currentMap[uid] = true;
      }
      const likesCount = Object.keys(currentMap).length;
      return { ...j, likesMap: currentMap, likes: likesCount };
    });
    saveJobs(updated);
  };

  const handleAddComment = (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    const profileName = getActiveProfile();
    if (!profileName.trim() || !commentText.trim()) return;

    const newComment: JobComment = {
      id: "jc_" + Date.now(),
      author: profileName.trim(),
      text: commentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = jobs.map((j) => {
      if (j.id === jobId) {
        return { ...j, comments: [...j.comments, newComment] };
      }
      return j;
    });

    saveJobs(updated);
    setCommentText("");
  };

  const handleShare = (job: JobPost) => {
    const textToCopy = `The Founder's Club Hiring: ${job.roleTitle} at ${job.companyName}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(job.id);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const filteredJobs = jobs
    .filter((j) => {
      const matchesCategory = categoryFilter === "all" || j.category === categoryFilter;
      const matchesSearch = searchQuery.trim() === "" || 
        j.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = locationFilter.trim() === "" || 
        j.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const jobDate = new Date(j.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 3600 * 24));
        
        if (dateFilter === "today") matchesDate = diffDays === 0;
        else if (dateFilter === "week") matchesDate = diffDays <= 7;
        else if (dateFilter === "month") matchesDate = diffDays <= 30;
      }

      return matchesCategory && matchesSearch && matchesLocation && matchesDate;
    })
    .sort((a, b) => {
      if (orderBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (orderBy === "likes") return b.likes - a.likes;
      return 0;
    });

  return (
    <div className="bg-slate-50 min-h-full p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Hiring Board</h1>
            <p className="text-slate-500 text-sm mt-1">Post roles and find co-founders.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Post an Opening
          </button>
        </header>

        {/* Filters Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search roles, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            {/* Category */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="tech">Tech</option>
                <option value="growth">Growth</option>
                <option value="design">Design</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex gap-1">
                {["all", "today", "week", "month"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      dateFilter === f ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-0 focus:ring-0 cursor-pointer text-slate-600"
              >
                <option value="newest">Newest First</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Title</label>
                  <input
                    type="text" required value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g. Lead Developer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company/Startup</label>
                  <input
                    type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={categoryInput} onChange={(e) => setCategoryInput(e.target.value as any)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="tech">Tech</option>
                    <option value="growth">Growth</option>
                    <option value="design">Design</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salary/Rate</label>
                  <input
                    type="text" value={salaryRate} onChange={(e) => setSalaryRate(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g. $100k - $120k"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                  <input
                    type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g. Remote / NYC"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                  placeholder="What are you looking for?"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Post Role</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {filteredJobs.length === 0 && !showForm && (
            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
              <p className="text-slate-400 font-medium">No job openings yet. Share your first role!</p>
            </div>
          )}
          {filteredJobs.map((j) => (
            <div key={j.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black">{j.roleTitle}</h2>
                      <p className="text-emerald-600 font-bold text-sm">{j.companyName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{j.createdAt}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><DollarSign className="w-3 h-3" /> {j.salaryRate}</span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">{j.description}</p>
                
                <div className="pt-2 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold uppercase">{j.authorName.charAt(0)}</div>
                      <span className="text-xs font-bold text-slate-500">Posted by {j.authorName}</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(j.id)} className={`flex items-center gap-1.5 transition-colors ${j.likesMap?.[uid] ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}>
                        <Heart className={`w-4 h-4 ${j.likesMap?.[uid] ? "fill-current" : ""}`} />
                        <span className="text-xs font-bold">{j.likes}</span>
                      </button>
                      <button onClick={() => handleShare(j)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>

              <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => setExpandedCommentsId(expandedCommentsId === j.id ? null : j.id)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {j.comments.length} Replies
                </button>

                {expandedCommentsId === j.id && (
                  <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {j.comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">{c.author.charAt(0)}</div>
                          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black text-emerald-600">{c.author}</span>
                              <span className="text-[9px] text-slate-400">{c.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={(e) => handleAddComment(e, j.id)} className="relative mt-4">
                      <input
                        type="text" required placeholder="Ask a question or reply..."
                        value={commentText} onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"><Send className="w-4 h-4" /></button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
