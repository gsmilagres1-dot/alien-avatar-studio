import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinTeam } from "@/lib/teams.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/equipes/convite/$token")({
  component: InviteAccept,
});

function InviteAccept() {
  const { token } = useParams({ from: "/_authenticated/equipes/convite/$token" });
  const navigate = useNavigate();
  const joinFn = useServerFn(joinTeam);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      await joinFn({ data: { token } });
      setDone(true);
      toast.success("Você entrou na equipe!");
      setTimeout(() => navigate({ to: "/equipes" }), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao entrar");
    } finally { setBusy(false); }
  }

  return (
    <main className="px-4 py-16 max-w-md mx-auto text-center">
      <Users className="w-12 h-12 mx-auto text-accent mb-4" />
      <h1 className="font-display text-xl mb-2">Convite para equipe alien</h1>
      <p className="text-sm text-muted-foreground mb-6">Aceite o convite para entrar nesta equipe e disputar batalhas-quiz.</p>
      {done ? (
        <div className="text-accent flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Bem-vindo(a)!</div>
      ) : (
        <Button onClick={accept} disabled={busy} className="w-full">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aceitar convite"}
        </Button>
      )}
    </main>
  );
}
