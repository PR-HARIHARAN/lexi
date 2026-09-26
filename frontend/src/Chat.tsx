import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SendHorizonal, Loader2, Sparkles, Bot, User, Globe, Search, MessageSquarePlus, ChevronDown } from "lucide-react";

type ToolCall = {
  id: string;
  name: string;
  input: any;
  output?: any;
  status: "running" | "completed";
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm Lexi. How can I help you with Indian Law today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const submitQuery = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: "assistant", content: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the server.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) throw new Error("No response body.");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const events = buffer.split("\n\n");
        buffer = events.pop() || ""; 

        for (const event of events) {
          if (event.startsWith("event: ")) {
            const lines = event.split("\n");
            const eventType = lines[0].replace("event: ", "");
            const dataLine = lines.find((l) => l.startsWith("data: "));
            
            if (dataLine) {
              const dataStr = dataLine.replace("data: ", "");
              try {
                const data = JSON.parse(dataStr);
                
                if (eventType === "token") {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === botMessageId 
                        ? { ...msg, content: msg.content + data.content } 
                        : msg
                    )
                  );
                } else if (eventType === "tool_start") {
                  const newToolCall: ToolCall = { 
                    id: Date.now().toString() + Math.random().toString(), 
                    name: data.name, 
                    input: data.input, 
                    status: "running" 
                  };
                  setMessages((prev) => 
                    prev.map((msg) => {
                      if (msg.id === botMessageId) {
                        return { ...msg, toolCalls: [...(msg.toolCalls || []), newToolCall] };
                      }
                      return msg;
                    })
                  );
                } else if (eventType === "tool_end") {
                  setMessages((prev) => 
                    prev.map((msg) => {
                      if (msg.id === botMessageId) {
                        const toolCalls = msg.toolCalls || [];
                        const updatedToolCalls = [...toolCalls];
                        for (let i = updatedToolCalls.length - 1; i >= 0; i--) {
                          if (updatedToolCalls[i].name === data.name && updatedToolCalls[i].status === "running") {
                            updatedToolCalls[i].output = data.output;
                            updatedToolCalls[i].status = "completed";
                            break;
                          }
                        }
                        return { ...msg, toolCalls: updatedToolCalls };
                      }
                      return msg;
                    })
                  );
                } else if (eventType === "error") {
                  console.error("Error from server:", data.message);
                } else if (eventType === "status" && data.message === "completed") {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === botMessageId 
                        ? { ...msg, isStreaming: false } 
                        : msg
                    )
                  );
                }
              } catch (err) {
                console.error("Failed to parse event data", err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Sorry, I encountered an error. Please ensure the backend is running." }
      ]);
    } finally {
      setIsLoading(false);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuery(input);
    }
  };

  const renderToolCall = (tool: ToolCall, index: number) => {
    if (tool.status === "running") {
      return (
        <div key={tool.id} className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 p-2 rounded-lg mb-3 border border-[var(--border-color)] w-fit animate-fade-in-up">
          <Search size={14} className="animate-pulse" />
          <span className="animate-pulse">Searching the web...</span>
        </div>
      );
    }

    if (tool.name.includes("tavily") && tool.output) {
      let urls: string[] = [];
      try {
        let parsed = typeof tool.output === 'string' ? JSON.parse(tool.output) : tool.output;
        if (Array.isArray(parsed)) {
           urls = parsed.map((res: any) => res.url).filter(Boolean);
        }
      } catch (e) {
        // Ignored
      }

      urls = Array.from(new Set(urls));

      if (urls.length > 0) {
        return (
          <details key={tool.id} className="mt-4 pt-3 border-t border-[var(--border-color)] animate-fade-in-up group" style={{ animationDelay: '0.1s' }}>
            <summary className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-[var(--text-secondary)] cursor-pointer select-none outline-none list-none group-open:mb-3">
               <Globe size={14} /> Web Search Sources
               <ChevronDown size={14} className="transition-transform group-open:rotate-180 ml-auto" />
            </summary>
            <div className="flex flex-col gap-2">
              {urls.map((url, idx) => {
                try {
                  const domain = new URL(url).hostname.replace('www.', '');
                  return (
                    <a 
                      key={idx} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex flex-col gap-0.5 text-xs bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2.5 rounded-lg border border-[var(--border-color)] transition-colors w-full max-w-sm"
                      title={url}
                    >
                      <span className="font-semibold text-[var(--text-primary)] truncate">{domain}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate">{url}</span>
                    </a>
                  );
                } catch {
                  return null;
                }
              })}
            </div>
          </details>
        );
      }
    }
    return null;
  };

  const parseMessageContent = (content: string) => {
    let mainContent = content;
    let followUps: string[] = [];
    let parsedSources: {name: string, url: string}[] = [];

    try {
      // Clean up markdown block if it exists
      const cleanedContent = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      if (!cleanedContent) return { mainContent: "", followUps, parsedSources };

      const parsed = JSON.parse(cleanedContent);
      mainContent = parsed.answer || "";
      
      const rawSources = parsed.sources || [];
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/;
      parsedSources = rawSources.map((s: string) => {
        const match = s.match(linkRegex);
        if (match) return { name: match[1], url: match[2] };
        return { name: s, url: s }; 
      });

      followUps = parsed.follow_up_questions || [];
    } catch (e) {
      // If JSON is incomplete (streaming), extract just the answer field with regex
      const answerMatch = content.match(/"answer"\s*:\s*"([\s\S]*?)(?:"\s*,|"\s*\}|$)/);
      if (answerMatch) {
        // Unescape quotes and newlines
        mainContent = answerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      } else {
        // Before "answer" starts streaming, show nothing to avoid rendering raw syntax
        mainContent = "";
      }
    }

    return { mainContent, followUps, parsedSources };
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto w-full p-4 md:p-8 relative z-10 transition-all duration-300">
      <header className="flex items-center gap-3 mb-8 animate-fade-in-up glass-panel p-4 rounded-2xl" style={{ animationDelay: '0.1s' }}>
        <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)] shadow-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lexi Chat</h1>
          <p className="text-sm text-[var(--text-secondary)]">Your intelligent legal assistant</p>
        </div>
      </header>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto mb-6 pr-2 flex flex-col gap-6 scroll-smooth">
        {messages.map((message, index) => {
          const { mainContent, followUps, parsedSources } = parseMessageContent(message.content);

          return (
            <div
              key={message.id}
              className={`flex gap-4 animate-fade-in-up max-w-[85%] ${
                message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
              style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border ${
                message.role === "user" 
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]" 
                  : "glass-panel text-[var(--text-primary)]"
              }`}>
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`flex flex-col gap-3 w-full ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-4 rounded-2xl glass-panel w-full ${
                  message.role === "user" 
                    ? "bg-[var(--user-msg-bg)] rounded-tr-sm" 
                    : "bg-[var(--bot-msg-bg)] rounded-tl-sm"
                }`}>
                  {message.role === "assistant" ? (
                    <div className="flex flex-col">
                      {message.toolCalls?.map((tool, idx) => 
                        tool.status === "running" ? renderToolCall(tool, idx) : null
                      )}
                      
                      <div className="markdown-body">
                        {mainContent === "" && message.isStreaming && (!message.toolCalls || message.toolCalls.every(t => t.status === "completed")) ? (
                          <div className="flex items-center gap-1.5 h-6">
                            <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-pulse-slow"></div>
                            <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-pulse-slow" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-pulse-slow" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        ) : (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, ...props }) => (
                                <a 
                                  {...props} 
                                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-2 py-0.5 rounded-full border border-[var(--border-color)] transition-colors mx-0.5 no-underline align-middle shadow-sm" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Globe size={10} />
                                  <span className="truncate max-w-[150px]">{props.children}</span>
                                </a>
                              )
                            }}
                          >
                            {mainContent}
                          </ReactMarkdown>
                        )}
                        {message.isStreaming && mainContent !== "" && (
                          <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-[var(--text-primary)] animate-pulse"></span>
                        )}
                      </div>

                      {/* Display Markdown Extracted Sources */}
                      {parsedSources.length > 0 && !message.isStreaming && (
                        <details className="mt-4 pt-3 border-t border-[var(--border-color)] group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                          <summary className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text-secondary)] cursor-pointer select-none outline-none list-none group-open:mb-3">
                            <Globe size={14} /> Knowledge Sources 
                            <ChevronDown size={14} className="transition-transform group-open:rotate-180 ml-auto" />
                          </summary>
                          <div className="flex flex-col gap-2">
                            {parsedSources.map((src, idx) => (
                              <a 
                                key={idx} 
                                href={src.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex flex-col gap-0.5 text-xs bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2.5 rounded-lg border border-[var(--border-color)] transition-colors w-full max-w-sm"
                              >
                                <span className="font-semibold text-[var(--text-primary)] truncate">{src.name}</span>
                                <span className="text-[10px] text-[var(--text-secondary)] truncate">{src.url}</span>
                              </a>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Tool (Web Search) Sources */}
                      {message.toolCalls?.map((tool, idx) => 
                        tool.status === "completed" ? renderToolCall(tool, idx) : null
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{mainContent}</div>
                  )}
                </div>

                {/* Render followups directly below the chat bubble container */}
                {followUps.length > 0 && !message.isStreaming && (
                  <div className="flex flex-col gap-2 mt-1 animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] ml-1 flex items-center gap-1.5">
                      <MessageSquarePlus size={14} /> Suggested Follow-ups
                    </span>
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                      {followUps.map((question, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => submitQuery(question)}
                          disabled={isLoading}
                          className="text-left text-[13px] bg-[var(--glass-bg)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="h-4" /> {/* Padding bottom element for scroll */}
      </div>

      <div className="relative mt-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 glass-panel p-2 rounded-2xl transition-all duration-300 hover:shadow-lg focus-within:shadow-xl focus-within:border-[var(--text-secondary)]"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Lexi..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-11 h-11 mb-0.5 mr-0.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading && !messages[messages.length - 1]?.toolCalls?.some(t => t.status === "running") ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <SendHorizonal size={20} />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-[var(--text-secondary)] mt-3 glass-panel inline-block px-3 py-1 rounded-full mx-auto shadow-sm">
          Lexi can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}
