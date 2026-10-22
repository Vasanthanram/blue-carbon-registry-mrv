import React from "react";
import { Trees, Plus, RotateCcw, ShieldCheck, BookOpen } from "lucide-react";

interface HeaderProps {
  onOpenRegister: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRegister, onResetDemo, isResetting }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                Blue Carbon Registry & MRV System
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                Indian Mangroves (Pichavaram Pilot)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Governed Restoration Site Registry, Sentinel-2 Remote Sensing & Capacity Management
            </p>
          </div>
        </div>

        {/* Right: Role indicator & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Role: <strong>Gov / NGO Verifier</strong></span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            title="Open Interactive FastAPI Swagger Documentation"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-700" />
            <span>API Docs</span>
          </a>

          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset to default Pichavaram demonstration data"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{isResetting ? "Resetting..." : "Reset Demo"}</span>
          </button>

          <button
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 border border-teal-800 rounded hover:bg-teal-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Site</span>
          </button>
        </div>

      </div>
    </header>
  );
};

