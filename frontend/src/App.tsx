import { useState } from "react";
import { Chat } from "./Chat";
import { MessageSquare, Plus, PanelLeftClose, PanelLeft, Settings, History } from "lucide-react";
import "./index.css";

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="w-full h-full bg-[var(--bg-primary)] flex overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-transparent'
        } bg-black/5 dark:bg-white/5 border-r border-[var(--border-color)] flex flex-col h-full flex-shrink-0 z-20 glass-panel backdrop-blur-2xl relative`}
      >
        <div className="p-4 flex items-center justify-between">
          <button className="flex-1 flex items-center justify-center gap-2 bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-primary)] p-2.5 rounded-xl transition-all shadow-sm text-sm font-medium">
            <Plus size={16} /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          <div className="text-xs font-semibold text-[var(--text-secondary)] px-2 py-1.5 flex items-center gap-2">
            <History size={12} /> Recent History
          </div>
          
          <button className="text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 text-sm font-medium text-[var(--text-primary)] truncate transition-colors">
            <MessageSquare size={14} className="flex-shrink-0 text-[var(--text-primary)]" />
            <span className="truncate">Indian Income Tax Queries</span>
          </button>
          
          <button className="text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate">
            <MessageSquare size={14} className="flex-shrink-0" />
            <span className="truncate">Property Registration</span>
          </button>
          
          <button className="text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate">
            <MessageSquare size={14} className="flex-shrink-0" />
            <span className="truncate">GST Registration Docs</span>
          </button>
        </div>
        
        <div className="p-4 border-t border-[var(--border-color)]">
          <button className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Settings size={16} className="flex-shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-50 p-2.5 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] shadow-sm backdrop-blur-md transition-all duration-200 group"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <Chat />
      </div>
    </div>
  );
}

export default App;
