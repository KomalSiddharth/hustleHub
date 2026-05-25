import React, { useState, useEffect } from "react";
import { Briefcase, Heart, MessageSquare, Plus, Share2, MapPin, DollarSign, Calendar, Filter, ArrowUpDown, Send } from "lucide-react";
import { saveAppStateToStore } from "../lib/firebaseSync";

export interface JobPost {
  id: string;
  roleTitle: string;
  companyName: string;
  location: string;
  salaryRate: string;
  description: string;
  authorName: string;
  likes: number;
  userLiked?: boolean;
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

const DEFAULT_JOBS: JobPost[] = [
  {
    id: "job_1",
    roleTitle: "Lead FullStack Dev (React / Cloud Run)",
    companyName: "Hyperion Alpha Group",
    location: "Remote NYC / London",
    salaryRate: "$140k - $170k + 0.5% Equity",
    description: "Looking for an expert to take over our web application infrastructure. Ideally familiar with Vite, Express middleware, persistent Firebase architectures, and real-time canvas layers. Join our small creator syndicate immediately!",
    authorName: "Marcus Thorne",
    likes: 12,
    createdAt: "2026-05-21",
    category: "tech",
    comments: [
      { id: "jc1", author: "Devon Ross", text: "Are you accepting builders located in APAC region?", timestamp: "2026-05-22" }
    ]
  },
  {
    id: "job_2",
    roleTitle: "SaaS Launch Growth Hacker (Contract)",
    companyName: "Solopreneur Labs",
    location: "Global Remote",
    salaryRate: "$60 / Hour + Performance bonuses",
    description: "Looking for a Growth Person with 3+ years experience to set up targeted email drip flows and cold automated campaigns on LinkedIn. Must be capable of analyzing metrics directly in shared dashboard sheets.",
    authorName: "Alice Dev",
    likes: 19,
    createdAt: "2026-05-24",
    category: "growth",
    comments: []
  },
  {
    id: "job_3",
    roleTitle: "Product Designer & UI Prototyper",
    companyName: "Vibelabs UX",
    location: "Bengaluru Hybrid",
    salaryRate: "$90k - $110k",
    description: "Seeking a designer with strong skills in Figma, Tailwind CSS component outputs, and sleek motion animations. Help us polish SaaS dashboard screens for launch.",
    authorName: "Karan Malhotra",
    likes: 8,
    createdAt: "2026-05-25",
    category: "design",
    comments: []
  }
];

export default function HiringBoard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("newest"); // "newest" | "oldest" | "likes"

