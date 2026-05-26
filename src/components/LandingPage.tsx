import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  Check,
  Database,
  Filter,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Play,
  Plus,
  Rocket,
  Shuffle,
  Search,
  Send,
  TrendingUp,
  User,
  Users,
  ExternalLink,
  Heart,
} from "lucide-react";
import type { Table } from "../types";

interface Props {
  onGoToDatabase: () => void;
  tables: Table[];
  onAddRowToTable: (tableId: string, rowData: Record<string, any>) => void;
  onRegisterSuccess: (name: string) => void;
  products?: any[];
  communityMessages?: Record<string, any[]>;
  jobs?: any[];
}

const personaOptions = ["Tech", "Growth", "Content Creation"];

const routeByPersona: Record<string, string> = {
  Tech: "table_tech",
  Growth: "table_growth",
  "Content Creation": "table_creator",
};

const features = [
  {
    icon: Users,
    title: "Founder directory",
    copy: "Search every verified founder in the network by niche, tech stack, city, and revenue stage. Find your co-founder or next collaborator in seconds.",
  },
  {
    icon: Rocket,
    title: "Product launches",
    copy: "Post your build to the Spotlight Board. Get upvotes, honest feedback, and direct replies from founders who understand what you're shipping.",
  },
  {
    icon: Briefcase,
    title: "Hiring & gigs",
    copy: "Reach the right people fast. Post co-founder roles, freelance contracts, or full-time openings directly to a verified founder audience.",
  },
  {
    icon: MessageCircle,
    title: "Community rooms",
    copy: "Join live chat rooms grouped by your track — Tech, Growth, or Creator. Real conversations, no noise, with people building in the same space.",
  },
];

const comingSoon = [
  { icon: Mic, title: "Weekly founder calls", copy: "Schedule group calls, capture transcripts, and keep notes in one place." },
  { icon: Search, title: "Problem scraper", copy: "Reddit, X, LinkedIn, and other platforms will feed fresh problem statements." },
  { icon: Shuffle, title: "Build sprints", copy: "Founders get matched into teams and receive collaborative project briefs." },
  { icon: TrendingUp, title: "Leaderboard", copy: "Top founders, launches, feedback, and shipping streaks in one ranking." },
];

const showcaseTabs = [
  {
    id: "gigs",
    label: "Gigs Board",
    icon: Briefcase,
    heading: "Post & discover real opportunities",
    desc: "Browse co-founder ads, freelance contracts, full-time roles, and collab requests from verified founders. Post an opening in seconds and get matched conversationally to the right candidates inside the community.",
  },
  {
    id: "community",
    label: "Community Rooms",
    icon: MessageCircle,
    heading: "Focused rooms for your track",
    desc: "Join live group chats split by your builder type — Tech, Growth, or Creator. Every message comes from a verified founder profile, so the signal-to-noise ratio stays high. No lurkers, no spam, just real builders talking.",
  },
  {
    id: "products",
    label: "Product Board",
    icon: Rocket,
    heading: "Ship and get real feedback",
    desc: "The Spotlight Board is where you launch what you're building. Community members upvote, leave feedback comments, and reply directly. Track which ideas get traction before you over-invest in the wrong direction.",
  },
  {
    id: "founderdb",
    label: "Founder DB",
    icon: Database,
    heading: "A live database of every founder",
    desc: "Every registered member lands in a searchable database. Filter by persona, niche, location, ARR, and years of experience. Think of it as a CRM for your community — always up to date, always searchable.",
  },
];

