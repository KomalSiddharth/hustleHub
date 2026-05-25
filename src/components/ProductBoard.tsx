import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, MessageSquare, Plus, ExternalLink, Send } from "lucide-react";
import { saveAppStateToStore } from "../lib/firebaseSync";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  makerName: string;
  makerRole: string; // Tech, Growth, Content
  url: string;
  upvotes: number;
  downvotes: number;
  userVoted?: "up" | "down" | null;
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "SaaS Launch Kit",
    tagline: "The fastest way for Tech builders to ship elegant NextJS applications in 1 hour.",
    description: "Packed with pre-configured authentication, Firebase syncing patterns, and custom tailwind themes so you don't keep rebuilding the wheel.",
    makerName: "Aris Thorne",
    makerRole: "Tech Person",
    url: "https://saaslaunchkit.dev",
    upvotes: 42,
    downvotes: 1,
    createdAt: "2026-05-20",
    comments: [
      { id: "c1", author: "Maya Lin", authorRole: "Growth Person", text: "Saved me about 12 hours of setup this weekend. High contrast styling is extremely beautiful!", timestamp: "2026-05-21" },
      { id: "c2", author: "Vikram Dev", authorRole: "Content Creator", text: "Can you add video hosting widgets in the next update?", timestamp: "2026-05-22" }
    ]
  },
  {
    id: "prod_2",
    name: "GrowthFlow Engine",
    tagline: "Automate LinkedIn and X social lead scoring directly inside your spreadsheet columns.",
    description: "Calculates persona affinity scores and automatically prompts AI to write targeted custom copy without leaving your lead list tracker tabs.",
    makerName: "Maya Lin",
    makerRole: "Growth Person",
    url: "https://growthflow.ai",
    upvotes: 38,
    downvotes: 2,
    createdAt: "2026-05-22",
    comments: [
      { id: "c3", author: "Aris Thorne", authorRole: "Tech Person", text: "Integrates perfectly with the Hustle Hub lead spreadsheets. Beautiful implementation!", timestamp: "2026-05-23" }
    ]
  }
];

