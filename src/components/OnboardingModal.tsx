import React from "react";
import { Database, Rocket, Briefcase, MessageCircle, X } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Founder Directory",
    desc: "Search every verified founder by niche, city, and revenue stage.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Rocket,
    title: "Product Spotlight",
    desc: "Launch your build, get upvotes and honest feedback from real founders.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Briefcase,
    title: "Hiring Board",
    desc: "Post co-founder roles, freelance gigs, or full-time openings.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MessageCircle,
    title: "Community Rooms",
    desc: "Live chats grouped by your track — Tech, Growth, or Creator.",
    color: "bg-amber-50 text-amber-600",
  },
];

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-stone-950 to-emerald-950 px-8 py-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-stone-950 text-2xl font-black">
            🚀
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome to The Founder's Club
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Your all-in-one community OS for early-stage founders.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 p-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-stone-100 bg-stone-50 p-4 space-y-2"
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-black text-stone-900">{f.title}</div>
              <div className="text-xs leading-5 text-stone-500">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-stone-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
