import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  Check,
  Database,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Play,
  Rocket,
  Shuffle,
  Search,
  Send,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import type { Table } from "../types";

interface Props {
  onGoToDatabase: () => void;
  tables: Table[];
  onAddRowToTable: (tableId: string, rowData: Record<string, any>) => void;
  onRegisterSuccess: (name: string) => void;
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
    copy: "Search builders by track, niche, location, experience, and revenue.",
  },
  {
    icon: Rocket,
    title: "Product launches",
    copy: "Share what you built and collect useful replies from verified members.",
  },
  {
    icon: Briefcase,
    title: "Hiring",
    copy: "Post roles, collabs, and co-founder asks without leaving the hub.",
  },
  {
    icon: MessageCircle,
    title: "Cohort rooms",
    copy: "Talk inside focused rooms for tech, growth, and creators.",
  },
];

const comingSoon = [
  { icon: Mic, title: "Weekly founder calls", copy: "Schedule group calls, capture transcripts, and keep notes in one place." },
  { icon: Search, title: "Problem scraper", copy: "Reddit, X, LinkedIn, and other platforms will feed fresh problem statements." },
  { icon: Shuffle, title: "Build sprints", copy: "Founders get matched into teams and receive collaborative project briefs." },
  { icon: TrendingUp, title: "Leaderboard", copy: "Top founders, launches, feedback, and shipping streaks in one ranking." },
];

const walkthrough = [
  {
    title: "Founder DB",
    copy: "A searchable workspace for member profiles, personas, niches, revenue stage, location, and founder context.",
    icon: Database,
    screen: "database",
  },
  {
    title: "Product launches",
    copy: "Members can share launches, receive replies, and quickly see which ideas are getting traction.",
    icon: Rocket,
    screen: "products",
  },
  {
    title: "Hiring",
    copy: "Post roles, co-founder asks, collaboration needs, freelance tasks, and open opportunities.",
    icon: Briefcase,
    screen: "hiring",
  },
  {
    title: "Community rooms",
    copy: "Focused rooms for tech, growth, and creator conversations, powered by the member profile.",
    icon: MessageCircle,
    screen: "community",
  },
];

