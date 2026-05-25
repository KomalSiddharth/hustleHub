import type { Table, ChatSession } from "./types";

const FORM_COLUMNS = [
  { id: "col_name", name: "Name", type: "text" as const },
  { id: "col_email", name: "Email", type: "text" as const },
  { id: "col_phone", name: "Contact Number", type: "text" as const },
  { id: "col_bio", name: "Bio", type: "text" as const },
  { id: "col_linkedin", name: "LinkedIn Profile", type: "text" as const },
  { id: "col_xlink", name: "X Profile", type: "text" as const },
  { id: "col_persona", name: "Persona", type: "text" as const },
  { id: "col_problem", name: "Problem Statement", type: "text" as const },
  { id: "col_exp", name: "Experience (Yrs)", type: "text" as const },
  { id: "col_startup", name: "Startup Name", type: "text" as const },
  { id: "col_location", name: "Location", type: "text" as const },
  { id: "col_niche", name: "Product/Niche Description", type: "text" as const },
  { id: "col_has_rev", name: "Revenue Generated", type: "text" as const },
  { id: "col_rev_amt", name: "Revenue Amount", type: "text" as const },
  { id: "col_status", name: "Status", type: "text" as const }
];

export const DEFAULT_TABLES: Table[] = [
  {
    id: "table_tech",
    name: "Tech Person",
    createdAt: new Date().toISOString(),
    description: "Database track for software engineers, product developers, and architects.",
    columns: FORM_COLUMNS,
    rows: [
      {
        id: "row_init_1",
        "Name": "Aarav Sharma",
        "Email": "aarav@example.com",
        "Contact Number": "+91 90000 00001",
        "Bio": "Full-stack founder building developer workflow products.",
        "LinkedIn Profile": "https://linkedin.com/in/aarav",
        "X Profile": "https://x.com/aarav_dev",
        "Persona": "Tech",
        "Problem Statement": "Developers spend too long writing and maintaining API documentation.",
        "Experience (Yrs)": "5",
        "Startup Name": "Synthetix Labs",
        "Location": "Bengaluru, India",
        "Product/Niche Description": "Developer productivity integrations and automated inline API documentation for TypeScript repositories.",
        "Revenue Generated": "Yes",
        "Revenue Amount": "$1,500",
        "Status": "Active Founder"
      }
    ]
  },
  {
    id: "table_growth",
    name: "Growth Person",
    createdAt: new Date().toISOString(),
    description: "Database track for marketers, growth hackers, and startup strategists.",
    columns: FORM_COLUMNS,
    rows: [
      {
        id: "row_init_2",
        "Name": "Maya Roy",
        "Email": "maya@example.com",
        "Contact Number": "+91 90000 00002",
        "Bio": "Growth operator helping early SaaS teams find repeatable acquisition.",
        "LinkedIn Profile": "https://linkedin.com/in/maya-growth",
        "X Profile": "https://x.com/maya_rocket",
        "Persona": "Growth",
        "Problem Statement": "Early teams need clearer acquisition experiments before spending heavily.",
        "Experience (Yrs)": "4",
        "Startup Name": "SaaS Rocket",
        "Location": "Delhi, India",
        "Product/Niche Description": "B2B SaaS lead generation lists and outbound email automation scripts.",
        "Revenue Generated": "Yes",
        "Revenue Amount": "$3,200",
        "Status": "Active Founder"
      }
    ]
  },
  {
    id: "table_creator",
    name: "Content Creator",
    createdAt: new Date().toISOString(),
    description: "Database track for writers, community hubs, video producers, and podcasters.",
    columns: FORM_COLUMNS,
    rows: [
      {
        id: "row_init_3",
        "Name": "Karan Malhotra",
        "Email": "karan@example.com",
        "Contact Number": "+91 90000 00003",
        "Bio": "Creator-founder writing about cloud, tools, and software teams.",
        "LinkedIn Profile": "https://linkedin.com/in/karan-create",
        "X Profile": "https://x.com/karan_codes",
        "Persona": "Content Creation",
        "Problem Statement": "Software leaders need clear summaries of fast-moving tooling shifts.",
        "Experience (Yrs)": "6",
        "Startup Name": "The Digital Nomad",
        "Location": "Mumbai, India",
        "Product/Niche Description": "Editorial analysis covering cloud runtimes and serverless tooling for builders.",
        "Revenue Generated": "Yes",
        "Revenue Amount": "$9,800",
        "Status": "Active Founder"
      }
    ]
  }
];

export const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: "session_1",
    name: "DB Copilot Chat",
    tableId: "table_tech",
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: "m_1",
        role: "assistant",
        content: "Hi! I am your DB Copilot. You can ask me absolute natural-language questions to filter, summarize, insert rows, or compute complex insights from active creator entries. How can I help you navigate the records today?",
        timestamp: new Date().toISOString()
      }
    ]
  }
];
