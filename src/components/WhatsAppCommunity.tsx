import React, { useEffect, useRef, useState, useMemo } from "react";
import { CheckCheck, MessageCircle, Search, Send, ShieldCheck, Users, X } from "lucide-react";
import type { Table } from "../types";
import { saveAppStateToStore, getActiveFirestore } from "../lib/firebaseSync";
import { onSnapshot, doc } from "firebase/firestore";

export interface GroupMsg {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  accent: string;
}

const DEFAULT_GROUPS: CommunityGroup[] = [
  { id: "tech", name: "Tech Builders", description: "Shipping, stacks, and architecture.", accent: "bg-indigo-500" },
  { id: "growth", name: "Growth Lab", description: "Funnels and experiments.", accent: "bg-emerald-500" },
  { id: "content", name: "Creator Studio", description: "Scripts and distribution.", accent: "bg-violet-500" },
];

const INITIAL_HISTORIES: Record<string, GroupMsg[]> = {
  tech: [],
  growth: [],
  content: [],
};

interface Props {
  tables: Table[];
  sessionName: string;
}

export default function WhatsAppCommunity({ tables, sessionName }: Props) {
  const [activeGroupId, setActiveGroupId] = useState("tech");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [histories, setHistories] = useState<Record<string, GroupMsg[]>>({});
  const [hoveredUser, setHoveredUser] = useState<{ name: string; bio: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map of username -> bio for easy lookup
  const userBios = useMemo(() => {
    const map: Record<string, string> = {};
    tables.forEach(table => {
      table.rows.forEach(row => {
        if (row["Name"]) {
          map[String(row["Name"]).trim()] = row["Bio"] || "No bio available.";
        }
      });
    });
    return map;
  }, [tables]);

  useEffect(() => {
    const db = getActiveFirestore();
    if (!db) {
      const saved = localStorage.getItem("hustle_hub_whatsapp");
      if (saved) {
        try { setHistories(JSON.parse(saved)); } catch { setHistories(INITIAL_HISTORIES); }
      } else {
        setHistories(INITIAL_HISTORIES);
      }
      return;
    }

    const unsub = onSnapshot(doc(db, "founderdeck_app_state", "community_rooms"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.value) {
          setHistories(data.value);
        }
      } else {
        saveAppStateToStore("community_rooms", INITIAL_HISTORIES);
        setHistories(INITIAL_HISTORIES);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [histories, activeGroupId]);

  const activeGroup = DEFAULT_GROUPS.find((group) => group.id === activeGroupId) || DEFAULT_GROUPS[0];
  const currentMessages = histories[activeGroupId] || [];

  const saveHistories = (next: Record<string, GroupMsg[]>) => {
    setHistories(next);
    localStorage.setItem("hustle_hub_whatsapp", JSON.stringify(next));
    void saveAppStateToStore("community_rooms", next);
  };

  const isAuthorized = !!sessionName;

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || !sessionName) return;

    const savedProfile = localStorage.getItem("hustle_hub_profile");
    let role = "Member";
    if (savedProfile) {
      try { role = JSON.parse(savedProfile)["Persona"] || "Member"; } catch { }
    }

    const freshMessage: GroupMsg = {
      id: "msg_" + Date.now(),
      senderName: sessionName,
      senderRole: role,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    saveHistories({
      ...histories,
      [activeGroupId]: [...currentMessages, freshMessage],
    });
    setInputText("");
  };

  const filteredGroups = DEFAULT_GROUPS.filter((group) =>
    `${group.name} ${group.description}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[700px] flex font-sans text-slate-200">
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-[#0b1120]">
        <div className="p-6 border-b border-slate-800 bg-[#0f172a]">
          <h2 className="text-xl font-black tracking-tight text-white">Rooms</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full bg-slate-900 border-0 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredGroups.map((group) => (
            <button
              key={group.id} onClick={() => setActiveGroupId(group.id)}
              className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 ${activeGroupId === group.id ? "bg-slate-800 shadow-lg border border-slate-700" : "hover:bg-slate-800/40"}`}
            >
              <div className={`w-12 h-12 rounded-2xl ${group.accent} flex items-center justify-center text-white shadow-lg`}><MessageCircle className="w-6 h-6" /></div>
              <div className="text-left overflow-hidden">
                <div className="font-black text-sm text-white">{group.name}</div>
                <div className="text-[10px] text-slate-500 font-bold truncate">{group.description}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#0f172a] relative">
        <header className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${activeGroup.accent} flex items-center justify-center text-white`}><Users className="w-5 h-5" /></div>
            <div>
              <h3 className="font-black text-lg text-white">{activeGroup.name}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{activeGroup.description}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#0f172a]/50">
          {currentMessages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-700 italic text-sm font-medium">Start a conversation in {activeGroup.name}...</div>
          )}
          {currentMessages.map((msg) => {
            const isSelf = msg.senderName === sessionName;
            return (
              <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] space-y-1 ${isSelf ? "items-end" : "items-start"}`}>
                   {!isSelf && (
                     <div 
                        className="text-[10px] font-black text-indigo-400 ml-2 cursor-pointer hover:underline relative group"
                        onMouseEnter={() => setHoveredUser({ name: msg.senderName, bio: userBios[msg.senderName] || "Founder biography not found." })}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        {msg.senderName} • {msg.senderRole}
                      </div>
                   )}
                   <div className={`px-4 py-3 rounded-2xl text-sm shadow-xl ${isSelf ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none"}`}>
                      {msg.text}
                   </div>
                   <div className="text-[9px] text-slate-600 font-bold px-2">{msg.timestamp}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* User Bio Popup */}
        {hoveredUser && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <div className="font-black text-white text-sm border-b border-slate-700 pb-2 mb-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px]">{hoveredUser.name.charAt(0)}</div>
              {hoveredUser.name}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">"{hoveredUser.bio}"</p>
          </div>
        )}

        <div className="p-6 bg-[#0f172a] border-t border-slate-800">
          {isAuthorized ? (
            <form onSubmit={handleSendMessage} className="relative">
              <input
                value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message #${activeGroup.id}...`}
                className="w-full bg-slate-900 border-0 rounded-2xl pl-6 pr-14 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg active:scale-95"><Send className="w-4 h-4" /></button>
            </form>
          ) : (
            <div className="bg-slate-900 rounded-2xl p-4 text-center text-xs text-slate-500 font-bold">Register your profile on the landing page to chat.</div>
          )}
        </div>
      </main>
    </div>
  );
}