export default function LandingPage({ onGoToDatabase, tables, onAddRowToTable, onRegisterSuccess }: Props) {
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

    const required = [
      formData.name,
      formData.contactNumber,
      formData.bio,
      formData.linkedin,
      formData.xProfile,
      formData.problemStatement,
      formData.experience,
      formData.startupName,
      formData.location,
      formData.productDescription,
    ];

    if (required.some((value) => !value.trim())) {
      setErrorMessage("Please complete the required fields.");
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
      "Name": formData.name.trim(),
      "Email": formData.email.trim(),
      "Contact Number": formData.contactNumber.trim(),
      "Bio": formData.bio.trim(),
      "LinkedIn Profile": formData.linkedin.trim(),
      "X Profile": formData.xProfile.trim(),
      "Persona": formData.persona,
      "Problem Statement": formData.problemStatement.trim(),
      "Experience (Yrs)": formData.experience.trim(),
      "Startup Name": formData.startupName.trim(),
      "Location": formData.location.trim(),
      "Product/Niche Description": formData.productDescription.trim(),
      "Revenue Generated": formData.revenueGenerated,
      "Revenue Amount": formData.revenueGenerated === "Yes" ? formData.revenueAmount.trim() : "",
      "Status": "Active Founder",
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
              Find your people. Build faster.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
              A founder network for verified profiles, product launches, hiring, community rooms, meetings, and a live database.
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
                  Short profile, routed into the right founder database.
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
                  <Field icon={User} label="Name" required value={formData.name} onChange={(value) => updateField("name", value)} />
                  <Field icon={Mail} label="Email" type="email" value={formData.email} onChange={(value) => updateField("email", value)} />
                  <Field icon={Phone} label="Contact Number" required value={formData.contactNumber} onChange={(value) => updateField("contactNumber", value)} />
                  <Field icon={MapPin} label="Location" required value={formData.location} onChange={(value) => updateField("location", value)} />
                  <Field icon={Linkedin} label="LinkedIn Profile" required type="url" value={formData.linkedin} onChange={(value) => updateField("linkedin", value)} />
                  <Field icon={Search} label="X Profile" required type="url" value={formData.xProfile} onChange={(value) => updateField("xProfile", value)} />
                  <Field label="Startup Name" required value={formData.startupName} onChange={(value) => updateField("startupName", value)} />
                  <Field label="Experience" required type="number" value={formData.experience} onChange={(value) => updateField("experience", value)} />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <SelectField label="Persona" value={formData.persona} options={personaOptions} onChange={(value) => updateField("persona", value)} />
                  <SelectField label="Revenue Generated?" value={formData.revenueGenerated} options={["No", "Yes"]} onChange={(value) => updateField("revenueGenerated", value)} />
                </div>

                {formData.revenueGenerated === "Yes" && (
                  <Field label="How much revenue generated?" required value={formData.revenueAmount} onChange={(value) => updateField("revenueAmount", value)} />
                )}

                <TextArea label="Bio" required value={formData.bio} onChange={(value) => updateField("bio", value)} rows={2} />
                <TextArea label="Problem Statement" required value={formData.problemStatement} onChange={(value) => updateField("problemStatement", value)} rows={2} />
                <TextArea label="Product Description / Niche Targeting" required value={formData.productDescription} onChange={(value) => updateField("productDescription", value)} rows={2} />

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

        <section className="space-y-16 py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">What you get</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-stone-950">The full workspace, shown clearly.</h2>
          </div>

          {walkthrough.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-90px" }}
              transition={{ duration: 0.5 }}
              className={`grid items-center gap-8 lg:grid-cols-2 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <WorkspaceScreen type={item.screen} />
              <div className="space-y-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-950 text-emerald-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-3xl font-black tracking-[-0.04em] text-stone-950">{item.title}</h3>
                <p className="max-w-md text-base leading-7 text-stone-500">{item.copy}</p>
              </div>
            </motion.div>
          ))}

          <PreviewCard title="Coming soon" subtitle="Built for serious community operations" icon={Play} delay={0}>
            <div className="grid gap-3 md:grid-cols-2">
              {comingSoon.map((item) => (
                <div key={item.title} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <item.icon className="mb-2 h-4 w-4 text-emerald-700" />
                  <div className="text-sm font-black">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-stone-500">{item.copy}</div>
                </div>
              ))}
            </div>
          </PreviewCard>
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
          <div className="text-sm text-stone-500">Founder DB, launches, hiring, rooms, calls, and build sprints.</div>
        </div>
      </footer>
    </div>
  );
}

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

function WorkspaceScreen({ type }: { type: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-2xl shadow-stone-950/15">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="text-xs font-bold text-stone-400">Hustle Hub preview</div>
      </div>
      <div className="min-h-[340px] p-6">
        {type === "database" && <DatabasePreview />}
        {type === "products" && <ProductsPreview />}
        {type === "hiring" && <HiringPreview />}
        {type === "community" && <CommunityPreview />}
      </div>
    </div>
  );
}

function DatabasePreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-black text-stone-950">Founder DB</div>
          <div className="text-sm text-stone-500">Searchable member records</div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">3 tracks</div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="mb-3 flex gap-2">
          <div className="h-9 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-400">Search founders, niches, revenue...</div>
          <div className="h-9 w-24 rounded-xl bg-stone-950 px-3 py-2 text-center text-xs font-black text-white">Filter</div>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          {["Aarav Sharma | Tech | Bengaluru | $1.5k", "Maya Roy | Growth | Delhi | $3.2k", "Karan Malhotra | Creator | Mumbai | $9.8k"].map((row, idx) => (
            <motion.div
              key={row}
              animate={{ backgroundColor: ["#ffffff", idx === 1 ? "#ecfdf5" : "#ffffff", "#ffffff"] }}
              transition={{ repeat: Infinity, duration: 2.8, delay: idx * 0.35 }}
              className="grid grid-cols-[1fr_80px] border-b border-stone-100 px-3 py-3 text-sm last:border-b-0"
            >
              <span className="font-semibold text-stone-800">{row}</span>
              <span className="text-xs font-black text-emerald-700">Open</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-black text-stone-950">Product launches</div>
          <div className="text-sm text-stone-500">Upvotes and replies</div>
        </div>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white">
          Launch
        </motion.div>
      </div>
      {["SaaS Launch Kit", "GrowthFlow Engine"].map((item, idx) => (
        <motion.div key={item} animate={{ x: [0, idx === 0 ? 8 : -5, 0] }} transition={{ repeat: Infinity, duration: 2.6, delay: idx * 0.4 }} className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex gap-4">
            <div className="grid h-20 w-14 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-center">
              <div className="text-lg font-black text-emerald-600">{idx === 0 ? "42" : "36"}</div>
            </div>
            <div className="flex-1">
              <div className="text-base font-black text-stone-950">{item}</div>
              <div className="mt-1 text-sm font-semibold text-stone-700">{idx === 0 ? "Fast starter kit for SaaS builders." : "Lead scoring for founder-led growth."}</div>
              <div className="mt-3 flex gap-4 border-t border-stone-100 pt-3 text-xs font-bold text-indigo-600">
                <span>Replies ({idx + 1})</span>
                <span className="text-stone-400">Posted 2026-05-{idx === 0 ? "20" : "22"}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function HiringPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-black text-stone-950">Hiring</div>
          <div className="text-sm text-stone-500">Roles, collabs, co-founder asks</div>
        </div>
        <div className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white">Post opening</div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {["All", "Tech", "Growth", "Design"].map((filter, idx) => (
            <motion.span key={filter} animate={{ scale: idx === 0 ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }} className={`rounded-lg px-3 py-1.5 text-xs font-black ${idx === 0 ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500"}`}>
              {filter}
            </motion.span>
          ))}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="text-base font-black text-stone-950">Product Designer and UI Prototyper</div>
          <div className="mt-1 text-sm font-bold text-stone-600">Vibelabs UX</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-lg bg-stone-100 px-2 py-1 text-stone-600">Bengaluru Hybrid</span>
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">$90k - $110k</span>
          </div>
          <div className="mt-4 border-t border-stone-100 pt-3 text-xs font-bold text-indigo-600">Replies (0)</div>
        </div>
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
      <div className="grid min-h-[300px] grid-cols-[190px_1fr]">
        <div className="border-r border-slate-800 p-3">
          <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-500">Search rooms...</div>
          {["Tech Builders", "Growth Lab", "Creator Studio"].map((room, idx) => (
            <motion.div key={room} animate={{ x: [0, idx === 0 ? 5 : 0, 0] }} transition={{ repeat: Infinity, duration: 2.4, delay: idx * 0.3 }} className={`mb-2 rounded-xl p-3 ${idx === 0 ? "bg-slate-800" : ""}`}>
              <div className="text-xs font-black">{room}</div>
              <div className="mt-1 truncate text-[10px] text-slate-500">Latest founder conversation...</div>
            </motion.div>
          ))}
        </div>
        <div className="space-y-3 p-4">
          {["Does anyone have a clean Vite starter?", "Yes, keep API routes in server.ts.", "Just shipped filters for founder profiles."].map((msg, idx) => (
            <motion.div key={msg} animate={{ opacity: [0.75, 1, 0.75] }} transition={{ repeat: Infinity, duration: 2.2, delay: idx * 0.35 }} className="max-w-[86%] rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <div className="text-xs font-black text-emerald-300">{idx === 0 ? "Aarav" : idx === 1 ? "Maya" : "Karan"}</div>
              <div className="mt-1 text-sm text-slate-200">{msg}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  subtitle,
  icon: Icon,
  delay,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, delay }}
      className="overflow-hidden rounded-[26px] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-950/5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <p className="text-sm text-stone-500">{subtitle}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </motion.div>
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

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
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

function TextArea({ label, value, onChange, required, rows }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; rows: number }) {
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
