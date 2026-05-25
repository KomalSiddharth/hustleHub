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
    rows: []
  },
  {
    id: "table_growth",
    name: "Growth Person",
    createdAt: new Date().toISOString(),
    description: "Database track for marketers, growth hackers, and startup strategists.",
    columns: FORM_COLUMNS,
    rows: []
  },
  {
    id: "table_creator",
    name: "Content Creator",
    createdAt: new Date().toISOString(),
    description: "Database track for writers, community hubs, video producers, and podcasters.",
    columns: FORM_COLUMNS,
    rows: []
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
