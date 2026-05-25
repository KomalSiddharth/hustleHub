import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  CheckCircle2,
  Cpu
} from "lucide-react";
import type { Table, ChatSession, Message } from "../types";

interface Props {
  session: ChatSession;
  table: Table;
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onClearHistory: () => void;
}

export default function ChatAssistant({
  session,
  table,
  onSendMessage,
  isGenerating,
  onClearHistory,
}: Props) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isGenerating]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const renderMessageContent = (msg: Message) => {
    const content = msg.content;
    const actionSplitToken = "---ACTION---";

    if (!content.includes(actionSplitToken)) {
      return <p className="leading-relaxed whitespace-pre-wrap">{content}</p>;
    }

    const parts = content.split(actionSplitToken);
    const textPart = parts[0].trim();
    const actionBlockJson = parts[1]?.trim();

    let parsedAction: any = null;
    try {
      if (actionBlockJson) {
        parsedAction = JSON.parse(actionBlockJson);
      }
    } catch (e) {
      // ignore formatting slips
    }

    return (
      <div className="space-y-3">
        {textPart && <p className="leading-relaxed whitespace-pre-wrap">{textPart}</p>}

        {parsedAction && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-1.5 font-mono text-[10.5px] text-slate-700 space-y-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold border-b border-slate-200 pb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Grounded Action Synchronized</span>
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Operation:</span>
                <span className="text-indigo-600 font-bold">{parsedAction.action}</span>
              </div>
              {parsedAction.rowData && (
                <div className="mt-1.5 bg-white border border-slate-200 p-2 rounded-lg text-amber-850 max-h-24 overflow-y-auto">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Payload:</span>
                  <pre className="text-[9.5px] text-slate-700">
                    {JSON.stringify(parsedAction.rowData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full lg:w-96 shrink-0 bg-[#fbfcfd] border-r border-slate-200/90 flex flex-col font-sans h-full">
      {/* Target status header bar */}
      <div className="p-4 border-b border-slate-200/60 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight leading-none">DB Copilot</h3>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="text-[10px] font-medium text-slate-400 hover:text-rose-500 px-2 py-1 rounded-md transition duration-200"
        >
          Clear Chat
        </button>
      </div>

      {/* Conversational timeline messages feed */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#f8fafc]/30">
        {session.messages.map((m) => {
          const isAI = m.role === "assistant";
          return (
            <div key={m.id} className={`flex items-start gap-2.5 ${isAI ? "" : "flex-row-reverse"}`}>
              {/* Init bubble avatar icon */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] font-mono select-none shrink-0 border uppercase ${
                  isAI
                    ? "bg-slate-900 border-slate-800 text-indigo-400"
                    : "bg-indigo-600 border-indigo-700 text-white"
                }`}
              >
                {isAI ? "AI" : "Me"}
              </div>

              {/* Chat Speech Bubble */}
              <div
                className={`text-xs rounded-xl p-3 max-w-[80%] shadow-3xs leading-relaxed font-sans ${
                  isAI
                    ? "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none text-left"
                    : "bg-slate-900 text-white rounded-tr-none text-left"
                }`}
              >
                {renderMessageContent(m)}
                <span className={`block text-[8px] mt-1 text-right font-mono ${isAI ? "text-slate-400" : "text-slate-500"}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] bg-slate-900 text-indigo-400 border border-slate-800 shrink-0 font-mono">
              AI
            </div>
            <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 shadow-3xs w-44">
              <div className="flex items-center gap-1.5 text-indigo-600 font-mono text-[10.5px] animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Grounded chat submit prompt bar - Matches "What should I do instead..." image format */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
            placeholder="What should I do next with database..."
            className="w-full text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-400 bg-slate-50 focus:bg-white rounded-xl p-3 pr-10 focus:outline-hidden transition duration-200 font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
