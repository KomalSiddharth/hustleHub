import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Home
} from "lucide-react";
import { onSnapshot, collection } from "firebase/firestore";

// Modularity imports
import type { Table, ChatSession, SavedFirebaseConfig, Message } from "./types";
import { DEFAULT_TABLES } from "./defaultData";
import {
  initializeDynamicFirebase,
  saveTableToStore,
  deleteTableFromStore,
  saveSessionToStore,
} from "./lib/firebaseSync";

// Components
import Sidebar from "./components/Sidebar";
import SpreadsheetTable from "./components/SpreadsheetTable";
import ChatAssistant from "./components/ChatAssistant";
import LandingPage from "./components/LandingPage";
import FirebaseSettingsModal from "./components/FirebaseSettingsModal";
import ProductBoard from "./components/ProductBoard";
import HiringBoard from "./components/HiringBoard";
import WhatsAppCommunity from "./components/WhatsAppCommunity";

export default function App() {
  // Config & Init State
  const [firebaseConfig, setFirebaseConfig] = useState<SavedFirebaseConfig | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("founder_hub_theme") as "light" | "dark") || "dark";
  });

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("founder_hub_theme", next);
  };

  // Active creator session username
  const [sessionName, setSessionName] = useState<string>(() => {
    const savedProfile = localStorage.getItem("hustle_hub_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return String(parsed["Name"] || localStorage.getItem("hustle_hub_logged_name") || "");
      } catch {
        return localStorage.getItem("hustle_hub_logged_name") || "";
      }
    }
    return localStorage.getItem("hustle_hub_logged_name") || "";
  });

  const handleSetSessionName = (val: string) => {
    setSessionName(val);
    if (val) {
      localStorage.setItem("hustle_hub_logged_name", val);
    } else {
      localStorage.removeItem("hustle_hub_logged_name");
    }
  };

  // App Master View Mode: "landing" (The Hustle Hub home) OR "database" (Worksheets)
  const [view, setView] = useState<"landing" | "database">("landing");

  // Admin access control state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("founder_hub_is_admin") === "true";
  });

  const handleToggleAdmin = (val: boolean) => {
    setIsAdmin(val);
    localStorage.setItem("founder_hub_is_admin", String(val));
  };

  // Content state
  const [tables, setTables] = useState<Table[]>([]);
  
  // Single active stateful conversation session for whichever database table is focused
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});

  // Active Selected Table ID
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Chat agent response progress state
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);

  // Firestore Snapshot Unsubscription refs
  const unsubscribeTablesRef = useRef<(() => void) | null>(null);

  // --- 1. BOOTSTRAP INITIALIZATION ---
  useEffect(() => {
    // Load config if any
    const savedConfig = localStorage.getItem("founderdeck_saved_firebase");
    let initialConfig: SavedFirebaseConfig | null = null;
    if (savedConfig) {
      try {
        initialConfig = JSON.parse(savedConfig);
        setFirebaseConfig(initialConfig);
      } catch (e) {
        console.error("Corrupted Firebase config.");
      }
    }

    const viteEnv = (import.meta as any).env || {};
    if (!initialConfig && viteEnv.VITE_FIREBASE_API_KEY) {
      initialConfig = {
        apiKey: viteEnv.VITE_FIREBASE_API_KEY,
        authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: viteEnv.VITE_FIREBASE_PROJECT_ID,
        storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: viteEnv.VITE_FIREBASE_APP_ID,
        firestoreDatabaseId: viteEnv.VITE_FIREBASE_DATABASE_ID || undefined,
      };
      setFirebaseConfig(initialConfig);
      localStorage.setItem("founderdeck_saved_firebase", JSON.stringify(initialConfig));
    }

    // Check Local Default Cache and execute dynamic track migrations
    const cachedTables = localStorage.getItem("founderdeck_local_tables");
    let parsedTables: Table[] = [];
    if (cachedTables) {
      try {
        parsedTables = JSON.parse(cachedTables);
      } catch (e) {
        parsedTables = [];
      }
    }

    if (parsedTables.length === 0) {
      parsedTables = [...DEFAULT_TABLES];
    } else {
      // Check if DEFAULT_TABLES are in the list. If not, add them. If yes, make sure their columns include the correct form columns.
      DEFAULT_TABLES.forEach((defT) => {
        const existingIdx = parsedTables.findIndex((t) => t.id === defT.id);
        if (existingIdx === -1) {
          parsedTables.push(defT);
        } else {
          // Overwrite columns to ensure the new requested form fields are strictly available as columns!
          parsedTables[existingIdx].columns = defT.columns;
          // Ensure default row is seeded if empty
          if (parsedTables[existingIdx].rows.length === 0 && defT.rows.length > 0) {
            parsedTables[existingIdx].rows = defT.rows;
          }
        }
      });
    }

    localStorage.setItem("founderdeck_local_tables", JSON.stringify(parsedTables));
    setTables(parsedTables);
    
    if (parsedTables.length > 0) {
      const hasTech = parsedTables.some((x) => x.id === "table_tech");
      setActiveTableId(hasTech ? "table_tech" : parsedTables[0].id);
    }

    // Load active conversation caches
    const cachedC = localStorage.getItem("founder_hub_chat_sessions");
    if (cachedC) {
      try {
        setChatSessions(JSON.parse(cachedC));
      } catch (err) {
        // Safe bypass
      }
    }
  }, []);

  // --- 2. DYNAMIC FIREBASE SYNC Real-Time Listeners ---
  useEffect(() => {
    if (unsubscribeTablesRef.current) unsubscribeTablesRef.current();

    if (!firebaseConfig) {
      setIsFirebaseConnected(false);
      const cachedT = localStorage.getItem("founderdeck_local_tables");
      if (cachedT) setTables(JSON.parse(cachedT));
      return;
    }

    async function bindFirebase() {
      if (!firebaseConfig) return;
      try {
        const { db, success } = await initializeDynamicFirebase(firebaseConfig);
        if (success && db) {
          setIsFirebaseConnected(true);

          unsubscribeTablesRef.current = onSnapshot(
            collection(db, "founderdeck_tables"),
            (snapshot) => {
              const loadedTables: Table[] = [];
              snapshot.forEach((doc) => {
                loadedTables.push(doc.data() as Table);
              });

              if (loadedTables.length > 0) {
                loadedTables.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
                setTables(loadedTables);
                setTables((prevT) => {
                  const checkActive = loadedTables.some((x) => x.id === activeTableId);
                  if (!checkActive && loadedTables.length > 0) {
                    setActiveTableId(loadedTables[0].id);
                  }
                  return loadedTables;
                });
              } else {
                DEFAULT_TABLES.forEach((t) => saveTableToStore(t, true));
              }
            },
            (error) => {
              console.error("Firebase Tables loaded failure:", error);
              setIsFirebaseConnected(false);
            }
          );
        }
      } catch (err) {
        console.error("Firebase sync error:", err);
        setIsFirebaseConnected(false);
      }
    }

    bindFirebase();

    return () => {
      if (unsubscribeTablesRef.current) unsubscribeTablesRef.current();
    };
  }, [firebaseConfig]);

  // --- 3. PERSISTENCE WRAPER CORES ---
  const saveTable = async (updatedTable: Table) => {
    setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
    await saveTableToStore(updatedTable, isFirebaseConnected);
    void syncTableToAirtable(updatedTable);
  };

  const syncTableToAirtable = async (table: Table) => {
    try {
      await fetch("/api/airtable/sync-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table }),
      });
    } catch (err) {
      console.warn("Airtable sync skipped:", err);
    }
  };

  const saveSelectedChatSession = (tableId: string, updatedSession: ChatSession) => {
    const updated = {
      ...chatSessions,
      [tableId]: updatedSession,
    };
    setChatSessions(updated);
    localStorage.setItem("founder_hub_chat_sessions", JSON.stringify(updated));
    void saveSessionToStore(updatedSession, isFirebaseConnected);
  };

  // --- 4. ACTION TRIGGERS ---
  const handleCreateTable = async (name: string, desc: string) => {
    const newId = "table_" + Date.now().toString();
    const newTable: Table = {
      id: newId,
      name,
      description: desc,
      createdAt: new Date().toISOString(),
      columns: [
        { id: "col_" + Date.now() + "_1", name: "Name", type: "text" },
        { id: "col_" + Date.now() + "_2", name: "Description", type: "text" },
        { id: "col_" + Date.now() + "_3", name: "Status", type: "text" },
        { id: "col_" + Date.now() + "_4", name: "Amount ($)", type: "number" },
      ],
      rows: [],
    };

    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    setActiveTableId(newId);

    await saveTableToStore(newTable, isFirebaseConnected);
  };

  const handleDeleteTable = async (id: string) => {
    const remaining = tables.filter((t) => t.id !== id);
    setTables(remaining);

    if (activeTableId === id) {
      setActiveTableId(remaining.length > 0 ? remaining[0].id : null);
    }

    await deleteTableFromStore(id, isFirebaseConnected);
  };

  // --- 5. CHAT PROCESS ENGINE ---
  const handleSendMessage = async (userText: string) => {
    const activeT = tables.find((t) => t.id === activeTableId);
    if (!activeT || isGeneratingChat) return;

    // Get active session or initialize baseline
    const activeS = chatSessions[activeT.id] || {
      id: "session_" + activeT.id,
      name: "Grounded Advisor",
      tableId: activeT.id,
      messages: [
        {
          id: "m_def_" + activeT.id,
          role: "assistant",
          content: `Hi! I am the **The Hustle Hub** Grounded Scout Agent. Ask me to query, summarize, or evaluate records from **"${activeT.name}"**!`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const newUserMsg: Message = {
      id: "m_user_" + Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...activeS.messages, newUserMsg];
    const sessionWithUserMsg: ChatSession = {
      ...activeS,
      messages: updatedMessages,
    };

    // Save state instantly
    saveSelectedChatSession(activeT.id, sessionWithUserMsg);
    setIsGeneratingChat(true);

    try {
      const resp = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          tableSchema: activeT,
          tableRows: activeT.rows,
        }),
      });

      if (!resp.ok) {
        throw new Error("Chat api failed.");
      }

      const json = await resp.json();
      const rawAiText = json.result || "";

      const aiReplyId = "m_ai_" + Date.now().toString();
      const newAiMsg: Message = {
        id: aiReplyId,
        role: "assistant",
        content: rawAiText,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, newAiMsg];
      const sessionWithAiReply: ChatSession = {
        ...activeS,
        messages: finalMessages,
      };

      saveSelectedChatSession(activeT.id, sessionWithAiReply);

      // --- PARSE ANY GROUNDED ROW MUTATIONS CARRIED OUT BY THE AI ---
      const actionSplitToken = "---ACTION---";
      if (rawAiText.includes(actionSplitToken)) {
        const parts = rawAiText.split(actionSplitToken);
        const actionBlock = parts[1]?.trim();
        if (actionBlock) {
          try {
            const parsed = JSON.parse(actionBlock);
            if (parsed.action === "ADD_ROW" && parsed.rowData) {
              const newRowId = "row_" + Date.now().toString();
              const formattedRow: Record<string, any> = { id: newRowId };

              activeT.columns.forEach((c) => {
                formattedRow[c.name] = parsed.rowData[c.name] !== undefined ? parsed.rowData[c.name] : "";
              });

              const updatedTable: Table = {
                ...activeT,
                rows: [...activeT.rows, formattedRow],
              };
              await saveTable(updatedTable);
            } else if (parsed.action === "UPDATE_ROW" && parsed.rowIndex !== undefined && parsed.rowData) {
              const rIdx = Number(parsed.rowIndex);
              if (rIdx >= 0 && rIdx < activeT.rows.length) {
                const updatedRows = [...activeT.rows];
                updatedRows[rIdx] = {
                  ...updatedRows[rIdx],
                  ...parsed.rowData,
                };
                const updatedTable: Table = { ...activeT, rows: updatedRows };
                await saveTable(updatedTable);
              }
            } else if (parsed.action === "DELETE_ROW" && parsed.rowIndex !== undefined) {
              const rIdx = Number(parsed.rowIndex);
              if (rIdx >= 0 && rIdx < activeT.rows.length) {
                const updatedRows = activeT.rows.filter((_, idx) => idx !== rIdx);
                const updatedTable: Table = { ...activeT, rows: updatedRows };
                await saveTable(updatedTable);
              }
            }
          } catch (errJson) {
            console.warn("Row synchronization error:", errJson);
          }
        }
      }
    } catch (err) {
      console.error(err);
      const failMsg: Message = {
        id: "m_ai_err_" + Date.now().toString(),
        role: "assistant",
        content: "⚠️ Applet workspace service could not complete the query. Verify your system GEMINI_API_KEY environment binding.",
        timestamp: new Date().toISOString(),
      };
      saveSelectedChatSession(activeT.id, {
        ...activeS,
        messages: [...updatedMessages, failMsg],
      });
    } finally {
      setIsGeneratingChat(false);
    }
  };

  const handleClearHistory = () => {
    const activeT = tables.find((t) => t.id === activeTableId);
    if (!activeT) return;

    const cleared: ChatSession = {
      id: "session_" + activeT.id,
      name: "Grounded Advisor",
      tableId: activeT.id,
      messages: []
    };

    saveSelectedChatSession(activeT.id, cleared);
  };

  const handleSaveFirebaseConfig = (cfg: SavedFirebaseConfig | null) => {
    setFirebaseConfig(cfg);
    if (cfg) {
      localStorage.setItem("founderdeck_saved_firebase", JSON.stringify(cfg));
    } else {
      localStorage.removeItem("founderdeck_saved_firebase");
    }
  };

  // Find active data objects
  const activeTable = tables.find((t) => t.id === activeTableId);

  // Active Grounded Chat session or build standard initial state for current focused table
  const activeSession: ChatSession = activeTable
    ? chatSessions[activeTable.id] || {
        id: "session_" + activeTable.id,
        name: "Grounded Advisor",
        tableId: activeTable.id,
        messages: []
      }
    : {
        id: "session_general",
        name: "Grounded Advisor",
        tableId: "none",
        messages: []
      };

  return (
    <div className="flex bg-[#fbfcfd] min-h-screen h-screen overflow-hidden font-sans antialiased text-slate-800">
      {view === "landing" ? (
        /* The Hustle Hub creative aesthetic landing page */
        <LandingPage
          onGoToDatabase={() => setView("database")}
          tables={tables}
          onRegisterSuccess={handleSetSessionName}
          onAddRowToTable={async (tableId, freshRow) => {
            const trg = tables.find((x) => x.id === tableId);
            if (trg) {
              const updatedColumns = [...trg.columns];
              Object.keys(freshRow).forEach((key) => {
                if (key !== "id" && !updatedColumns.some((c) => c.name.toLowerCase() === key.toLowerCase())) {
                  updatedColumns.push({
                    id: "col_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
                    name: key,
                    type: typeof freshRow[key] === "number" ? "number" : "text"
                  });
                }
              });

              const updatedTable: Table = {
                ...trg,
                columns: updatedColumns,
                rows: [...trg.rows, freshRow]
              };
              await saveTable(updatedTable);
            }
          }}
        />
      ) : (
        /* High fidelity interactive Database Workspace view */
        <div className="flex flex-1 h-full overflow-hidden">
          <Sidebar
            tables={tables}
            activeTableId={activeTableId}
            onSelectTable={(id) => setActiveTableId(id)}
            sessionName={sessionName}
          />

          <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f7f7]">
            {activeTableId === "spotlight" ? (
              <div className="flex-grow flex flex-col h-full overflow-hidden animate-fade-in">
                {/* Standardized professional workspace header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                      Product Spotlight
                    </span>
                    <span className="text-sm text-slate-500 hidden md:inline">Launches and feedback</span>
                  </div>
                  <button
                    onClick={() => setView("landing")}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Home className="w-3.5 h-3.5 text-indigo-505" />
                    <span>Home</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="w-full space-y-6">
                    <ProductBoard />
                  </div>
                </div>
              </div>
            ) : activeTableId === "gigs" ? (
              <div className="flex-grow flex flex-col h-full overflow-hidden animate-fade-in">
                {/* Standardized professional workspace header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                      Hiring
                    </span>
                    <span className="text-sm text-slate-500 hidden md:inline">Roles, contracts, and collabs</span>
                  </div>
                  <button
                    onClick={() => setView("landing")}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Home</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="w-full space-y-6">
                    <HiringBoard />
                  </div>
                </div>
              </div>
            ) : activeTableId === "whatsapp" ? (
              <div className="flex-grow flex flex-col h-full overflow-hidden animate-fade-in">
                {/* Standardized professional workspace header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                      Community Rooms
                    </span>
                    <span className="text-sm text-slate-500 hidden md:inline">Clean member chat by track</span>
                  </div>
                  <button
                    onClick={() => setView("landing")}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Home className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Home</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                  <div className="w-full">
                    <WhatsAppCommunity tables={tables} sessionName={sessionName} />
                  </div>
                </div>
              </div>
            ) : activeTable ? (
              <div className="flex-1 flex overflow-hidden">
                {/* 1. Left hand: Grounded AI Companion inspired by uploaded image */}
                <ChatAssistant
                  session={activeSession}
                  table={activeTable}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGeneratingChat}
                  onClearHistory={handleClearHistory}
                />

                {/* 2. Right hand: Modern interactive spreadsheet data table */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-[320px] bg-white border-l border-slate-200">
                  {/* Small convenient quick toggle nav action bar */}
                  <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-550 select-none">
                    <span className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>{activeTable.name} / Spreadsheet</span>
                    </span>
                    <button
                      onClick={() => setView("landing")}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
                    >
                      <Home className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Home</span>
                    </button>
                  </div>
                  
                  <SpreadsheetTable table={activeTable} onUpdateTable={saveTable} />
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center bg-slate-950 p-6 flex-col text-center space-y-4 font-sans select-none h-full">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-lg">
                  <Database className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white tracking-tight">Database Portal</h2>
                  <p className="text-xs text-slate-400 max-w-sm">
                    No active sheets. Create a database table in the left sidebar to get started.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Settings configuration modal trigger if any */}
      <FirebaseSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={firebaseConfig}
        onSave={handleSaveFirebaseConfig}
      />
    </div>
  );
}
