import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus, Crown, Link2, LogOut, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createTeam, listTeamsRanking, getMyTeam, updateTeam,
  createInvite, listInvites, leaveTeam, removeMember,
} from "@/lib/teams.functions";

export const Route = createFileRoute("/_authenticated/equipes")({
  component: Equipes,
});

function Equipes() {
  const myTeamFn = useServerFn(getMyTeam);
  const rankingFn = useServerFn(listTeamsRanking);

  const myTeam = useQuery({ queryKey: ["my-team"], queryFn: () => myTeamFn({}) });
  const ranking = useQuery({ queryKey: ["teams-ranking"], queryFn: () => rankingFn({}) });

  return (
    <main className="px-4 py-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl text-gradient-neon">Equipes Alien</h1>
        <WalletBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Forme equipe de até 50 membros e dispute batalhas-quiz online apostando fichas.
      </p>

      {myTeam.isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : myTeam.data ? (
        <MyTeamPanel team={myTeam.data.team} role={myTeam.data.role} onChanged={() => { myTeam.refetch(); ranking.refetch(); }} />
      ) : (
        <CreateTeamPanel onCreated={() => { myTeam.refetch(); ranking.refetch(); }} />
      )}

      <h2 className="font-display text-lg text-accent mt-8 mb-3 flex items-center gap-2">
        <Crown className="w-4 h-4" /> Ranking de equipes
      </h2>
      <div className="space-y-2">
        {ranking.isLoading && <Loader2 className="w-4 h-4 animate-spin mx-auto" />}
        {!ranking.isLoading && (ranking.data?.length ?? 0) === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma equipe ainda — seja a primeira!</p>
        )}
        {ranking.data?.map((t, i) => (
          <div key={t.id} className="glass rounded-xl p-3 border border-accent/20 flex items-center gap-3">
            <div className="text-accent font-display text-sm w-6">#{i + 1}</div>
            <div className="text-xl">{t.flag_emoji ?? "🛸"}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm truncate">{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.members_count}/50 membros · {t.fichas} fichas</div>
            </div>
            <div className="text-accent font-bold text-sm">{t.score} pts</div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-muted-foreground text-center">
        <Link to="/galaxia" className="underline">← voltar para a galáxia singular</Link>
      </div>
    </main>
  );
}

function CreateTeamPanel({ onCreated }: { onCreated: () => void }) {
  const createFn = useServerFn(createTeam);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("🛸");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (name.trim().length < 1) { toast.error("Nome obrigatório"); return; }
    if (name.length > 16) { toast.error("Nome máximo 16 caracteres"); return; }
    setBusy(true);
    try {
      await createFn({ data: { name: name.trim(), flagEmoji: flag, description: desc || null } });
      toast.success("Equipe criada!");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar equipe");
    } finally { setBusy(false); }
  }

  return (
    <div className="glass rounded-2xl p-5 border border-accent/30">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="w-5 h-5 text-accent" />
        <h2 className="font-display text-lg">Fundar nova equipe</h2>
      </div>
      <label className="text-xs text-muted-foreground">Nome (até 16 caracteres, pode usar emojis)</label>
      <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 16))} maxLength={16} placeholder="Ex: Estelares 👽" className="mb-3" />
      <label className="text-xs text-muted-foreground">Bandeira / símbolo</label>
      <Input value={flag} onChange={(e) => setFlag(e.target.value.slice(0, 4))} maxLength={4} placeholder="🇧🇷 ou 🛸" className="mb-3" />
      <label className="text-xs text-muted-foreground">Descrição (opcional)</label>
      <Textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 280))} maxLength={280} placeholder="Lema, planeta, missão…" rows={2} className="mb-3" />
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar equipe"}
      </Button>
    </div>
  );
}

interface TeamRow {
  id: string; name: string; flag_emoji: string | null; country_code: string | null;
  description: string | null; score: number; fichas: number; members_count: number; leader_id: string;
}

function MyTeamPanel({ team, role, onChanged }: { team: TeamRow; role: "leader" | "member"; onChanged: () => void }) {
  const router = useRouter();
  const updateFn = useServerFn(updateTeam);
  const createInviteFn = useServerFn(createInvite);
  const listInvitesFn = useServerFn(listInvites);
  const leaveFn = useServerFn(leaveTeam);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [flag, setFlag] = useState(team.flag_emoji ?? "🛸");
  const [desc, setDesc] = useState(team.description ?? "");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invites = useQuery({
    queryKey: ["team-invites", team.id],
    queryFn: () => listInvitesFn({ data: { teamId: team.id } }),
    enabled: role === "leader",
  });

  async function save() {
    try {
      await updateFn({ data: { teamId: team.id, name, flagEmoji: flag, description: desc } });
      toast.success("Equipe atualizada");
      setEditing(false);
      onChanged();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function genInvite() {
    try {
      const { token } = await createInviteFn({ data: { teamId: team.id } });
      const url = `${window.location.origin}/equipes/convite/${token}`;
      setInviteLink(url);
      invites.refetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function copy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function leave() {
    if (!confirm("Sair da equipe?")) return;
    try {
      await leaveFn({ data: { teamId: team.id } });
      toast.success("Você saiu da equipe");
      onChanged();
      router.invalidate();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="glass rounded-2xl p-5 border border-accent/30">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{team.flag_emoji ?? "🛸"}</div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg truncate flex items-center gap-2">
            {team.name}
            {role === "leader" && <Crown className="w-4 h-4 text-accent" />}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {team.members_count}/50 · {team.score} pts · {team.fichas} fichas
          </div>
        </div>
      </div>
      {team.description && <p className="text-xs text-muted-foreground mb-3">{team.description}</p>}

      {role === "leader" && !editing && (
        <div className="flex flex-wrap gap-2 mb-3">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          <Button size="sm" onClick={genInvite}><Link2 className="w-3 h-3" /> Gerar convite</Button>
        </div>
      )}

      {role === "leader" && editing && (
        <div className="space-y-2 mb-3">
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 16))} maxLength={16} />
          <Input value={flag} onChange={(e) => setFlag(e.target.value.slice(0, 4))} maxLength={4} />
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 280))} maxLength={280} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {inviteLink && (
        <div className="bg-accent/10 rounded-lg p-2 mb-3 flex items-center gap-2">
          <code className="text-[10px] flex-1 truncate text-accent">{inviteLink}</code>
          <Button size="sm" variant="ghost" onClick={copy}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      )}

      {role === "leader" && invites.data && invites.data.length > 0 && (
        <div className="text-[10px] text-muted-foreground mb-3">
          {invites.data.length} convite(s) ativo(s) · {invites.data.reduce((a, i) => a + i.uses, 0)} uso(s)
        </div>
      )}

      {role === "member" && (
        <Button size="sm" variant="outline" onClick={leave} className="gap-1">
          <LogOut className="w-3 h-3" /> Sair da equipe
        </Button>
      )}
      {role === "leader" && (
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> Líder não pode sair — transferir liderança em breve
        </div>
      )}
    </div>
  );
}
