import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, X } from "lucide-react";
import { aiAsk } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which 5 customers owe me the most?",
  "What did I spend on the most this quarter?",
  "Which invoices are most overdue?",
  "Is my net profit improving month-over-month?",
];

export function AIAskDrawer({ snapshot }: { snapshot: unknown }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const callAsk = useServerFn(aiAsk);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await callAsk({ data: { question: q, snapshot } });
      const answer = res.ok ? res.data.answer : `⚠️ ${res.error}`;
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Failed"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full primary-gradient primary-glow text-white shadow-lg animate-pulse-primary hover:scale-105 transition-transform"
        aria-label="Ask AI"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0 sm:max-w-md">
          <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl primary-gradient primary-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  QOBOX AI
                </p>
                <h3 className="text-sm font-bold">Ask anything about your books</h3>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try one of these:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-border bg-card/60 p-3 text-left text-sm hover:border-primary/40 hover:bg-accent/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "ml-8 primary-gradient text-white"
                    : "mr-8 bg-card/80 border border-border/60",
                )}
              >
                <SimpleMarkdown text={m.content} />
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, parties, expenses…"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Tiny markdown renderer: bold, headings, list items, line breaks. Avoids extra deps. */
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (/^#{1,6}\s/.test(line)) {
          return (
            <p key={i} className="font-semibold">
              {line.replace(/^#+\s/, "")}
            </p>
          );
        }
        if (/^[-*]\s/.test(line)) {
          return (
            <p key={i} className="pl-4">
              • {renderInline(line.replace(/^[-*]\s/, ""))}
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
function renderInline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
