import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, MessageSquare, Plus, ExternalLink, Send, User, TrendingUp, Trophy, Crown, Award, ImagePlus, X } from "lucide-react";
import { saveAppStateToStore, getActiveFirestore, getActiveAuth } from "../lib/firebaseSync";
import { onSnapshot, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  makerName: string;
  makerRole: string; // Tech, Growth, Content
  url: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  votes?: Record<string, "up" | "down">; // per-user votes map
  userVoted?: "up" | "down" | null; // legacy field, no longer written
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  authorRole: string;
  authorUid?: string;
  text: string;
  timestamp: string;
}

const DEFAULT_PRODUCTS: Product[] = [];

export default function ProductBoard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentToast, setCommentToast] = useState<string | null>(null);
  const prevProductsRef = useRef<Product[]>([]);

  // uid must be reactive — auth may not be loaded at component mount time
  const [uid, setUid] = useState<string>(() => {
    const currentUid = getActiveAuth()?.currentUser?.uid;
    return currentUid || "anon_" + (localStorage.getItem("hustle_hub_logged_name") || "user");
  });

  useEffect(() => {
    const auth = getActiveAuth();
    if (!auth) return;
    // Immediately update if already signed in
    if (auth.currentUser?.uid) setUid(auth.currentUser.uid);
    // Also listen for auth state changes
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.uid) setUid(user.uid);
    });
    return unsub;
  }, []);

  const currentUserName = (() => {
    try {
      const p = JSON.parse(localStorage.getItem("hustle_hub_profile") || "{}");
      return String(p["Name"] || "");
    } catch { return ""; }
  })();

  // Form states
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  // Detect new comments on user's products and show a toast
  useEffect(() => {
    if (!currentUserName || prevProductsRef.current.length === 0) {
      prevProductsRef.current = products;
      return;
    }
    for (const p of products) {
      if (p.makerName !== currentUserName) continue;
      const prev = prevProductsRef.current.find((x) => x.id === p.id);
      if (prev && p.comments.length > prev.comments.length) {
        setCommentToast(p.name);
        // Update the seen count in localStorage
        localStorage.setItem("hustle_hub_products_seen_count", String(products.reduce((s, x) => s + x.comments.length, 0)));
        setTimeout(() => setCommentToast(null), 4000);
        break;
      }
    }
    prevProductsRef.current = products;
  }, [products]);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("hustle_hub_products", JSON.stringify(newProducts));
    void saveAppStateToStore("products", newProducts);
    // Update seen count whenever user saves (they're active)
    const total = newProducts.reduce((s, p) => s + p.comments.length, 0);
    localStorage.setItem("hustle_hub_products_seen_count", String(total));
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = getActiveProfile();
    
    // Fallback if profile name is missing
    const makerName = profile.name || "Anonymous Founder";
    
    if (!name.trim() || !tagline.trim()) {
      console.warn("Product Name and Tagline are required.");
      return;
    }

    const fresh: Product = {
      id: "prod_" + Date.now(),
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      makerName: makerName,
      makerRole: profile.role,
      url: url.trim() || "https://thehustlehub.workspace",
      imageUrl: imagePreview || imageUrl.trim() || undefined,
      upvotes: 1,
      downvotes: 0,
      votes: { [uid]: "up" },
      createdAt: new Date().toISOString().split("T")[0],
      comments: []
    };

    saveProducts([fresh, ...products]);
    setShowSubmitForm(false);
    setName("");
    setTagline("");
    setDescription("");
    setUrl("");
    setImageUrl("");
    setImagePreview(null);
  };

  const handleVote = (productId: string, voteType: "up" | "down") => {
    const modified = products.map((p) => {
      if (p.id !== productId) return p;
      const currentVotes: Record<string, "up" | "down"> = { ...(p.votes || {}) };
      const currentUserVote = currentVotes[uid] ?? null;

      if (currentUserVote === voteType) {
        // toggle off
        delete currentVotes[uid];
      } else {
        currentVotes[uid] = voteType;
      }

      // Recompute upvotes/downvotes from the votes map
      const upvotes = Object.values(currentVotes).filter((v) => v === "up").length;
      const downvotes = Object.values(currentVotes).filter((v) => v === "down").length;

      return { ...p, votes: currentVotes, upvotes, downvotes };
    });
    saveProducts(modified);
  };

  const handleAddComment = (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    const profile = getActiveProfile();

    // Fallback if profile name is missing
    const authorName = profile.name || "Anonymous Founder";

    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: "comment_" + Date.now(),
      author: authorName,
      authorRole: profile.role,
      authorUid: uid,
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

  // Sort all products by net score (upvotes - downvotes) descending — live
  const sortedProducts = [...products].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

  const leaderboard = sortedProducts.slice(0, 10);

  return (
    <div className="bg-slate-50 min-h-full p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
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

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Screenshot / Logo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setImagePreview(ev.target?.result as string);
                      setImageUrl("");
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Upload Image
                    </button>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="or paste image URL..."
                      className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSubmitForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Launch Now</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-4">
            {products.length === 0 && !showSubmitForm && (
              <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
                <p className="text-slate-400 font-medium">No products launched yet. Be the first!</p>
              </div>
            )}
            {sortedProducts.map((p) => {
              const userVoted = p.votes?.[uid] ?? null;
              return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                {p.imageUrl && (
                  <div className="w-full h-48 overflow-hidden bg-slate-100">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex items-start gap-6">
                  <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-2xl p-2 border border-slate-100 min-w-[64px]">
                    <button onClick={() => handleVote(p.id, "up")} className={`p-1.5 rounded-xl transition-colors ${userVoted === "up" ? "bg-emerald-100 text-emerald-600" : "hover:bg-white text-slate-400"}`}><ArrowUp className="w-6 h-6" /></button>
                    <span className="font-black text-lg">{p.upvotes - p.downvotes}</span>
                    <button onClick={() => handleVote(p.id, "down")} className={`p-1.5 rounded-xl transition-colors ${userVoted === "down" ? "bg-rose-100 text-rose-600" : "hover:bg-white text-slate-400"}`}><ArrowDown className="w-6 h-6" /></button>
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
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setExpandedFeedbackId(expandedFeedbackId === p.id ? null : p.id)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {p.comments.length} Comments
                    </button>
                    <span className="text-xs text-slate-400">❤️ {p.upvotes} likes</span>
                  </div>

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
            );})}
          </div>

          <aside className="space-y-6 sticky top-24">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Weekly Leaderboard
                </h3>
              </div>
              <div className="space-y-1">
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No rankings yet.</p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-3 p-2 rounded-2xl transition-all group ${idx === 0 ? "bg-amber-50/50" : "hover:bg-slate-50"}`}>
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                          idx === 0 ? "bg-amber-100 text-amber-600 shadow-sm shadow-amber-200" : 
                          idx === 1 ? "bg-slate-100 text-slate-600" : 
                          idx === 2 ? "bg-orange-100 text-orange-600" : 
                          "text-slate-400"
                        }`}>
                          {idx + 1}
                        </div>
                        {idx === 0 && <Crown className="w-3 h-3 text-amber-500 absolute -top-1.5 -right-1.5 rotate-12" />}
                        {(idx === 1 || idx === 2) && <Award className={`w-3 h-3 absolute -top-1.5 -right-1.5 ${idx === 1 ? "text-slate-400" : "text-orange-400"}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.name}</div>
                        <div className="text-[10px] font-medium text-slate-500 truncate">{item.tagline}</div>
                      </div>
                      <div className="text-[10px] font-black text-indigo-600 px-2 py-1">
                        {item.upvotes - item.downvotes}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {leaderboard.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Standings</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Comment toast notification */}
      {commentToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 shadow-2xl text-white text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-lg">💬</span>
          New comment on <span className="text-emerald-400">{commentToast}</span>!
        </div>
      )}
    </div>
  );
}
