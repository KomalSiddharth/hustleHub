import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  ListPlus,
  ArrowRightLeft,
  Settings2,
  Edit2,
  FileCheck,
  ChevronDown,
  Download,
  Terminal,
  Search,
  Filter,
  Eye,
  Copy,
  X,
  SlidersHorizontal,
  FileText,
  Lock,
  Globe,
} from "lucide-react";
import type { Table, Column, ColumnType } from "../types";


interface Props {
  table: Table;
  allTables?: Table[];
  onUpdateTable: (updatedTable: Table) => void;
  isAdmin?: boolean;
}

export default function SpreadsheetTable({ table, allTables = [], onUpdateTable, isAdmin = false }: Props) {
  // Spreadsheet Level Filters
  const [textFilter, setTextFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState(""); // filter by minimum experience
  const [revenueFilter, setRevenueFilter] = useState("all"); // Filter options: "all", "yes", "no"

  // Selected row for full details pane on the right
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);

  // Column creation popover / helper states
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<ColumnType>("text");
  const [newColOptions, setNewColOptions] = useState(""); // comma separated
  const [newColPrompt, setNewColPrompt] = useState("");

  // Loading indicator for running processes
  const [runningRowCellIds, setRunningRowCellIds] = useState<Record<string, boolean>>({});

  // Cell currently being edited inline
  // structure: { rowIndex: number, columnId: string }
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colId: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Active select dropdown popup states
  const [activeDropdownCell, setActiveDropdownCell] = useState<{ rowIndex: number; colId: string } | null>(null);

  // Cross-table keyword/niche search
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // 30-day activity unlock tracking
  const activityStatus = useMemo(() => {
    let first = localStorage.getItem("hustle_hub_first_activity");
    if (!first) {
      first = Date.now().toString();
      localStorage.setItem("hustle_hub_first_activity", first);
    }
    const elapsed = Date.now() - parseInt(first);
    const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    return {
      isUnlocked: daysElapsed >= 30,
      daysLeft: Math.max(0, 30 - daysElapsed),
      daysElapsed,
    };
  }, []);

  // Column Properties Modal / state (Allows editing name or prompt template)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editingColName, setEditingColName] = useState("");
  const [editingColPrompt, setEditingColPrompt] = useState("");

  // Create Column Form
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    // Standardize column name to prevent bracket issues in templates e.g. "Customer Name"
    const cleanedName = newColName.trim();
    
    // Check for duplicates
    if (table.columns.some((c) => c.name.toLowerCase() === cleanedName.toLowerCase())) {
      alert("Column with this name already exists.");
      return;
    }

    const newCol: Column = {
      id: "col_" + Date.now().toString(),
      name: cleanedName,
      type: newColType,
      ...(newColType === "select" && {
        options: newColOptions
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }),
      ...(newColType === "prompt_ai" && {
        promptTemplate: newColPrompt.trim(),
      }),
    };

    const updatedTable: Table = {
      ...table,
      columns: [...table.columns, newCol],
      // Initialize brand new cell values in rows as empty or initial state
      rows: table.rows.map((row) => ({
        ...row,
        [cleanedName]: newColType === "checkbox" ? false : "",
      })),
    };

    onUpdateTable(updatedTable);
    setIsAddingColumn(false);
    setNewColName("");
    setNewColType("text");
    setNewColOptions("");
    setNewColPrompt("");
  };

  // Delete Column
  const handleDeleteColumn = (colId: string) => {
    const colToDelete = table.columns.find((c) => c.id === colId);
    if (!colToDelete) return;

    const remainingCols = table.columns.filter((c) => c.id !== colId);
    const updatedRows = table.rows.map((row) => {
      const copy = { ...row };
      delete copy[colToDelete.name];
      return copy;
    });

    onUpdateTable({
      ...table,
      columns: remainingCols,
      rows: updatedRows,
    });
  };

  // Modify Column Details (e.g., Prompt Template change)
  const handleSaveColumnChanges = () => {
    if (!editingColumn) return;
    const cleanedName = editingColName.trim();
    if (!cleanedName) return;

    const oldName = editingColumn.name;
    const updatedCols = table.columns.map((c) => {
      if (c.id === editingColumn.id) {
        return {
          ...c,
          name: cleanedName,
          promptTemplate: c.type === "prompt_ai" ? editingColPrompt.trim() : undefined,
        };
      }
      return c;
    });

    // If name changed, rename keys in row records
    let updatedRows = table.rows;
    if (oldName !== cleanedName) {
      updatedRows = table.rows.map((row) => {
        const copy = { ...row };
        copy[cleanedName] = copy[oldName];
        delete copy[oldName];
        return copy;
      });
    }

    onUpdateTable({
      ...table,
      columns: updatedCols,
      rows: updatedRows,
    });
    setEditingColumn(null);
  };

  // Row Manipulation
  const handleAddRow = () => {
    const newRowId = "row_" + Date.now().toString();
    const newRowRecord: Record<string, any> = { id: newRowId };
    
    // Autofill initial values reflecting column templates
    table.columns.forEach((col) => {
      newRowRecord[col.name] = col.type === "checkbox" ? false : "";
    });

    onUpdateTable({
      ...table,
      rows: [...table.rows, newRowRecord],
    });
  };

  const handleDeleteRow = (index: number) => {
    const remainingRows = table.rows.filter((_, i) => i !== index);
    onUpdateTable({
      ...table,
      rows: remainingRows,
    });
  };

  // Cell Editing Handlers
  const startEditing = (rowIndex: number, col: Column) => {
    if (col.type === "prompt_ai") return; // cannot edit AI column cells directly
    setEditingCell({ rowIndex, colId: col.id });
    setEditValue(String(table.rows[rowIndex][col.name] ?? ""));
  };

  const openCellDetails = (rowRecord: Record<string, any>, colName?: string) => {
    setSelectedRow(rowRecord);
    setSelectedFieldName(colName || null);
  };

  const saveCellEdit = (rowIndex: number, colName: string) => {
    if (!editingCell) return;
    const updatedRows = [...table.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colName]: editValue,
    };
    onUpdateTable({
      ...table,
      rows: updatedRows,
    });
    setEditingCell(null);
  };

  // Toggle Checkbox
  const handleCheckboxToggle = (rowIndex: number, colName: string, currentVal: boolean) => {
    const updatedRows = [...table.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colName]: !currentVal,
    };
    onUpdateTable({
      ...table,
      rows: updatedRows,
    });
  };

  // Dropdown select
  const handleSelectVal = (rowIndex: number, colName: string, selectedVal: string) => {
    const updatedRows = [...table.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colName]: selectedVal,
    };
    onUpdateTable({
      ...table,
      rows: updatedRows,
    });
    setActiveDropdownCell(null);
  };

  // Trigger Gemini AI generation for a single row's prompt field
  const calculateSingleCellAI = async (rowIndex: number, col: Column) => {
    if (col.type !== "prompt_ai" || !col.promptTemplate) return;
    const rowRecord = table.rows[rowIndex];
    const cellKey = `${rowIndex}_${col.id}`;

    setRunningRowCellIds((prev) => ({ ...prev, [cellKey]: true }));

    try {
      const resp = await fetch("/api/gemini/run-column", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptTemplate: col.promptTemplate,
          rowData: rowRecord,
        }),
      });

      if (!resp.ok) {
        throw new Error("API Route failure");
      }

      const json = await resp.json();
      const textResult = json.result || "";

      // Save in state
      const updatedRows = [...table.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [col.name]: textResult,
      };

      onUpdateTable({
        ...table,
        rows: updatedRows,
      });
    } catch (err) {
      console.error(err);
      const updatedRows = [...table.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [col.name]: "⚠️ AI Error. Check key.",
      };
      onUpdateTable({
        ...table,
        rows: updatedRows,
      });
    } finally {
      setRunningRowCellIds((prev) => ({ ...prev, [cellKey]: false }));
    }
  };

  // EXTREMELY POWERFUL: Loop and compute all prompt cells across all rows with parallel limitations
  const runAllAICells = async () => {
    const promptColumns = table.columns.filter((c) => c.type === "prompt_ai" && c.promptTemplate);
    if (!promptColumns.length) {
      alert("No 'Ask AI' columns found to execute. Please add one first!");
      return;
    }

    // Capture and set load state for all target cells
    const loaders: Record<string, boolean> = {};
    table.rows.forEach((_, rowIndex) => {
      promptColumns.forEach((c) => {
        loaders[`${rowIndex}_${c.id}`] = true;
      });
    });
    setRunningRowCellIds(loaders);

    const updatedRows = [...table.rows];

    // Trigger API calls for all rows
    const promises = table.rows.map(async (rowRecord, rowIndex) => {
      for (const col of promptColumns) {
        try {
          const resp = await fetch("/api/gemini/run-column", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              promptTemplate: col.promptTemplate,
              rowData: rowRecord,
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            updatedRows[rowIndex] = {
              ...updatedRows[rowIndex],
              [col.name]: data.result || "",
            };
          } else {
            updatedRows[rowIndex] = {
              ...updatedRows[rowIndex],
              [col.name]: "⚠️ API Key missing in Settings secrets",
            };
          }
        } catch (e) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            [col.name]: "⚠️ Run Error",
          };
        } finally {
          setRunningRowCellIds((prev) => ({ ...prev, [`${rowIndex}_${col.id}`]: false }));
        }
      }
    });

    await Promise.all(promises);

    onUpdateTable({
      ...table,
      rows: updatedRows,
    });
  };

  // Cross-table global search results
  const globalResults = useMemo(() => {
    if (!showGlobalSearch || !textFilter.trim()) return [];
    const query = textFilter.toLowerCase();
    return allTables.flatMap((t) =>
      t.rows
        .filter((row) =>
          Object.entries(row).some(
            ([k, v]) => k !== "id" && String(v || "").toLowerCase().includes(query)
          )
        )
        .map((row) => ({ ...row, __track: t.name }))
    );
  }, [showGlobalSearch, textFilter, allTables]);

  // Filter rows based on textFilter, experienceFilter, and revenueFilter
  const filteredRows = table.rows.filter((rowRecord) => {
    // 1. Universal Search (checks names, companies, titles, locations, niches, etc.)
    if (textFilter.trim()) {
      const query = textFilter.toLowerCase();
      const matchText = Object.keys(rowRecord).some((key) => {
        if (key === "id") return false;
        return String(rowRecord[key] || "").toLowerCase().includes(query);
      });
      if (!matchText) return false;
    }

    // 2. Experience Filter (Minimum Years of experience check)
    if (experienceFilter.trim()) {
      const minYears = parseInt(experienceFilter, 10);
      if (!isNaN(minYears)) {
        // Find if any key includes "experience" or "exp"
        const expKey = Object.keys(rowRecord).find((k) => k.toLowerCase().includes("exp") || k.toLowerCase().includes("experience"));
        if (expKey) {
          const yearsVal = parseInt(String(rowRecord[expKey] || ""), 10);
          if (!isNaN(yearsVal) && yearsVal < minYears) {
            return false;
          }
        }
      }
    }

    // 3. Revenue Made Filter
    if (revenueFilter !== "all") {
      const revKey = Object.keys(rowRecord).find((k) => k.toLowerCase().includes("rev") || k.toLowerCase().includes("has revenue"));
      const revValueStr = revKey ? String(rowRecord[revKey] || "").toLowerCase() : "";
      
      // Look for a numeric value in any key matching "revenue made" or contains "amount" or "rev_amt"
      const amtKey = Object.keys(rowRecord).find((k) => k.toLowerCase().includes("revenue made") || k.toLowerCase().includes("rev_amt") || k.toLowerCase().includes("amount"));
      const amtVal = amtKey ? parseFloat(String(rowRecord[amtKey] || "")) : 0;
      
      const isProfitable = revValueStr.includes("yes") || revValueStr.includes("true") || (!isNaN(amtVal) && amtVal > 0);

      if (revenueFilter === "yes" && !isProfitable) return false;
      if (revenueFilter === "no" && isProfitable) return false;
    }

    return true;
  });

  // Bidirectional synchronisation of values edited inside the right detail drawer
  const handleDrawerValueChange = (colName: string, newValue: any) => {
    if (!selectedRow) return;
    
    const updatedRows = table.rows.map((r) => {
      if (r.id === selectedRow.id) {
        return {
          ...r,
          [colName]: newValue,
        };
      }
      return r;
    });

    onUpdateTable({
      ...table,
      rows: updatedRows,
    });

    // Keep drawer record updated with user keystrokes
    setSelectedRow({
      ...selectedRow,
      [colName]: newValue,
    });
  };

  const handleDownloadJSON = () => {
    if (!activityStatus.isUnlocked) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(table, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `founderdeck_vault_${table.id}.json`);
    dlAnchorElem.click();
  };

  const handleDownloadCSV = () => {
    if (!activityStatus.isUnlocked) return;
    const headers = table.columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(",");
    const rows = table.rows.map((row) =>
      table.columns.map((col) => `"${String(row[col.name] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `founderdeck_${table.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/10 font-sans p-4 md:p-6 space-y-4">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/60 pb-3 gap-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{table.name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full font-mono">
              {filteredRows.length} shown
            </span>
          </h1>
          <p className="text-xs text-slate-550 mt-0.5 max-w-xl font-normal">
            {table.description || "Interactive curated data sheets created and managed directly in your offline sandbox workspace."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && table.columns.some((c) => c.type === "prompt_ai") && (
            <button
              onClick={runAllAICells}
              className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Evaluate all automatic AI formula columns"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluate All Columns</span>
            </button>
          )}

          <div className="relative group">
            <button
              onClick={handleDownloadJSON}
              disabled={!activityStatus.isUnlocked}
              className={`text-[10.5px] font-semibold border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ${
                activityStatus.isUnlocked
                  ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 bg-white cursor-pointer"
                  : "text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed"
              }`}
              title={activityStatus.isUnlocked ? "Download JSON" : `Unlocks in ${activityStatus.daysLeft} days`}
            >
              {activityStatus.isUnlocked ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Export JSON</span>
            </button>
            {!activityStatus.isUnlocked && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                🔒 Active {activityStatus.daysLeft} more days to unlock
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={handleDownloadCSV}
              disabled={!activityStatus.isUnlocked}
              className={`text-[10.5px] font-semibold border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ${
                activityStatus.isUnlocked
                  ? "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border-emerald-200 bg-white cursor-pointer"
                  : "text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed"
              }`}
              title={activityStatus.isUnlocked ? "Download CSV" : `Unlocks in ${activityStatus.daysLeft} days`}
            >
              {activityStatus.isUnlocked ? <FileText className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Export CSV</span>
            </button>
            {!activityStatus.isUnlocked && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                🔒 Active {activityStatus.daysLeft} more days to unlock
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SHEET FILTER CONTROLS BAR --- */}
      {isAdmin && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-wrap gap-4 items-center shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filters</span>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[180px] relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search matching names, titles, niche..."
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700 transition-colors"
            />
          </div>

          {/* Experience minimum filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Min Exp (Yrs):</label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs px-2 py-1.5 rounded-md focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All</option>
              <option value="1">1+ Years</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
              <option value="8">8+ Years</option>
            </select>
          </div>

          {/* Revenue filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Revenue Status:</label>
            <select
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs px-2 py-1.5 rounded-md focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700"
            >
              <option value="all">All Records</option>
              <option value="yes">With Revenue / Profitable</option>
              <option value="no">Pre-Revenue</option>
            </select>
          </div>

          {/* Search all tracks toggle */}
          {allTables.length > 1 && textFilter.trim() && (
            <button
              onClick={() => setShowGlobalSearch((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                showGlobalSearch
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              }`}
              title="Search across all founder tracks"
            >
              <Globe className="w-3.5 h-3.5" />
              {showGlobalSearch ? "All Tracks" : "Search All Tracks"}
            </button>
          )}

          {/* Reset filters */}
          {(textFilter || experienceFilter || revenueFilter !== "all") && (
            <button
              onClick={() => {
                setTextFilter("");
                setExperienceFilter("");
                setRevenueFilter("all");
                setShowGlobalSearch(false);
              }}
              className="text-[10px] font-bold text-rose-500 hover:underline px-2 py-1 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Global search results panel */}
      {showGlobalSearch && textFilter.trim() && (
        <div className="shrink-0 bg-indigo-50/60 border border-indigo-200 rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {globalResults.length} founders matched "{textFilter}" across all tracks
            </span>
            <button onClick={() => setShowGlobalSearch(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
          {globalResults.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center">No founders found across any track.</p>
          ) : (
            <div className="space-y-1.5">
              {globalResults.map((row, idx) => (
                <div key={idx} className="bg-white border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
                    {row.__track}
                  </span>
                  <span className="font-bold text-slate-800 truncate">{row["Name"] || "—"}</span>
                  <span className="text-slate-400 truncate">{row["Startup Name"] || row["Bio"] || ""}</span>
                  <span className="ml-auto shrink-0 text-slate-400">{row["Location"] || ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid Canvas Wrapper with dual split panel */}
      <div className="flex-1 flex overflow-hidden gap-4 min-h-[350px]">
        {/* Table representation Container */}
        <div className="flex-1 bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-auto flex flex-col relative">
          <table className="min-w-full text-xs text-left border-collapse table-fixed select-text">
            {/* Header Row */}
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 select-none">
                <th className="w-12 text-center p-2.5 font-bold text-slate-400 border-r border-slate-100 uppercase tracking-wider font-mono text-[9.5px] sticky top-0 bg-slate-50/80 z-20">#</th>
                <th className="w-12 text-center p-2.5 font-bold text-slate-400 border-r border-slate-100 uppercase tracking-wider font-mono text-[9.5px] sticky top-0 bg-slate-50/80 z-20">Details</th>
                {table.columns.map((col) => (
                  <th
                    key={col.id}
                    className="p-2.5 font-semibold text-slate-750 border-r border-slate-100 w-52 min-w-[208px] max-w-[208px] relative group border-b border-slate-201 sticky top-0 bg-slate-50 z-10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-bold uppercase tracking-wider text-[10.5px] text-slate-600 truncate">{col.name}</span>
                        <span className="text-[8px] uppercase font-mono text-slate-450 font-bold scale-90 translate-y-[0.5px]">
                          ({col.type === "prompt_ai" ? "ai" : col.type})
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button
                            onClick={() => {
                              setEditingColumn(col);
                              setEditingColName(col.name);
                              setEditingColPrompt(col.promptTemplate || "");
                            }}
                            className="p-0.5 hover:bg-slate-200 rounded-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit Schema Options"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-0.5 hover:bg-rose-50 rounded-sm text-slate-405 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body rows */}
            <tbody>
              {filteredRows.map((rowRecord, rIndex) => {
                const isSelected = selectedRow?.id === rowRecord.id;

                return (
                  <tr
                    key={rowRecord.id || rIndex}
                    className={`hover:bg-indigo-50/15 border-b border-slate-100 transition-colors ${
                      isSelected ? "bg-indigo-50/30 font-medium" : "bg-white"
                    }`}
                  >
                    {/* Index row */}
                    <td className="w-12 text-center text-slate-400 font-mono font-normal border-r border-slate-100 bg-slate-50/20 relative group">
                      <span className="group-hover:hidden">{rIndex + 1}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteRow(rIndex)}
                          className="hidden group-hover:inline-block absolute inset-0 mx-auto my-auto w-5 h-5 text-rose-550 hover:text-rose-700 p-0 rounded-md shrink-0 cursor-pointer"
                          title="Delete this row"
                        >
                          x
                        </button>
                      )}
                    </td>

                    {/* View Drawer Action Column */}
                    <td className="w-12 text-center border-r border-slate-100 z-10">
                      <button
                        type="button"
                        onClick={() => openCellDetails(rowRecord)}
                        className={`p-1 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center mx-auto ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100/80 text-indigo-500 hover:bg-indigo-100"
                        }`}
                        title="Open Right Detail Panel"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Column specific cells: guaranteed strictly identical uniform width */}
                    {table.columns.map((col) => {
                      const val = rowRecord[col.name];
                      const isLoading = runningRowCellIds[`${rIndex}_${col.id}`];

                      return (
                        <td
                          key={col.id}
                          className={`p-2 px-3 border-r border-slate-100 relative min-h-[36px] align-middle hover:bg-slate-55/20 transition-all w-52 min-w-[208px] max-w-[208px] overflow-hidden truncate ${
                            col.type === "prompt_ai" ? "bg-slate-50/30" : "cursor-pointer"
                          }`}
                          onClick={() => {
                            if (col.type !== "prompt_ai") {
                              openCellDetails(rowRecord, col.name);
                            }
                          }}
                        >
                          {col.type === "checkbox" ? (
                            <div className="flex items-center justify-center p-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={!!val}
                                onChange={() => handleCheckboxToggle(rIndex, col.name, !!val)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                              />
                            </div>
                          ) : col.type === "select" ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {activeDropdownCell?.rowIndex === rIndex && activeDropdownCell?.colId === col.id ? (
                                <select
                                  value={String(val || "")}
                                  onChange={(e) => handleSelectVal(rIndex, col.name, e.target.value)}
                                  onBlur={() => setActiveDropdownCell(null)}
                                  autoFocus
                                  className="w-full text-xs font-sans rounded-md border border-slate-200 px-2 py-0.5 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                >
                                  <option value="">-- Select --</option>
                                  {col.options?.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div
                                  onClick={() => setActiveDropdownCell({ rowIndex: rIndex, colId: col.id })}
                                  className="flex items-center gap-1 py-0.5 px-2 border border-slate-100/80 hover:bg-slate-100 rounded-md transition-colors w-full justify-between"
                                >
                                  <span
                                    className={`truncate font-medium text-[11px] ${
                                      val
                                        ? "bg-indigo-50/80 border border-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-sm"
                                        : "text-slate-400 italic"
                                    }`}
                                  >
                                    {String(val || "Empty...")}
                                  </span>
                                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                </div>
                              )}
                            </div>
                          ) : col.type === "prompt_ai" ? (
                            <div className="flex items-center justify-between gap-2 p-0.5">
                              {isLoading ? (
                                <div className="flex items-center gap-1 text-indigo-650 font-mono animate-pulse">
                                  <Sparkles className="w-3 h-3 animate-spin shrink-0" />
                                  <span className="text-[10px]">Thinking...</span>
                                </div>
                              ) : val ? (
                                <span className="font-medium text-slate-800 truncate block pr-4 select-all w-full">{String(val)}</span>
                              ) : (
                                <span className="text-slate-400 italic font-mono text-[9px] pr-4">Click evaluation</span>
                              )}
                              {!isLoading && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    calculateSingleCellAI(rIndex, col);
                                  }}
                                  className="text-slate-405 hover:text-indigo-600 p-1 rounded-full absolute right-1 hover:bg-slate-100 transition-all cursor-pointer"
                                  title="Evaluate with Gemini"
                                >
                                  <Sparkles className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            /* Text / Number Standard Cells - truncated to keep columns perfectly identical */
                            <div className="w-full min-h-[20px] flex items-center p-0.5 overflow-hidden">
                              {editingCell?.rowIndex === rIndex && editingCell?.colId === col.id ? (
                                <input
                                  type={col.type === "number" ? "number" : "text"}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => saveCellEdit(rIndex, col.name)}
                                  onKeyDown={(e) => e.key === "Enter" && saveCellEdit(rIndex, col.name)}
                                  autoFocus
                                  className="w-full text-xs font-sans rounded-md border border-slate-350 px-1 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              ) : val !== undefined && val !== "" ? (
                                <span className="text-slate-800 truncate block w-full">{String(val)}</span>
                              ) : (
                                <span className="text-slate-300 font-light block select-none">-</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={table.columns.length + 2} className="py-16 text-center text-slate-400 space-y-2">
                    <Terminal className="w-9 h-9 text-slate-350 mx-auto" />
                    <p className="font-bold text-sm text-slate-700">No matching row database records found</p>
                    <p className="text-xs text-slate-400">
                      Try relaxing your filter coordinates above, or create a new row to input details!
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Table Footer triggers */}
          {isAdmin && (
            <div className="p-3 border-t border-slate-150 bg-slate-50 flex items-center gap-3 shrink-0">
              <button
                onClick={handleAddRow}
                className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-500" /> New Row
              </button>

              {!isAddingColumn ? (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ListPlus className="w-4 h-4 text-slate-500" /> New Field (Column)
                </button>
              ) : (
                <form onSubmit={handleAddColumn} className="bg-slate-50 text-slate-805 rounded-lg p-3 flex flex-wrap gap-2.5 items-center border border-slate-200 animate-fade-in text-xs w-full max-w-4xl text-left">
                  <input
                    type="text"
                    required
                    placeholder="Column Name (e.g., Sentiment)"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 rounded-md px-2.5 py-1.5 w-44 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />

                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as ColumnType)}
                    className="bg-white border border-slate-300 text-slate-705 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-semibold cursor-pointer"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Numeric Row</option>
                    <option value="checkbox">Checkbox toggle</option>
                    <option value="select">Select Option Column</option>
                    <option value="prompt_ai">Ask AI (Formula)</option>
                  </select>

                  {newColType === "select" && (
                    <input
                      type="text"
                      required
                      placeholder="Enter Options e.g: High, Med, Low"
                      value={newColOptions}
                      onChange={(e) => setNewColOptions(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-800 rounded-md px-2.5 py-1.5 w-56 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  )}

                  {newColType === "prompt_ai" && (
                    <input
                      type="text"
                      required
                      placeholder="Prompt Template e.g: Evaluate: '{{Name}}'"
                      value={newColPrompt}
                      onChange={(e) => setNewColPrompt(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-800 rounded-md px-2.5 py-1.5 w-72 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono text-[11px]"
                    />
                  )}

                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsAddingColumn(false)}
                      className="bg-white border border-slate-200 text-slate-550 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-md cursor-pointer text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-md font-bold cursor-pointer text-xs transition"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* --- MULTIPLE COLUMN RIGHT SLIDING DETAILS INSPECTION DRAWER --- */}
        {selectedRow && (
          <div className="w-80 md:w-96 bg-white text-slate-800 rounded-xl border border-slate-200 flex flex-col p-5 shadow-lg relative h-full overflow-hidden shrink-0 animate-fade-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider leading-none">CREATOR DOSSIER</h4>
                  <p className="text-[10px] text-slate-450 font-mono mt-0.5">Row details & editing</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setSelectedRow(null);
                  setSelectedFieldName(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-850 cursor-pointer transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel scrollable content containing dynamically built editable fields */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left custom-scrollbar">
              {[...table.columns].sort((a, b) => {
                if (!selectedFieldName) return 0;
                if (a.name === selectedFieldName) return -1;
                if (b.name === selectedFieldName) return 1;
                return 0;
              }).map((col) => {
                const cellVal = selectedRow[col.name];
                const isFocusedField = selectedFieldName === col.name;

                return (
                  <div key={col.id} className={`space-y-1 group rounded-xl ${isFocusedField ? "bg-emerald-50 border border-emerald-100 p-3" : ""}`}>
                    <div className="flex items-center justify-between">
                      <label className="text-[9.5px] uppercase font-mono text-indigo-600 font-bold tracking-wider">
                        {col.name}
                        <span className="text-[8px] text-slate-500 lowercase ml-1 font-normal">({col.type})</span>
                        {isFocusedField && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[8px] text-white">selected</span>}
                      </label>

                      {cellVal && col.type === "text" && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(cellVal));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-opacity cursor-pointer"
                          title="Copy field text"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {col.type === "checkbox" ? (
                      <div className="flex items-center h-9 bg-slate-50 border border-slate-200 rounded-lg px-3">
                        <input
                          type="checkbox"
                          checked={!!cellVal}
                          onChange={(e) => handleDrawerValueChange(col.name, e.target.checked)}
                          className="w-4 h-4 text-indigo-650 border-slate-300 bg-white rounded focus:ring-indigo-505 accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-xs text-slate-600 ml-2.5 select-none font-medium">
                          {cellVal ? "True / Confirmed" : "False / Unchecked"}
                        </span>
                      </div>
                    ) : col.type === "select" ? (
                      <select
                        value={String(cellVal || "")}
                        onChange={(e) => handleDrawerValueChange(col.name, e.target.value)}
                        className="w-full bg-white border border-slate-250 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="">-- Select Option --</option>
                        {col.options?.map((opt) => (
                           <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : col.type === "prompt_ai" ? (
                      <div className="w-full bg-purple-50/50 border border-purple-100 rounded-lg p-2.5 font-sans text-xs text-slate-700 relative space-y-1">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-purple-600 font-mono uppercase">
                          <Sparkles className="w-3 h-3" />
                          <span>Generated by DB Copilot</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{String(cellVal || "Formula cell is empty. Evaluate in spreadsheets table.")}</p>
                      </div>
                    ) : (
                      /* High quality dynamic editable form inputs */
                      <textarea
                        value={String(cellVal || "")}
                        onChange={(e) => handleDrawerValueChange(col.name, e.target.value)}
                        rows={isFocusedField ? 7 : col.name.toLowerCase().includes("detail") || col.name.toLowerCase().includes("problem") || col.name.toLowerCase().includes("product") || String(cellVal || "").length > 70 ? 3 : 1}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-550 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-slate-455"
                        placeholder={`Enter ${col.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active sync indicator footer in drawer */}
            <div className="mt-4 pt-4 border-t border-slate-200 text-center flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Synchronised Live</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRow(null);
                  setSelectedFieldName(null);
                }}
                className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editing Column Properties Dialog */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="bg-slate-900 p-4 text-white rounded-t-xl text-left">
              <h3 className="font-semibold text-sm">Configure Property: {editingColumn.name}</h3>
            </div>
            <div className="p-5 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Rename Column Name</label>
                <input
                  type="text"
                  value={editingColName}
                  onChange={(e) => setEditingColName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-550"
                />
              </div>

              {editingColumn.type === "prompt_ai" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">AI Prompt Formula</label>
                  <textarea
                    value={editingColPrompt}
                    onChange={(e) => setEditingColPrompt(e.target.value)}
                    rows={4}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Translate {{Feedback}} into Spanish"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Insert fields in double braces: <code className="bg-slate-100 rounded px-1">{"{{ColumnName}}"}</code>. At runtime, the AI evaluates the text substituting each row's data values.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-150 rounded-b-xl flex justify-end gap-2 text-xs">
              <button
                onClick={() => setEditingColumn(null)}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-105 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveColumnChanges}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
