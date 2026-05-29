import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteIdentity } from "@/lib/identities.functions";
import { listIdentitiesWithJourneys } from "@/lib/gallery.functions";
import { Loader2, Trash2, Plus, Rocket, Skull, Sparkles, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/galeria")({ component: Galeria });

function Galeria() {
  const navigate = useNavigate();
  const list = useServerFn(listIdentitiesWithJourneys);
  const del = useServerFn(deleteIdentity);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["identities-with-journeys"], queryFn: () => list() });

  async function remove(id: string) {
    if (!confirm("Apagar essa identidade e sua viagem?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["identities-with-journeys"] });
      toast.success("Removida");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gradient-neon">Minha galeria</h1>
        <Link to="/criar" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-neon">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Link>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>}

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Rocket className="w-10 h-10 text-accent mx-auto" />
          <p className="font-display mt-3">Nenhuma identidade ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie sua primeira por R$ 2,99.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items.map(({ identity: i, journey }) => {
          const fatal = journey?.final_destination_kind === "fatal";
          const active = journey?.status === "active";
          const done = journey?.status === "completed";
          return (
            <div key={i.id} className="glass rounded-2xl overflow-hidden">
              <img src={i.avatar_url} alt={i.alien_name} className="w-full aspect-square object-cover" />
              <div className="p-4">
                <div className="font-display text-lg text-gradient-neon">{i.alien_name}</div>
                <div className="text-xs text-muted-foreground">{i.species} · {i.planet_id}</div>
                <div className="font-mono text-[10px] text-accent mt-1">{i.id_number}</div>

                <div className={`mt-3 rounded-lg p-2 text-xs flex items-start gap-2 ${fatal ? "bg-destructive/10 border border-destructive/30" : done ? "bg-accent/10 border border-accent/30" : "bg-muted/30"}`}>
                  {fatal ? <Skull className="w-3.5 h-3.5 mt-0.5 text-destructive" />
                    : done ? <Sparkles className="w-3.5 h-3.5 mt-0.5 text-accent" />
                    : <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />}
                  <div className="flex-1">
                    {fatal && <><b>Perdido em</b> {journey.final_destination_name}</>}
                    {done && <><b>Chegou em</b> {journey.final_destination_name}</>}
                    {active && <>Em viagem · nível {journey.current_level}/5</>}
                    {!journey && <>Sem viagem iniciada</>}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => navigate({ to: "/galaxia", search: { identityId: i.id } })}
                    className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                    <Rocket className="w-3 h-3" /> {active ? "Continuar viagem" : journey ? "Ver viagem" : "Começar viagem"}
                  </button>
                  <button onClick={() => remove(i.id)} className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline">
                    <Trash2 className="w-3 h-3" /> Apagar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
