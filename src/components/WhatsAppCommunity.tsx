import React, { useEffect, useRef, useState } from "react";
import { CheckCheck, MessageCircle, Search, Send, ShieldCheck, Users } from "lucide-react";
import type { Table } from "../types";
import { saveAppStateToStore } from "../lib/firebaseSync";

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
  membersCount: number;
  accent: string;
}

const DEFAULT_GROUPS: CommunityGroup[] = [
  { id: "tech", name: "Tech Builders", description: "Shipping, stacks, architecture, APIs, and deployment.", membersCount: 142, accent: "bg-sky-500" },
  { id: "growth", name: "Growth Lab", description: "Funnels, channels, positioning, revenue, and experiments.", membersCount: 119, accent: "bg-emerald-500" },
  { id: "content", name: "Creator Studio", description: "Content strategy, scripts, distribution, and audience growth.", membersCount: 95, accent: "bg-violet-500" },
];

const INITIAL_HISTORIES: Record<string, GroupMsg[]> = {
  tech: [
    { id: "1", senderName: "Aarav Sharma", senderRole: "Tech", text: "Does anyone have a clean Vite plus Express starter for a member directory?", timestamp: "11:21 AM" },
    { id: "2", senderName: "Vikram Dev", senderRole: "Tech", text: "Yes. Keep the API routes in server.ts and let Vite run as middleware in development.", timestamp: "11:24 AM" },
  ],
  growth: [
    { id: "1", senderName: "Maya Roy", senderRole: "Growth", text: "Testing a founder-led LinkedIn funnel this week. Happy to share the numbers once we finish.", timestamp: "10:15 AM" },
    { id: "2", senderName: "Sam Wright", senderRole: "Growth", text: "Would love to compare signup quality by source.", timestamp: "12:12 PM" },
  ],
  content: [
    { id: "1", senderName: "Karan Malhotra", senderRole: "Content Creation", text: "My short-form breakdown performed well, but the profile CTA needs work.", timestamp: "Yesterday" },
    { id: "2", senderName: "Aarav Sharma", senderRole: "Tech", text: "Try routing people to a specific tool or checklist instead of a generic profile link.", timestamp: "01:05 PM" },
  ],
};

interface Props {
  tables: Table[];
  sessionName: string;
  theme?: "light" | "dark";
}

