import React, { useState, useEffect } from "react";
import { Key, Server, Check, AlertTriangle, Shield, Trash2, HelpCircle } from "lucide-react";
import type { SavedFirebaseConfig } from "../types";
import { initializeDynamicFirebase, clearActiveFirebase } from "../lib/firebaseSync";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: SavedFirebaseConfig | null;
  onSave: (config: SavedFirebaseConfig | null) => void;
}

export default function FirebaseSettingsModal({ isOpen, onClose, config, onSave }: Props) {
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Individual fields form state in case they prefer pasting fields individually
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  useEffect(() => {
    if (config) {
      setApiKey(config.apiKey || "");
      setAuthDomain(config.authDomain || "");
      setProjectId(config.projectId || "");
      setStorageBucket(config.storageBucket || "");
      setMessagingSenderId(config.messagingSenderId || "");
      setAppId(config.appId || "");
      setJsonInput(JSON.stringify(config, null, 2));
    } else {
      setApiKey("");
      setAuthDomain("");
      setProjectId("");
      setStorageBucket("");
      setMessagingSenderId("");
      setAppId("");
      setJsonInput("");
    }
    setStatus("idle");
    setErrorMessage("");
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Auto-fill individual fields if JSON paste happens
  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
    } catch (e) {
      // Relax, typing...
    }
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("testing");
    setErrorMessage("");

    const newConfig: SavedFirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    if (!newConfig.apiKey || !newConfig.projectId || !newConfig.appId) {
      setStatus("error");
      setErrorMessage("Please fill in at least API Key, Project ID, and App ID.");
      return;
    }

    try {
      await initializeDynamicFirebase(newConfig);
      setStatus("success");
      setTimeout(() => {
        onSave(newConfig);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err?.message || "Could not connect to Firebase Firestore. Check your credentials.");
    }
  };

  const handleDisconnect = () => {
    clearActiveFirebase();
    onSave(null);
    setStatus("idle");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-lg tracking-tight">Connect Personal Firebase</h3>
              <p className="text-xs text-slate-300">Synchronize your workspace with your Firestore backend in real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-xs text-indigo-850 flex gap-3">
            <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-semibold">Zero-Risk Client Isolation:</span> Credentials are saved strictly within your browser's local state and are never transmitted to our servers. All Firestore operations bind dynamically from your browser.
            </div>
          </div>

          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Option A: Paste Firebase Web Config JSON Object
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={`{
  "apiKey": "AIzaSy...",
  "authDomain": "yourparty.firebaseapp.com",
  "projectId": "yourparty",
  "storageBucket": "yourparty.appspot.com",
  "messagingSenderId": "8344...",
  "appId": "1:8344..."
}`}
                rows={5}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Tip: Get this from your Firebase Console &gt; Project Settings &gt; General &gt; Your Apps.
              </p>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-white z-10">
                OR FILL INDIVIDUALLY
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">API Key *</label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="AIzaSy..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Project ID *</label>
                <input
                  type="text"
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="my-personal-project"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Auth Domain</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="projectName.firebaseapp.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">App ID *</label>
                <input
                  type="text"
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="1:1234:web:abcd"
                />
              </div>
            </div>

            {status === "error" && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-700 flex gap-2 items-start animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-650 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Connection Failed:</div>
                  <div className="mt-0.5">{errorMessage}</div>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800 flex gap-2 items-center animate-fade-in">
                <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="font-medium">Success! Connected to Firestore. Saving configuration...</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-150 flex items-center justify-between">
          <div>
            {config && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 py-1 px-3 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Disconnect Database
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800 text-xs px-4 py-2 font-medium bg-white border border-slate-200 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={status === "testing"}
              className="bg-slate-900 border border-slate-900 text-white hover:bg-indigo-700 hover:border-indigo-700 disabled:opacity-50 text-xs px-5 py-2 font-medium rounded-lg transition-all cursor-pointer"
            >
              {status === "testing" ? "Testing Connection..." : "Verify & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
