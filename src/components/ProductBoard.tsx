import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, MessageSquare, Plus, ExternalLink, Send, User } from "lucide-react";
import { saveAppStateToStore, getActiveFirestore } from "../lib/firebaseSync";
import { onSnapshot, doc } from "firebase/firestore";

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

const DEFAULT_PRODUCTS: Product[] = [];

export default function ProductBoard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
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
        // fallback
      }
    }
    return {
      name: localStorage.getItem("hustle_hub_logged_name") || "",
      role: "Member",
    };
  };

  useEffect(() => {
    const db = getActiveFirestore();
    if (!db) {
      const saved = localStorage.getItem("hustle_hub_products");
      if (saved) {
        try { setProducts(JSON.parse(saved)); } catch { setProducts(DEFAULT_PRODUCTS); }
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
      return;
    }

    const unsub = onSnapshot(doc(db, "founderdeck_app_state", "products"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          setProducts(data.value);
        }
      } else {
        saveAppStateToStore("products", DEFAULT_PRODUCTS);
        setProducts(DEFAULT_PRODUCTS);
      }
    });

    return () => unsub();
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("hustle_hub_products", JSON.stringify(newProducts));
    void saveAppStateToStore("products", newProducts);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = getActiveProfile();
    if (!name.trim() || !tagline.trim() || !profile.name) return;

    const fresh: Product = {
      id: "prod_" + Date.now(),
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      makerName: profile.name,
      makerRole: profile.role,
      url: url.trim() || "https://thehustlehub.workspace",
      upvotes: 1,
      downvotes: 0,
      userVoted: "up",
      createdAt: new Date().toISOString().split("T")[0],
      comments: []
    };

    saveProducts([fresh, ...products]);
    setShowSubmitForm(false);
    setName("");
    setTagline("");
    setDescription("");
    setUrl("");
  };

  const handleVote = (productId: string, voteType: "up" | "down") => {
    const modified = products.map((p) => {
      if (p.id !== productId) return p;
      let upDiff = 0;
      let downDiff = 0;
      let nextVotedState: "up" | "down" | null = voteType;
      if (p.userVoted === voteType) {
        if (voteType === "up") upDiff = -1;
        if (voteType === "down") downDiff = -1;
        nextVotedState = null;
      } else {
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

  const handleAddComment = (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    const profile = getActiveProfile();
    if (!profile.name.trim() || !newCommentText.trim()) return;
    const newComment: Comment = {
      id: "comment_" + Date.now(),
      author: profile.name.trim(),
      authorRole: profile.role,
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const modified = products.map((p) => {
      if (p.id === productId) {
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    });
    saveProducts(modified);
    setNewCommentText("");
  };

  return (
    <div className="bg-slate-50 min-h-full p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Product Spotlight</h1>
            <p className="text-slate-500 text-sm mt-1">Showcase your builds to the community.</p>
          </div>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Launch Product
          </button>
        </header>

        {showSubmitForm && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Acme AI"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Short Tagline</label>
                  <input
                    type="text" required value={tagline} onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. AI for busy founders"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Tell us more about what you've built..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Launch URL</label>
                <input
                  type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSubmitForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Launch Now</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {products.length === 0 && !showSubmitForm && (
            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
              <p className="text-slate-400 font-medium">No products launched yet. Be the first!</p>
            </div>
          )}
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 flex items-start gap-6">
                <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-2xl p-2 border border-slate-100 min-w-[64px]">
                  <button onClick={() => handleVote(p.id, "up")} className={`p-1.5 rounded-xl transition-colors ${p.userVoted === "up" ? "bg-emerald-100 text-emerald-600" : "hover:bg-white text-slate-400"}`}><ArrowUp className="w-6 h-6" /></button>
                  <span className="font-black text-lg">{p.upvotes - p.downvotes}</span>
                  <button onClick={() => handleVote(p.id, "down")} className={`p-1.5 rounded-xl transition-colors ${p.userVoted === "down" ? "bg-rose-100 text-rose-600" : "hover:bg-white text-slate-400"}`}><ArrowDown className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">{p.name}</h2>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors"><ExternalLink className="w-5 h-5" /></a>
                  </div>
                  <p className="text-indigo-600 font-bold text-sm uppercase tracking-wide">{p.tagline}</p>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold uppercase">{p.makerName.charAt(0)}</div>
                    <span className="text-xs font-bold text-slate-500">By {p.makerName} ({p.makerRole})</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => setExpandedFeedbackId(expandedFeedbackId === p.id ? null : p.id)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {p.comments.length} Comments
                </button>

                {expandedFeedbackId === p.id && (
                  <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {p.comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">{c.author.charAt(0)}</div>
                          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black text-indigo-600">{c.author} • {c.authorRole}</span>
                              <span className="text-[9px] text-slate-400">{c.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={(e) => handleAddComment(e, p.id)} className="relative mt-4">
                      <input
                        type="text" required placeholder="Write a supportive comment..."
                        value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"><Send className="w-4 h-4" /></button>
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