export default function WhatsAppCommunity({ tables, sessionName, theme = "dark" }: Props) {
  const [activeGroupId, setActiveGroupId] = useState("tech");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [histories, setHistories] = useState<Record<string, GroupMsg[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const saved = localStorage.getItem("hustle_hub_whatsapp");
    if (saved) {
      try {
        setHistories(JSON.parse(saved));
      } catch {
        setHistories(INITIAL_HISTORIES);
      }
    } else {
      setHistories(INITIAL_HISTORIES);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [histories, activeGroupId]);

  const activeGroup = DEFAULT_GROUPS.find((group) => group.id === activeGroupId) || DEFAULT_GROUPS[0];
  const currentMessages = histories[activeGroupId] || [];

  const getSessionUserRole = () => {
    const savedProfile = localStorage.getItem("hustle_hub_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return String(parsed["Persona"] || "Member");
      } catch {
        // fallback below
      }
    }
    if (!sessionName) return "Viewer";
    const lowerName = sessionName.toLowerCase();
    for (const table of tables) {
      if (table.rows.some((row) => String(row["Name"] || "").toLowerCase() === lowerName)) {
        return table.name;
      }
    }
    return "Member";
  };

  const saveHistories = (next: Record<string, GroupMsg[]>) => {
    setHistories(next);
    localStorage.setItem("hustle_hub_whatsapp", JSON.stringify(next));
    void saveAppStateToStore("community_rooms", next);
  };

  const isAuthorized = !!sessionName;
  const userRole = getSessionUserRole();

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || !sessionName) return;

    const freshMessage: GroupMsg = {
      id: "msg_" + Date.now(),
      senderName: sessionName,
      senderRole: userRole,
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
    <section className={`rounded-2xl border p-4 md:p-6 ${isDark ? "border-slate-800 bg-slate-950 text-white" : "border-stone-200 bg-white text-stone-950 shadow-sm"}`}>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
            <MessageCircle className="h-4 w-4" />
            Community rooms
          </div>
          <h3 className="mt-2 text-2xl font-black tracking-tight">Focused founder conversations</h3>
          <p className={`mt-1 max-w-2xl text-sm leading-6 ${isDark ? "text-slate-400" : "text-stone-500"}`}>
            Track-based rooms for builders, growth operators, and creator-founders.
          </p>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-xs font-bold ${isAuthorized ? "border-emerald-200 bg-emerald-50 text-emerald-700" : isDark ? "border-slate-800 bg-slate-900 text-slate-400" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
          {isAuthorized ? "Member access" : "Create profile to chat"}
        </div>
      </div>

      <div className={`grid min-h-[560px] overflow-hidden rounded-2xl border lg:grid-cols-[320px_1fr] ${isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-stone-50"}`}>
        <aside className={`border-r ${isDark ? "border-slate-800 bg-slate-950" : "border-stone-200 bg-white"}`}>
          <div className={`border-b p-4 ${isDark ? "border-slate-800" : "border-stone-200"}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search rooms"
                className={`h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 ${isDark ? "border-slate-800 bg-slate-900 text-white" : "border-stone-200 bg-stone-50 text-stone-950"}`}
              />
            </div>
          </div>

          <div className="space-y-2 p-3">
            {filteredGroups.map((group) => {
              const active = group.id === activeGroupId;
              const lastMessage = (histories[group.id] || []).at(-1)?.text;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-emerald-200 bg-emerald-50 text-stone-950"
                      : isDark
                        ? "border-transparent text-slate-300 hover:bg-slate-900"
                        : "border-transparent text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-9 w-9 shrink-0 rounded-xl ${group.accent}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-black">{group.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-stone-400">
                          <Users className="h-3 w-3" />
                          {group.membersCount}
                        </div>
                      </div>
                      <p className="mt-1 truncate text-xs text-stone-500">{lastMessage || group.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className={`flex items-center justify-between border-b p-4 ${isDark ? "border-slate-800 bg-slate-950/60" : "border-stone-200 bg-white"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className={`h-10 w-10 shrink-0 rounded-xl ${activeGroup.accent}`} />
              <div className="min-w-0">
                <h4 className="truncate text-sm font-black">{activeGroup.name}</h4>
                <p className={`truncate text-xs ${isDark ? "text-slate-400" : "text-stone-500"}`}>{activeGroup.description}</p>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Profile powered
            </div>
          </div>

          <div className={`flex-1 space-y-4 overflow-y-auto p-4 ${isDark ? "bg-slate-950/45" : "bg-stone-50"}`}>
            {currentMessages.map((message) => {
              const isSelf = sessionName && message.senderName.trim().toLowerCase() === sessionName.trim().toLowerCase();
              return (
                <div key={message.id} className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-soft-rise`}>
                  <div className={`max-w-[78%] rounded-2xl border px-4 py-3 text-left shadow-sm ${
                    isSelf
                      ? "border-emerald-200 bg-emerald-600 text-white"
                      : isDark
                        ? "border-slate-800 bg-slate-900 text-slate-100"
                        : "border-stone-200 bg-white text-stone-900"
                  }`}>
                    {!isSelf && (
                      <div className="mb-1 flex items-center gap-2 text-xs font-black text-emerald-600">
                        {message.senderName}
                        <span className={`font-semibold ${isDark ? "text-slate-500" : "text-stone-400"}`}>{message.senderRole}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                    <div className={`mt-1 flex justify-end gap-1 text-[11px] ${isSelf ? "text-white/70" : "text-stone-400"}`}>
                      {message.timestamp}
                      {isSelf && <CheckCheck className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {isAuthorized ? (
            <form onSubmit={handleSendMessage} className={`flex gap-2 border-t p-4 ${isDark ? "border-slate-800 bg-slate-950" : "border-stone-200 bg-white"}`}>
              <input
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder={`Message ${activeGroup.name}`}
                className={`h-11 min-w-0 flex-1 rounded-xl border px-4 text-sm outline-none focus:ring-4 focus:ring-emerald-100 ${isDark ? "border-slate-800 bg-slate-900 text-white" : "border-stone-200 bg-stone-50 text-stone-950"}`}
              />
              <button className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700">
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className={`border-t p-4 text-sm ${isDark ? "border-slate-800 bg-slate-950 text-slate-400" : "border-stone-200 bg-white text-stone-500"}`}>
              Create your profile on the landing page to send messages.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
