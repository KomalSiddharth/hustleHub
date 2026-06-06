import React from "react";
import { X, MapPin, Briefcase, Linkedin, Twitter, Phone, TrendingUp, FileText, Lightbulb, Package } from "lucide-react";

interface Props {
  profile: Record<string, any> | null;
  onClose: () => void;
}

function getField(profile: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    const match = Object.keys(profile).find((k) => k.toLowerCase() === key.toLowerCase());
    if (match && profile[match]) return String(profile[match]);
  }
  return "";
}

export default function FounderProfileModal({ profile, onClose }: Props) {
  if (!profile) return null;

  const name = getField(profile, "Name", "name") || "Founder";
  const persona = getField(profile, "Persona", "Persona Role", "Role");
  const startupName = getField(profile, "Startup Name", "Company", "Startup");
  const location = getField(profile, "Location", "City", "Country");
  const experience = getField(profile, "Experience", "Years of Experience", "Exp");
  const linkedin = getField(profile, "LinkedIn", "LinkedIn URL", "Linkedin Profile");
  const twitter = getField(profile, "X Profile", "Twitter", "X Handle", "Twitter Handle");
  const contact = getField(profile, "Contact Number", "Phone", "Mobile", "Contact");
  const revenue = getField(profile, "Revenue Generated", "Revenue", "Revenue Made");
  const bio = getField(profile, "Bio", "About", "Introduction");
  const problem = getField(profile, "Problem Statement", "Problem", "Problem Description");
  const productDesc = getField(profile, "Product Description", "Product Details", "Product");

  const initials = name.charAt(0).toUpperCase();

  const infoCards = [
    { icon: <MapPin className="w-4 h-4" />, label: "Location", value: location },
    { icon: <Briefcase className="w-4 h-4" />, label: "Experience", value: experience ? `${experience} yrs` : "" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "Revenue", value: revenue },
    { icon: <Phone className="w-4 h-4" />, label: "Contact", value: contact },
  ].filter((c) => c.value);

  const linkCards = [
    { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn", value: linkedin, href: linkedin ? (linkedin.startsWith("http") ? linkedin : `https://${linkedin}`) : "#" },
    { icon: <Twitter className="w-4 h-4" />, label: "X Profile", value: twitter, href: twitter ? (twitter.startsWith("http") ? twitter : `https://x.com/${twitter.replace("@", "")}`) : "#" },
  ].filter((c) => c.value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-black leading-tight">{name}</h2>
              {persona && (
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {persona}
                </span>
              )}
              {startupName && (
                <p className="text-emerald-100 text-sm mt-1 font-medium">{startupName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info Cards Grid */}
          {(infoCards.length > 0 || linkCards.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {infoCards.map((card) => (
                <div key={card.label} className="bg-slate-50 rounded-2xl p-3 flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-0.5 shrink-0">{card.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{card.value}</p>
                  </div>
                </div>
              ))}
              {linkCards.map((card) => (
                <div key={card.label} className="bg-slate-50 rounded-2xl p-3 flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-0.5 shrink-0">{card.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:underline mt-0.5 block truncate"
                    >
                      {card.value}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">About</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-2xl p-4">{bio}</p>
            </div>
          )}

          {/* Problem Statement */}
          {problem && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Problem Statement</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 rounded-2xl p-4">{problem}</p>
            </div>
          )}

          {/* Product Description */}
          {productDesc && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Product</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 rounded-2xl p-4">{productDesc}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
