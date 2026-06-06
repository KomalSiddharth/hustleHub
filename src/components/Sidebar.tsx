import React, { useMemo } from "react";
import { Briefcase, Database, MessageCircle, Rocket, X } from "lucide-react";
import type { Table } from "../types";

interface Props {
  tables: Table[];
  activeTableId: string | null;
  onSelectTable: (id: string) => void;
  sessionName: string;
  onClose?: () => void;
}

export default function Sidebar({ tables, activeTableId, onSelectTable, sessionName, onClose }: Props) {
  const savedProfile = getSavedProfile();
  const displayName = savedProfile?.["Name"] || sessionName || "Founder";
  const email = savedProfile?.["Email"] || savedProfile?.["Persona"] || "Member profile";

  // Compute unread product comments badge
  const hasUnreadComments = useMemo(() => {
    try {
      const saved = localStorage.getItem("hustle_hub_products");
      if (!saved) return false;
      const products: any[] = JSON.parse(saved);
      const total = products.reduce((s: number, p: any) => s + (p.comments?.length || 0), 0);
      const seen = parseInt(localStorage.getItem("hustle_hub_products_seen_count") || "0", 10);
      return total > seen;
    } catch { return false; }
  }, [activeTableId]);

  const workspaceTabs = [
    { id: "spotlight", label: "Products", icon: Rocket, badge: hasUnreadComments },
    { id: "gigs", label: "Hiring", icon: Briefcase, badge: false },
    { id: "whatsapp", label: "Community", icon: MessageCircle, badge: false },
  ];

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-slate-900 bg-slate-950 text-white relative">
      {/* Mobile Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-2 text-slate-400 hover:text-white transition-colors z-50"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      <div className="border-b border-slate-900 p-5">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="min-w-0">
            <div className="text-sm font-black tracking-tight">The Founder's Club</div>
            <div className="text-xs text-stone-500">Founder DB</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-sm font-black text-white">
              {String(displayName).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{displayName}</div>
              <div className="truncate text-xs text-slate-400">{email}</div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="px-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Main</div>
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTable(tab.id);
                if (onClose) onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                activeTableId === tab.id ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <div className="relative">
                <tab.icon className="h-4 w-4" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-slate-950" />
                )}
              </div>
              {tab.label}
            </button>
          ))}
        </section>

        <section className="space-y-2">
          <div className="px-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Databases</div>
          <div className="space-y-1">
            {tables.map((table) => {
              const active = activeTableId === table.id;
              return (
                <button
                  key={table.id}
                  onClick={() => {
                    onSelectTable(table.id);
                    if (onClose) onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <Database className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{table.name}</span>
                    <span className={`block text-xs ${active ? "text-slate-800" : "text-slate-500"}`}>{table.rows.length} records</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

    </aside>
  );
}

function getSavedProfile() {
  const saved = localStorage.getItem("hustle_hub_profile");
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Record<string, any>;
  } catch {
    return null;
  }
}

function LogoMark() {
  return (
    <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-stone-950 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#34d399,transparent_32%),linear-gradient(135deg,#0f172a,#064e3b_55%,#facc15)]" />
      <div className="relative h-6 w-6 rounded-lg border-2 border-white/90">
        <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-stone-950" />
        <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-white/90" />
      </div>
    </div>
  );
}
