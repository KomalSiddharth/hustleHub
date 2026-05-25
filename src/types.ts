export type ColumnType = "text" | "number" | "checkbox" | "select" | "prompt_ai";

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // for Select columns
  promptTemplate?: string; // for AI columns, e.g., "Summarize {{Feedback}} in 5 words"
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  rows: Record<string, any>[]; // Each row has an 'id' and matches Column names
  description?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  name: string;
  tableId: string; // The table this session is grounded on
  messages: Message[];
  createdAt?: string;
}

export interface SavedFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}