  // Form input variables
  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRate, setSalaryRate] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [categoryInput, setCategoryInput] = useState<"tech" | "growth" | "design" | "other">("tech");

  // Commentary input
  const [commentText, setCommentText] = useState("");

  const getActiveProfile = () => {
    const savedProfile = localStorage.getItem("hustle_hub_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return String(parsed["Name"] || "");
      } catch {
        // fallback below
      }
    }
    return localStorage.getItem("hustle_hub_logged_name") || "";
  };

  useEffect(() => {
    // Attempt auto login prepopulate
    const loggedName = localStorage.getItem("hustle_hub_logged_name") || "";
    if (loggedName) {
      setAuthorName(loggedName);
    }

    const saved = localStorage.getItem("hustle_hub_jobs");
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch (e) {
        setJobs(DEFAULT_JOBS);
      }
    } else {
      setJobs(DEFAULT_JOBS);
    }
  }, []);

  const saveJobs = (newJobs: JobPost[]) => {
    setJobs(newJobs);
    localStorage.setItem("hustle_hub_jobs", JSON.stringify(newJobs));
    void saveAppStateToStore("jobs", newJobs);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim() || !companyName.trim() || !authorName.trim()) return;

    const fresh: JobPost = {
      id: "job_" + Date.now(),
      roleTitle: roleTitle.trim(),
      companyName: companyName.trim(),
      location: location.trim() || "Remote",
      salaryRate: salaryRate.trim() || "Undisclosed",
      description: description.trim(),
      authorName: authorName.trim(),
      category: categoryInput,
      likes: 1,
      userLiked: true,
      createdAt: new Date().toISOString().split("T")[0],
      comments: []
    };

    saveJobs([fresh, ...jobs]);
    setShowForm(false);

    // Reset keeping authorName if logged in
    setRoleTitle("");
    setCompanyName("");
    setLocation("");
    setSalaryRate("");
    setDescription("");
  };

  const handleLike = (jobId: string) => {
    const updated = jobs.map((j) => {
      if (j.id !== jobId) return j;

      if (j.userLiked) {
        return { ...j, likes: Math.max(0, j.likes - 1), userLiked: false };
      } else {
        return { ...j, likes: j.likes + 1, userLiked: true };
      }
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
      timestamp: new Date().toISOString().split("T")[0]
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
    const textToCopy = `Hustle Hub Hiring: ${job.roleTitle} at ${job.companyName} (${job.location}) - Compensation: ${job.salaryRate}.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(job.id);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2500);
  };

  // Filter & Sort Logic
  const filteredJobs = jobs
    .filter((j) => {
      if (categoryFilter === "all") return true;
      return j.category === categoryFilter;
    })
    .sort((a, b) => {
      if (orderBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (orderBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (orderBy === "likes") {
        return b.likes - a.likes;
      }
      return 0;
    });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 text-slate-800 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            Hiring
          </h3>
          <p className="text-xs text-slate-500">
            Post roles, collabs, freelance tasks, and co-founder openings.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            // Sync current login
            const loggedName = localStorage.getItem("hustle_hub_logged_name") || "";
            if (loggedName) {
              setAuthorName(loggedName);
            }
          }}
          className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center shadow-md shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Post an Opening</span>
        </button>
      </div>

      {/* Professional Search & Filters Control Strip */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs select-none">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Category Filter:
          </span>
          <div className="flex flex-wrap bg-slate-200/50 p-0.5 rounded-lg border border-slate-350/10">
            {[
              { id: "all", label: "All Hub Gigs" },
              { id: "tech", label: "Tech / Developers" },
              { id: "growth", label: "Growth / Marketing" },
              { id: "design", label: "Designers / Creators" },
              { id: "other", label: "Other Specialties" }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setCategoryFilter(btn.id)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  categoryFilter === btn.id
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-2.5 md:pt-0 mt-1 md:mt-0 border-slate-200">
          <span className="text-slate-500 text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort By:
          </span>
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="bg-white border border-slate-250 text-slate-750 py-1.5 px-3 rounded-md text-[11px] font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="newest">Posted Date: Newest First</option>
            <option value="oldest">Posted Date: Oldest First</option>
            <option value="likes">Most Upvotes / Likes</option>
          </select>
        </div>
      </div>

      {/* Creation form */}
      {showForm && (
        <form onSubmit={handleCreateJob} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs w-full text-left animate-fade-in">
          <h4 className="font-bold text-sm text-emerald-800 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>List a Creator Gig / Opening</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Job / Role Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Creator Content Marketer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Company / Creator Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stealth AI Lab"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Job Category *</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
              >
                <option value="tech">Tech (Dev/Eng/Software)</option>
                <option value="growth">Growth (SaaS/Marketing/Ads)</option>
                <option value="design">Design & Visual Creators</option>
                <option value="other">Other Unique Gigs</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Compensation / Budget</label>
              <input
                type="text"
                placeholder="e.g. $500 - $1000/mo"
                value={salaryRate}
                onChange={(e) => setSalaryRate(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Post Author *</label>
              <input
                type="text"
                required
                placeholder="Your Name (Co-founder)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Location Details</label>
              <input
                type="text"
                placeholder="e.g. Remote (UTC+2)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Description & Requirements *</label>
            <textarea
              required
              placeholder="Outline the core tasks, responsibilities, preferred developer or content creator background details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
            <button
               type="button"
               onClick={() => setShowForm(false)}
               className="px-3 py-1.5 rounded-lg bg-white border border-slate-250 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700 cursor-pointer"
            >
              Post Opening
            </button>
          </div>
        </form>
      )}

      {/* Single Card Per Row List Stack displaying gigs */}
      <div className="flex flex-col gap-4">
        {filteredJobs.map((j) => {
          const isCommentsExpanded = expandedCommentsId === j.id;
          const isCopied = copiedNotification === j.id;

          return (
            <div key={j.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-450 transition-all flex flex-col justify-between text-left space-y-4 shadow-3xs w-full">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="leading-tight">
                      <h4 className="font-black text-slate-900 text-sm select-all">{j.roleTitle}</h4>
                      <p className="text-xs text-indigo-650 font-bold flex items-center gap-1.5">
                        {j.companyName}
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                          Category: {j.category || "General"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0 font-medium self-start sm:self-auto flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {j.createdAt}
                  </span>
                </div>

                {/* Badges specifications strip */}
                <div className="flex flex-wrap gap-2 text-[10px] font-mono select-none pt-1">
                  <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-650 rounded-md px-2 py-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {j.location}
                  </span>
                  <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md px-2 py-0.5 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    {j.salaryRate}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-normal leading-relaxed select-text font-sans pt-1">
                  {j.description}
                </p>
                
                <div className="text-[10px] text-slate-500 font-mono text-left select-none pt-1">
                  Posted & managed by: <span className="font-bold underline text-indigo-600">{j.authorName}</span>
                </div>
              </div>

              {/* Interaction Strip */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 select-none">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(j.id)}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${
                      j.userLiked ? "text-rose-500 font-bold" : "hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${j.userLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                    <span>{j.likes}</span>
                  </button>

                  <button
                    onClick={() => setExpandedCommentsId(isCommentsExpanded ? null : j.id)}
                    className="flex items-center gap-1.5 hover:text-slate-800 transition cursor-pointer text-indigo-600"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Replies ({j.comments.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => handleShare(j)}
                  className={`flex items-center gap-1 text-[11px] transition cursor-pointer ${
                    isCopied ? "text-emerald-600 font-bold" : "hover:text-indigo-600"
                  }`}
                  title="Copy details to clipboard"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isCopied ? "Copied!" : "Share Link"}</span>
                </button>
              </div>

              {/* Commentary subsection */}
              {isCommentsExpanded && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3.5 animate-fade-in text-[11px] w-full mt-2">
                  <div className="font-bold text-slate-700 border-b border-slate-200 pb-1.5">
                    Replies
                  </div>

                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {j.comments.map((jc) => (
                      <div key={jc.id} className="bg-white p-2.5 border border-slate-200/60 rounded-md shadow-3xs">
                        <div className="flex items-center justify-between text-[10px] mb-0.5 text-indigo-700 font-bold">
                          <span>{jc.author}</span>
                          <span className="text-[8.5px] text-slate-400 font-mono">{jc.timestamp}</span>
                        </div>
                        <p className="text-slate-705 font-light break-words">{jc.text}</p>
                      </div>
                    ))}
                    {j.comments.length === 0 && (
                      <p className="text-slate-400 italic text-center py-1">Ask a question or request contact details above!</p>
                    )}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={(e) => handleAddComment(e, j.id)} className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 text-left">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder={getActiveProfile() ? "Write a reply..." : "Verify your profile in sidebar to reply"}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-grow bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No gigs posted under this filter yet.</p>
            <p className="text-[10px] text-slate-400 mt-1">Be the first to list an opportunity by clicking "Post an Opening"!</p>
          </div>
        )}
      </div>
    </div>
  );
}
