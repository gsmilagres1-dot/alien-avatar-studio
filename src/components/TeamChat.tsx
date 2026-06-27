import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listTeamMessages, sendTeamMessage } from "@/lib/team-chat.functions";

interface Msg {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function TeamChat({ teamId, currentUserId }: { teamId: string; currentUserId: string }) {
  const listFn = useServerFn(listTeamMessages);
  const sendFn = useServerFn(sendTeamMessage);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initial = useQuery({
    queryKey: ["team-messages", teamId],
    queryFn: () => listFn({ data: { teamId } }),
  });

  useEffect(() => {
    if (initial.data) setMessages(initial.data as Msg[]);
  }, [initial.data]);

  useEffect(() => {
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setMessages((prev) => {
            const m = payload.new as Msg;
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      await sendFn({ data: { teamId, content } });
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass rounded-2xl border border-accent/30 overflow-hidden">
      <div className="px-4 py-2 border-b border-accent/20 flex items-center gap-2 bg-accent/5">
        <MessageCircle className="w-4 h-4 text-accent" />
        <span className="font-display text-sm">Chat da equipe</span>
        <span className="ml-auto text-[10px] text-muted-foreground">tempo real</span>
      </div>

      <div ref={scrollRef} className="h-72 overflow-y-auto px-3 py-3 space-y-2 bg-background/40">
        {initial.isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
          </div>
        )}
        {!initial.isLoading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhuma mensagem ainda — diga olá para a equipe 👽
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-xs ${
                  mine
                    ? "bg-accent text-accent-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {!mine && (
                  <div className="text-[9px] opacity-70 mb-0.5 font-mono">
                    {m.user_id.slice(0, 8)}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className="text-[9px] opacity-60 mt-0.5 text-right">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 p-2 border-t border-accent/20 bg-background/60"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          maxLength={500}
          placeholder="Mensagem para a equipe…"
          disabled={sending}
          className="text-xs"
        />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </form>
    </div>
  );
}