export default function LandingPage({
  onGoToDatabase,
  tables,
  onAddRowToTable,
  onRegisterSuccess,
  products = [],
  communityMessages = {},
  jobs = [],
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    bio: "",
    linkedin: "",
    xProfile: "",
    persona: "Tech",
    problemStatement: "",
    experience: "",
    startupName: "",
    location: "",
    productDescription: "",
    revenueGenerated: "No",
    revenueAmount: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedProfile, setSavedProfile] = useState<Record<string, any> | null>(() => {
    const saved = localStorage.getItem("hustle_hub_profile");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const totalFounders = useMemo(() => tables.reduce((sum, table) => sum + table.rows.length, 0), [tables]);
  const totalProducts = useMemo(
    () => tables.reduce((sum, table) => sum + table.rows.filter((row) => String(row["Product/Niche Description"] || "").trim()).length, 0),
    [tables]
  );

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.contactNumber.trim() || !formData.linkedin.trim()) {
      setErrorMessage("Contact Number and LinkedIn Profile are required.");
      return;
    }

    if (formData.revenueGenerated === "Yes" && !formData.revenueAmount.trim()) {
      setErrorMessage("Please add revenue amount or select No.");
      return;
    }

    const targetTableId = routeByPersona[formData.persona] || "table_tech";
    const targetTable = tables.find((table) => table.id === targetTableId) || tables[0];

    if (!targetTable) {
      setErrorMessage("No founder database is available yet.");
      return;
    }

    setIsSubmitting(true);

    const freshRow: Record<string, any> = {
      id: "row_reg_" + Date.now().toString(),
      Name: formData.name.trim(),
      Email: formData.email.trim(),
      "Contact Number": formData.contactNumber.trim(),
      Bio: formData.bio.trim(),
      "LinkedIn Profile": formData.linkedin.trim(),
      "X Profile": formData.xProfile.trim(),
      Persona: formData.persona,
      "Problem Statement": formData.problemStatement.trim(),
      "Experience (Yrs)": formData.experience.trim(),
      "Startup Name": formData.startupName.trim(),
      Location: formData.location.trim(),
      "Product/Niche Description": formData.productDescription.trim(),
      "Revenue Generated": formData.revenueGenerated,
      "Revenue Amount": formData.revenueGenerated === "Yes" ? formData.revenueAmount.trim() : "",
      Status: "Active Founder",
    };

    localStorage.setItem("hustle_hub_profile", JSON.stringify(freshRow));
    setSavedProfile(freshRow);
    onAddRowToTable(targetTable.id, freshRow);
    onRegisterSuccess(formData.name.trim());

    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        bio: "",
        linkedin: "",
        xProfile: "",
        persona: "Tech",
        problemStatement: "",
        experience: "",
        startupName: "",
        location: "",
        productDescription: "",
        revenueGenerated: "No",
        revenueAmount: "",
      });
    }, 450);
  };

  return (
    <div className="flex-1 min-h-screen overflow-y-auto bg-[#f6f3ee] text-stone-950 selection:bg-emerald-200/80 relative">
      <div className="absolute inset-x-0 top-0 h-[1120px] bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.25),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(250,204,21,0.18),transparent_30%),linear-gradient(135deg,#0b1110_0%,#123f39_52%,#38564b_100%)]" />
      <div className="absolute inset-0 opacity-[0.22] pointer-events-none founder-grid" />

      <header className="sticky top-0 z-40 border-b border-white/15 bg-stone-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-base font-black tracking-[-0.03em] text-white">Hustle Hub</p>
              <p className="text-[11px] font-medium text-white/55">Founder community OS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {savedProfile && (
              <div className="hidden items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left text-white backdrop-blur md:flex">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-300 text-xs font-black text-stone-950">
                  {String(savedProfile["Name"] || "F").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="max-w-32 truncate text-xs font-black">{savedProfile["Name"]}</div>
                  <div className="max-w-32 truncate text-[10px] text-white/55">{savedProfile["Email"] || savedProfile["Persona"]}</div>
                </div>
              </div>
            )}
            <button
              onClick={onGoToDatabase}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-stone-950 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98]"
            >
              <Database className="h-4 w-4" />
              Founder DB
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-20">
        {/* Hero */}
        <section className="grid min-h-[calc(100vh-72px)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl pt-8 text-white"
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur">
              Private community for serious early founders
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] md:text-7xl">
              Find your people.<br />Build faster.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
              Hustle Hub is the all-in-one community OS for early-stage founders — connect with builders in your niche, launch products for real feedback, hire or co-found, and chat in rooms built for your track. Everything in one place, no switching between tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#join"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-stone-950 shadow-xl shadow-emerald-950/20 transition hover:bg-emerald-300 active:scale-[0.98]"
              >
                Join the directory
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={onGoToDatabase}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 active:scale-[0.98]"
              >
                Founder DB
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { label: "Founders", value: totalFounders },
                { label: "Tracks", value: tables.length },
                { label: "Niches", value: totalProducts },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-black">{item.value}</div>
                  <div className="mt-1 text-xs font-medium text-white/55">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.section
            id="join"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="rounded-[28px] border border-white/50 bg-white/88 p-4 shadow-2xl shadow-stone-950/20 backdrop-blur-xl md:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Registration</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-950">Founder profile</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                  Fill in your short profile and we'll route you into the right founder database automatically.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-stone-950 p-3 text-white sm:block">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            {isSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-black text-stone-950">Profile added</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
                  Your entry is now available in the matching founder track.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => setIsSuccess(false)} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700">
                    Add another
                  </button>
                  <button onClick={onGoToDatabase} className="rounded-lg bg-stone-950 px-4 py-2 text-sm font-bold text-white">
                    Open database
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field icon={User} label="Name" value={formData.name} onChange={(value) => updateField("name", value)} />
                  <Field icon={Mail} label="Email" type="email" value={formData.email} onChange={(value) => updateField("email", value)} />
                  <Field icon={Phone} label="Contact Number" required value={formData.contactNumber} onChange={(value) => updateField("contactNumber", value)} />
                  <Field icon={MapPin} label="Location" value={formData.location} onChange={(value) => updateField("location", value)} />
                  <Field icon={Linkedin} label="LinkedIn Profile" required type="url" value={formData.linkedin} onChange={(value) => updateField("linkedin", value)} />
                  <Field icon={Search} label="X Profile" type="url" value={formData.xProfile} onChange={(value) => updateField("xProfile", value)} />
                  <Field label="Startup Name" value={formData.startupName} onChange={(value) => updateField("startupName", value)} />
                  <Field label="Experience" type="number" value={formData.experience} onChange={(value) => updateField("experience", value)} />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <SelectField label="Persona" value={formData.persona} options={personaOptions} onChange={(value) => updateField("persona", value)} />
                  <SelectField label="Revenue Generated?" value={formData.revenueGenerated} options={["No", "Yes"]} onChange={(value) => updateField("revenueGenerated", value)} />
                </div>

                {formData.revenueGenerated === "Yes" && (
                  <Field label="How much revenue generated?" required value={formData.revenueAmount} onChange={(value) => updateField("revenueAmount", value)} />
                )}

                <TextArea label="Bio" value={formData.bio} onChange={(value) => updateField("bio", value)} rows={2} />
                <TextArea label="Problem Statement" value={formData.problemStatement} onChange={(value) => updateField("problemStatement", value)} rows={2} />
                <TextArea label="Product Description / Niche Targeting" value={formData.productDescription} onChange={(value) => updateField("productDescription", value)} rows={2} />

                {errorMessage && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{errorMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting ? "Adding profile..." : "Add founder profile"}
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </motion.section>
        </section>

        {/* Animated product showcase */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">See it in action</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-stone-950">
              Every tool your founder journey needs
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-500">
              One platform to find collaborators, share what you ship, hire talent, and have the right conversations — all connected through a verified founder identity.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
          >
            <AnimatedAppShowcase products={products} communityMessages={communityMessages} jobs={jobs} tables={tables} />
          </motion.div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-4 py-12 md:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="group relative overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-stone-950/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100 transition group-hover:scale-125" />
              <div className="relative mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-stone-950 text-emerald-300">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="relative text-base font-black tracking-tight text-stone-950">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-stone-500">{feature.copy}</p>
            </motion.div>
          ))}
        </section>

        {/* Coming soon */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-[26px] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-950/5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Coming soon</h3>
                <p className="text-sm text-stone-500">Built for serious community operations</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Play className="h-5 w-5" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {comingSoon.map((item) => (
                <div key={item.title} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <item.icon className="mb-2 h-4 w-4 text-emerald-700" />
                  <div className="text-sm font-black">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-stone-500">{item.copy}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-stone-200 bg-white/70 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <LogoMark dark />
            <div>
              <div className="font-black tracking-tight">Hustle Hub</div>
              <div className="text-sm text-stone-500">Founder community OS</div>
            </div>
          </div>
          <div className="text-sm text-stone-500">Founder DB, product launches, hiring, community rooms, and build sprints.</div>
        </div>
      </footer>
    </div>
  );
}

// ─── Animated App Showcase ───────────────────────────────────────────────────

function AnimatedAppShowcase({
  products,
  communityMessages,
  jobs,
  tables,
}: {
  products: any[];
  communityMessages: Record<string, any[]>;
  jobs: any[];
  tables: Table[];
}) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const TICK = 60;
  const DURATION = 5000;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + (TICK / DURATION) * 100;
        if (next >= 100) {
          setActive((a) => (a + 1) % showcaseTabs.length);
          return 0;
        }
        return next;
      });
    }, TICK);
    return () => clearInterval(timer);
  }, []);

  const handleTab = (idx: number) => {
    setActive(idx);
    setProgress(0);
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-2xl shadow-stone-950/10">
      {/* Tab bar */}
      <div className="border-b border-stone-100 bg-stone-50/80 px-3 pt-3">
        <div className="flex gap-1 overflow-x-auto">
          {showcaseTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => handleTab(idx)}
              className={`relative flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-bold transition ${
                active === idx
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {active === idx && (
                <motion.div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-emerald-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progress / 100 }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content: screen + description side by side */}
      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="min-h-[460px] overflow-hidden border-r border-stone-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full"
            >
              {active === 0 && <GigsBoardScreen />}
              {active === 1 && <CommunityScreen communityMessages={communityMessages} />}
              {active === 2 && <ProductBoardScreen products={products} tables={tables} />}
              {active === 3 && <FounderDBScreen tables={tables} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Description panel */}
        <div className="flex flex-col justify-center bg-stone-50/60 p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-950 text-emerald-300">
                {React.createElement(showcaseTabs[active].icon, { className: "h-5 w-5" })}
              </div>
              <h3 className="text-xl font-black leading-tight tracking-tight text-stone-950">
                {showcaseTabs[active].heading}
              </h3>
              <p className="text-sm leading-7 text-stone-500">{showcaseTabs[active].desc}</p>

              {/* Dot nav */}
              <div className="flex gap-2 pt-2">
                {showcaseTabs.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTab(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === active ? "w-8 bg-stone-950" : "w-2 bg-stone-300"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Gigs Board Screen ────────────────────────────────────────────────────────

function GigsBoardScreen() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
            <Users className="h-3 w-3" /> Gigs Board
          </span>
          <h2 className="mt-3 text-2xl font-black text-stone-950">Creator Opportunities &amp; Hiring</h2>
          <p className="mt-1 max-w-lg text-sm text-stone-500">
            Post contracts, co-founder search ads, freelance tasks, or full-time roles. Get recommended candidates conversationally.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            boxShadow: [
              "0 0 0 0px rgba(16,185,129,0)",
              "0 0 0 7px rgba(16,185,129,0.18)",
              "0 0 0 0px rgba(16,185,129,0)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0.8 }}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-200"
        >
          <Plus className="h-4 w-4" />
          Post an Opening
        </motion.button>
      </div>

      {/* Filter row */}
      <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
            <Filter className="h-3 w-3" /> Category Filter:
          </span>
          {["All Hub Gigs", "Tech / Developers", "Growth / Marketing", "Designers / Creators", "Other Specialties"].map(
            (cat, idx) => (
              <span
                key={cat}
                className={`cursor-pointer rounded-lg border px-3 py-1 text-[10px] font-black transition ${
                  idx === 0
                    ? "border-stone-300 bg-white text-stone-900 shadow-sm"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
              >
                {cat}
              </span>
            )
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-black text-stone-400">Sort By:</span>
            <span className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold text-stone-700">
              Posted Date: Newest First ▾
            </span>
          </div>
        </div>
      </div>

      {/* Job card */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-black text-stone-950">Product Designer &amp; UI Prototyper</h4>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-stone-500">Vibelabs UX</span>
                <span className="text-stone-300">·</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Category: Design</span>
              </div>
            </div>
          </div>
          <span className="shrink-0 text-[10px] text-stone-400">2026-05-25</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-stone-100 bg-stone-50 px-2.5 py-1 text-[10px] font-bold text-stone-600">
            <MapPin className="h-2.5 w-2.5" /> Bengaluru Hybrid
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            $ $90k – $110k
          </span>
        </div>

        <p className="mt-3 text-xs leading-5 text-stone-500">
          Seeking a designer with strong skills in Figma, Tailwind CSS component outputs, and sleek motion animations. Help us polish SaaS dashboard screens for launch.
        </p>

        <div className="mt-3 text-[10px] text-stone-400">
          Posted &amp; managed by:{" "}
          <span className="cursor-pointer font-bold text-emerald-600 underline underline-offset-2">Karan Malhotra</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-stone-50 pt-3">
          <div className="flex gap-4">
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 transition hover:text-rose-500">
              <Heart className="h-3.5 w-3.5" /> 8
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 transition hover:text-stone-600">
              <MessageCircle className="h-3.5 w-3.5" /> Replies (0)
            </button>
          </div>
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 transition hover:text-stone-600">
            <ExternalLink className="h-3 w-3" /> Share Link
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Community Screen ─────────────────────────────────────────────────────────

function CommunityScreen({ communityMessages }: { communityMessages: Record<string, any[]> }) {
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setShowNew(false);
    const t = setTimeout(() => setShowNew(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const messages = [
    {
      name: "Vikram Dev",
      role: "Tech Person",
      text: "Hey space builders! Does anybody have a solid Vite middleware template for combining typescript Express backend servers?",
      time: "11:21 AM",
      color: "indigo",
    },
    {
      name: "Alice Cooper",
      role: "Tech Person",
      text: "Yes Vikram, check out the Hustle Hub custom server.ts. It mounts Vite dynamically in development mode and bundles cleanly via CJS in production.",
      time: "11:24 AM",
      color: "emerald",
    },
    {
      name: "Aris Thorne",
      role: "Tech Person",
      text: "Just added dynamic filters on minimum experienced founders too. Syncing in Firestore is working beautiful!",
      time: "11:30 AM",
      color: "violet",
    },
  ];

  const channels = [
    { tag: "#TE", name: "#tech-bui...", count: 142, desc: "Tech Founders, stack, datab...", preview: "hi", active: true },
    { tag: "#GR", name: "#growth-en...", count: 119, desc: "Marketing hacks, newsletters...", preview: "We saw a 4% increase in...", active: false },
    { tag: "#CO", name: "#content-cr...", count: 95, desc: "Short-form clips, hook frame...", preview: "Has anybody tried evalu...", active: false },
  ];

  return (
    <div className="flex h-full min-h-[460px] bg-[#0f172a]">
      {/* Left sidebar */}
      <div className="flex w-52 shrink-0 flex-col border-r border-slate-800 bg-[#0b1120]">
        <div className="border-b border-slate-800 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-2.5 py-2">
            <Search className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">Search community groups...</span>
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {channels.map((ch) => (
            <div
              key={ch.tag}
              className={`cursor-pointer rounded-xl p-2.5 transition ${
                ch.active ? "border border-slate-700 bg-slate-800" : "hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black text-white ${
                    ch.active ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  {ch.tag}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[10px] font-black text-slate-200">{ch.name}</span>
                    <span className="ml-1 text-[9px] font-bold text-emerald-400">{ch.count}</span>
                  </div>
                  <div className="text-[9px] font-medium text-slate-500">online</div>
                  <div className="truncate text-[9px] text-slate-500">{ch.desc}</div>
                  <div className="truncate font-mono text-[9px] text-indigo-400">{ch.preview}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 p-3">
          <div className="rounded-lg border border-amber-800/30 bg-amber-900/20 p-2">
            <div className="mb-1 text-[9px] font-black uppercase text-amber-400">Authenticated Profile Status</div>
            <div className="text-[9px] leading-4 text-amber-300/70">
              ⚠ Profile Session Offline. Enter name in sidebar to verify access.
            </div>
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-800 bg-[#0f172a] px-4 py-2.5">
          <span className="text-sm font-black text-emerald-400">#tech-builders</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400">142 online</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.18 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-black uppercase text-slate-300">
                {msg.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-200">{msg.name}</span>
                  <span className="text-[9px] font-medium text-slate-500">({msg.role})</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">{msg.text}</p>
                <div className="mt-1 text-[9px] text-slate-600">{msg.time}</div>
              </div>
            </motion.div>
          ))}

          {showNew && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-[10px] font-black text-white">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-200">Anonymous Creator</span>
                  <span className="text-[9px] text-slate-500">(Tech Person)</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">hi</p>
                <div className="mt-1 text-[9px] text-slate-600">02:49 PM</div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-900/30 bg-amber-950/30 px-4 py-2.5">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400">🔒</span>
              <div>
                <div className="text-[10px] font-black text-amber-300">Profile Session Signed Out</div>
                <div className="text-[9px] leading-4 text-amber-300/60">
                  Sign-in to your registered Profile Name inside the sidebar to join active group chats.
                </div>
              </div>
            </div>
            <button className="shrink-0 rounded-lg bg-slate-700 px-3 py-1.5 text-[10px] font-black text-slate-200">
              Join Sidebar Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Board Screen ─────────────────────────────────────────────────────

function ProductBoardScreen({ products, tables }: { products: any[]; tables: Table[] }) {
  const [votes, setVotes] = useState([42, 36]);

  useEffect(() => {
    const t = setInterval(() => {
      setVotes((v) => [Math.random() > 0.65 ? v[0] + 1 : v[0], v[1]]);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const items = [
    {
      title: "SaaS Launch Kit",
      by: "Aris Thorne",
      track: "Tech Person",
      tagline: "The fastest way for Tech builders to ship elegant NextJS applications in 1 hour.",
      desc: "Packed with pre-configured authentication, Firebase syncing patterns, and custom tailwind themes so you don't keep rebuilding the wheel.",
      comments: 2,
      date: "2026-05-20",
    },
    {
      title: "GrowthFlow Engine",
      by: "Maya Lin",
      track: "Growth Person",
      tagline: "Automate LinkedIn and X social lead scoring directly inside your spreadsheet columns.",
      desc: "Calculates persona affinity scores and automatically prompts AI to write targeted custom copy without leaving your lead list tracker tabs.",
      comments: 1,
      date: "2026-05-22",
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
            <Rocket className="h-3 w-3" /> Spotlight Board
          </span>
          <h2 className="mt-3 text-2xl font-black text-stone-950">Your Products &amp; Ships</h2>
          <p className="mt-1 text-sm text-stone-500">
            Showcase what you are building to other hustlers, capture community upvotes, and extract direct raw product feedback.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          animate={{
            boxShadow: [
              "0 0 0 0px rgba(99,102,241,0)",
              "0 0 0 7px rgba(99,102,241,0.2)",
              "0 0 0 0px rgba(99,102,241,0)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0.5 }}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-200"
        >
          <Plus className="h-4 w-4" />
          Launch Product
        </motion.button>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.18 }}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex gap-4">
              <div className="flex min-w-[52px] flex-col items-center gap-1 rounded-xl border border-stone-100 bg-stone-50 p-2.5">
                <TrendingUp className="h-4 w-4 text-stone-400" />
                <motion.span
                  key={votes[idx]}
                  initial={{ scale: 1.4, color: "#4f46e5" }}
                  animate={{ scale: 1, color: "#0c0a09" }}
                  transition={{ duration: 0.4 }}
                  className="text-sm font-black"
                >
                  {votes[idx]}
                </motion.span>
                <TrendingUp className="h-3 w-3 rotate-180 text-stone-200" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-stone-950">{item.title}</span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-stone-500">
                        By {item.by} ({item.track})
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-stone-700">{item.tagline}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{item.desc}</p>
                  </div>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-stone-300" />
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-stone-50 pt-3 text-[10px] text-stone-400">
                  <span className="flex items-center gap-1 font-bold text-indigo-500">
                    <MessageCircle className="h-3 w-3" /> Feedback Comments ({item.comments})
                  </span>
                  <span>Posted: {item.date}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Founder DB Screen ────────────────────────────────────────────────────────

const DUMMY_ROWS = [
  {
    id: "d1",
    Name: "Arjun Mehta",
    Persona: "Tech",
    Location: "Bengaluru",
    "Startup Name": "NeuralKit",
    "Experience (Yrs)": "4",
    "Revenue Generated": "Yes",
    "Revenue Amount": "$14,000",
    Bio: "Building AI-powered dev tools for early-stage SaaS teams.",
    Status: "Active Founder",
  },
  {
    id: "d2",
    Name: "Priya Sharma",
    Persona: "Growth",
    Location: "Delhi",
    "Startup Name": "LearnLoop",
    "Experience (Yrs)": "6",
    "Revenue Generated": "Yes",
    "Revenue Amount": "$38,000",
    Bio: "Scaling EdTech through community-led growth and viral loops.",
    Status: "Active Founder",
  },
  {
    id: "d3",
    Name: "Lucas Rivera",
    Persona: "Tech",
    Location: "Madrid",
    "Startup Name": "FrameOS",
    "Experience (Yrs)": "2",
    "Revenue Generated": "No",
    "Revenue Amount": "",
    Bio: "Fullstack founder building open-source deployment tooling.",
    Status: "Active Founder",
  },
];

function FounderDBScreen({ tables }: { tables: Table[] }) {
  const rows = DUMMY_ROWS;

  const cols = [
    { id: "c1", name: "Name", width: "w-36" },
    { id: "c2", name: "Persona", width: "w-28" },
    { id: "c3", name: "Startup Name", width: "w-32" },
    { id: "c4", name: "Location", width: "w-28" },
    { id: "c5", name: "Experience (Yrs)", width: "w-28" },
    { id: "c6", name: "Revenue Amount", width: "w-28" },
    { id: "c7", name: "Bio", width: "w-56" },
  ];

  return (
    <div className="flex h-full min-h-[460px] flex-col bg-slate-50/30 p-4 space-y-3">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 shrink-0">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tech Founders</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full font-mono">
              {rows.length} shown
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Interactive curated data sheets created and managed directly in your offline sandbox workspace.
          </p>
        </div>
        <button className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          Export JSON
        </button>
      </div>

      {/* Filter bar — matches real workspace */}
      <div className="bg-white border border-slate-200/90 rounded-xl px-3 py-2.5 shadow-sm flex flex-wrap gap-3 items-center shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
          <Filter className="w-3 h-3 text-indigo-500" />
          Filters
        </div>
        <div className="flex-1 min-w-[140px] relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <div className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-slate-400">
            Search matching names, titles, niche...
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500">Min Exp (Yrs):</span>
          <div className="bg-slate-50 border border-slate-200 text-[10px] px-2 py-1.5 rounded-md text-slate-600">All ▾</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500">Revenue Status:</span>
          <div className="bg-slate-50 border border-slate-200 text-[10px] px-2 py-1.5 rounded-md text-slate-600">All Records ▾</div>
        </div>
      </div>

      {/* Table — matches real workspace design */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-auto">
        <table className="min-w-full text-xs text-left border-collapse table-fixed select-text">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="w-8 text-center p-2 font-bold text-slate-400 border-r border-slate-100 text-[9px] uppercase tracking-wider font-mono sticky top-0 bg-slate-50/80 z-10">#</th>
              <th className="w-8 text-center p-2 font-bold text-slate-400 border-r border-slate-100 text-[9px] uppercase tracking-wider sticky top-0 bg-slate-50/80 z-10">👁</th>
              {cols.map((col) => (
                <th key={col.id} className={`p-2 px-3 font-semibold text-slate-600 border-r border-slate-100 ${col.width} sticky top-0 bg-slate-50 z-10 text-[10px] uppercase tracking-wider`}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.12 }}
                className="hover:bg-indigo-50/20 border-b border-slate-100 transition-colors bg-white"
              >
                <td className="w-8 text-center text-slate-400 font-mono text-[10px] border-r border-slate-100 bg-slate-50/20 py-2.5">{idx + 1}</td>
                <td className="w-8 text-center border-r border-slate-100 py-2.5">
                  <div className="mx-auto w-5 h-5 rounded-md bg-slate-100/80 text-indigo-500 flex items-center justify-center">
                    <Database className="w-2.5 h-2.5" />
                  </div>
                </td>
                <td className="p-2 px-3 border-r border-slate-100 text-[11px] font-semibold text-slate-800 truncate w-36">{row["Name"]}</td>
                <td className="p-2 px-3 border-r border-slate-100 w-28">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${row["Persona"] === "Tech" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-700"}`}>
                    {row["Persona"]}
                  </span>
                </td>
                <td className="p-2 px-3 border-r border-slate-100 text-[10px] text-slate-600 truncate w-32">{row["Startup Name"]}</td>
                <td className="p-2 px-3 border-r border-slate-100 text-[10px] text-slate-500 truncate w-28">{row["Location"]}</td>
                <td className="p-2 px-3 border-r border-slate-100 text-[10px] text-slate-500 w-28">{row["Experience (Yrs)"]} yrs</td>
                <td className="p-2 px-3 border-r border-slate-100 w-28">
                  {row["Revenue Generated"] === "Yes" ? (
                    <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">{row["Revenue Amount"]}</span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Pre-revenue</span>
                  )}
                </td>
                <td className="p-2 px-3 border-r border-slate-100 text-[10px] text-slate-500 truncate w-56">{row["Bio"]}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl shadow-lg ${dark ? "bg-stone-950" : "bg-white"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#34d399,transparent_32%),linear-gradient(135deg,#0f172a,#064e3b_55%,#facc15)]" />
      <div className="relative h-6 w-6 rounded-lg border-2 border-white/90">
        <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-stone-950" />
        <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-white/90" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ElementType;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[11px] font-bold text-stone-500">
        {label} {required && <span className="text-emerald-700">*</span>}
      </span>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />}
        <input
          type={type}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${Icon ? "pl-9" : ""}`}
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[11px] font-bold text-stone-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows: number;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-[11px] font-bold text-stone-500">
        {label} {required && <span className="text-emerald-700">*</span>}
      </span>
      <textarea
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}