export default function ProductBoard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [makerName, setMakerName] = useState("");
  const [makerRole, setMakerRole] = useState("Tech Person");
  const [url, setUrl] = useState("");

  // New feedback comment
  const [newCommentText, setNewCommentText] = useState("");

  const getActiveProfile = () => {
    const savedProfile = localStorage.getItem("hustle_hub_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return {
          name: String(parsed["Name"] || ""),
          role: String(parsed["Persona"] || parsed["Persona Role"] || "Member"),
        };
      } catch {
        // fallback below
      }
    }
    return {
      name: localStorage.getItem("hustle_hub_logged_name") || "",
      role: "Member",
    };
  };

  // Load from LocalStorage or default
  useEffect(() => {
    const loggedName = localStorage.getItem("hustle_hub_logged_name") || "";
    if (loggedName) {
      setMakerName(loggedName);
    }

    const saved = localStorage.getItem("hustle_hub_products");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        setProducts(DEFAULT_PRODUCTS);
      }
    } else {
      setProducts(DEFAULT_PRODUCTS);
    }
  }, []);

  // Save to LocalStorage
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("hustle_hub_products", JSON.stringify(newProducts));
    void saveAppStateToStore("products", newProducts);
  };

  // Submit Product
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim() || !makerName.trim()) return;

    const fresh: Product = {
      id: "prod_" + Date.now(),
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      makerName: makerName.trim(),
      makerRole,
      url: url.trim() || "https://thehustlehub.workspace",
      upvotes: 1,
      downvotes: 0,
      userVoted: "up", // auto voted
      createdAt: new Date().toISOString().split("T")[0],
      comments: []
    };

    saveProducts([fresh, ...products]);
    setShowSubmitForm(false);
    
    // reset
    setName("");
    setTagline("");
    setDescription("");
    setMakerName("");
    setUrl("");
  };

  // Up/Down Voting
  const handleVote = (productId: string, voteType: "up" | "down") => {
    const modified = products.map((p) => {
      if (p.id !== productId) return p;

      let upDiff = 0;
      let downDiff = 0;
      let nextVotedState: "up" | "down" | null = voteType;

      if (p.userVoted === voteType) {
        // retract vote
        if (voteType === "up") upDiff = -1;
        if (voteType === "down") downDiff = -1;
        nextVotedState = null;
      } else {
        // change or add brand new vote
        if (p.userVoted === "up") upDiff = -1;
        if (p.userVoted === "down") downDiff = -1;

        if (voteType === "up") upDiff += 1;
        if (voteType === "down") downDiff += 1;
      }

      return {
        ...p,
        upvotes: Math.max(0, p.upvotes + upDiff),
        downvotes: Math.max(0, p.downvotes + downDiff),
        userVoted: nextVotedState
      };
    });

    saveProducts(modified);
  };

  // Create Feedback Comment
  const handleAddComment = (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    const profile = getActiveProfile();
    if (!profile.name.trim() || !newCommentText.trim()) return;

    const newComment: Comment = {
      id: "comment_" + Date.now(),
      author: profile.name.trim(),
      authorRole: profile.role,
      text: newCommentText.trim(),
      timestamp: new Date().toISOString().split("T")[0]
    };

    const modified = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    });

    saveProducts(modified);
    setNewCommentText("");
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 text-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            Product launches
          </h3>
          <p className="text-xs text-slate-500">
            Share what you are building, collect upvotes, and get focused replies.
          </p>
        </div>

        <button
          onClick={() => {
            setShowSubmitForm(!showSubmitForm);
            const loggedName = localStorage.getItem("hustle_hub_logged_name") || "";
            if (loggedName) {
              setMakerName(loggedName);
            }
          }}
          className="text-xs font-bold leading-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center shadow-md shadow-indigo-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Product</span>
        </button>
      </div>

      {/* Launcher Form */}
      {showSubmitForm && (
        <form onSubmit={handleSubmitProduct} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs max-w-2xl mx-auto anime-fade-in text-left">
          <h4 className="font-bold text-sm text-indigo-600 pb-2 border-b border-slate-200">🚀 List Your Ship on Hustle Hub</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. CreatorDeck Scheduler"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-350 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Tagline / Short Hook *</label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule visual posts instantly using AI hooks."
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-white border border-slate-350 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Long Description (How it works & benefit)</label>
            <textarea
              placeholder="Provide detail on your product niche, who it targets, and how it helps other creators grow..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-white border border-slate-350 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Maker Name *</label>
              <input
                type="text"
                required
                placeholder="Alice Cooper"
                value={makerName}
                onChange={(e) => setMakerName(e.target.value)}
                className="w-full bg-white border border-slate-350 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Maker Role Group</label>
              <select
                value={makerRole}
                onChange={(e) => setMakerRole(e.target.value)}
                className="w-full bg-white border border-slate-350 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Tech Person">Tech Person</option>
                <option value="Growth Person">Growth Person</option>
                <option value="Content Creator">Content Creator</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Product Live URL</label>
              <input
                type="url"
                placeholder="https://myship.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white border border-slate-350 text-slate-900 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSubmitForm(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-205 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              Submit Ship
            </button>
          </div>
        </form>
      )}

      {/* Card Grid with product lists */}
      <div className="space-y-4">
        {products.map((p) => {
          const isFeedbackExpanded = expandedFeedbackId === p.id;
          const upvoted = p.userVoted === "up";
          const downvoted = p.userVoted === "down";

          return (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all text-left flex flex-col gap-4 shadow-3xs">
              <div className="flex items-start gap-4">
                {/* Product Hunt voting toggle stack */}
                <div className="flex flex-col items-center justify-center p-1 px-2.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0 select-none">
                  <button
                    onClick={() => handleVote(p.id, "up")}
                    className={`p-1 hover:bg-indigo-50 rounded transition cursor-pointer ${
                      upvoted ? "text-emerald-600 scale-110" : "text-slate-400 hover:text-emerald-600"
                    }`}
                    title="Upvote product"
                  >
                    <ArrowUp className="w-5 h-5 shrink-0" />
                  </button>
                  <span className={`text-xs font-mono font-bold my-0.5 ${upvoted ? "text-emerald-600" : downvoted ? "text-rose-650" : "text-slate-600"}`}>
                    {p.upvotes - p.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote(p.id, "down")}
                    className={`p-1 hover:bg-rose-50 rounded transition cursor-pointer ${
                      downvoted ? "text-rose-600 scale-110" : "text-slate-400 hover:text-rose-655"
                    }`}
                    title="Downvote product"
                  >
                    <ArrowDown className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                {/* Info and content */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 select-all">{p.name}</h4>
                    <span className="text-[9.5px] uppercase font-mono px-2 py-0.2 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 font-medium">
                      By {p.makerName} ({p.makerRole})
                    </span>
                  </div>
                  <p className="text-xs text-indigo-650 font-semibold">{p.tagline}</p>
                  {p.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal font-sans">{p.description}</p>
                  )}
                </div>

                {/* External Live product tag and link */}
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer referrer"
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 transition"
                  title="Visit Website"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>

              {/* Action buttons footer for product spotlight card */}
              <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 select-none">
                <button
                  type="button"
                  onClick={() => setExpandedFeedbackId(isFeedbackExpanded ? null : p.id)}
                  className="hover:text-slate-850 transition flex items-center gap-1.5 cursor-pointer font-bold text-indigo-600"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Replies ({p.comments.length})</span>
                </button>
                <span className="text-slate-400 font-mono">Posted: {p.createdAt}</span>
              </div>

              {/* Feedback expandable drawer / conversation thread */}
              {isFeedbackExpanded && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-1 space-y-4 animate-fade-in text-xs">
                  <div className="border-b border-slate-200 pb-2 mb-2 font-bold text-slate-700">
                    Replies
                  </div>

                  {/* Comments Stack */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {p.comments.map((cm) => (
                      <div key={cm.id} className="bg-white p-2.5 rounded-lg border border-slate-250 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-700">
                            {cm.author} <span className="font-normal text-slate-500 font-mono text-[9px]">({cm.authorRole})</span>
                          </span>
                          <span className="text-[9px] text-slate-400">{cm.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-705 font-light leading-normal break-words">{cm.text}</p>
                      </div>
                    ))}
                    {p.comments.length === 0 && (
                      <p className="text-slate-400 italic py-2 text-center text-[10.5px]">No replies yet.</p>
                    )}
                  </div>

                  {/* Add feedback message input */}
                  <form onSubmit={(e) => handleAddComment(e, p.id)} className="pt-2 border-t border-slate-250 text-left">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder={getActiveProfile().name ? "Write a reply..." : "Verify your profile in sidebar to reply"}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-bold text-xs cursor-pointer"
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
      </div>
    </div>
  );
}
