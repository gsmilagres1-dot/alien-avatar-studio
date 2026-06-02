import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Sparkles, Wand2, Calendar as CalendarIcon, Check, RotateCcw, Rocket, Printer } from "lucide-react";
import { PLANETS, SHIPS, generateAlienIdentity, type PlanetId, type Gender, type AlienIdentity } from "@/lib/alien";
import { AlienCard } from "@/components/AlienCard";
import { ShareButtons } from "@/components/ShareButtons";
import { createAvatarDraft, getActivePayment, saveIdentity, generateShipImage } from "@/lib/identities.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/criar")({ component: Criar });

type Step = "intro" | "form" | "drafts" | "final";

function Criar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getActive = useServerFn(getActivePayment);
  const draftFn = useServerFn(createAvatarDraft);
  const saveFn = useServerFn(saveIdentity);
  const shipFn = useServerFn(generateShipImage);

  const { data: active, isLoading } = useQuery({
    queryKey: ["active-payment"],
    queryFn: () => getActive(),
  });

  const [step, setStep] = useState<Step>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("undefined");
  const [planet, setPlanet] = useState<PlanetId>("marte");
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState<AlienIdentity & { avatarUrl: string; id: string; shipImageUrl: string | null } | null>(null);
  const [shipCategory, setShipCategory] = useState<"esportiva" | "offroad" | "corrida">("esportiva");
  const [shipLoading, setShipLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const payment = active?.payment ?? null;
  const drafts = active?.drafts ?? [];

  useEffect(() => {
    if (!isLoading) {
      if (payment && drafts.length === 0) setStep("form");
      else if (payment && drafts.length > 0) setStep("drafts");
      else setStep("intro");
    }
  }, [isLoading, payment, drafts.length]);

  function onPickFile(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Imagem > 8MB");
    const r = new FileReader();
    r.onload = () => setPhoto(r.result as string);
    r.readAsDataURL(file);
  }

  async function genDraft() {
    if (!photo) return toast.error("Adicione uma foto");
    if (!name || !birthdate) return toast.error("Preencha nome e data");
    if (!payment) return toast.error("Aguarde…");
    if (drafts.length >= 3) return toast.error("Limite de 3 avatares");
    setGenLoading(true);
    try {
      await draftFn({ data: { photoDataUrl: photo, planetId: planet, gender, paymentId: payment.id } });
      await qc.invalidateQueries({ queryKey: ["active-payment"] });
      setStep("drafts");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenLoading(false);
    }
  }

  async function confirmFinal() {
    if (!selectedDraft || !payment) return;
    setGenLoading(true);
    try {
      const r = await saveFn({ data: { paymentId: payment.id, draftId: selectedDraft, humanName: name, birthdate, gender, planetId: planet } });
      const id = generateAlienIdentity({ name, birthdate, planetId: planet, gender });
      const draftRow = drafts.find((d) => d.id === selectedDraft);
      setSavedIdentity({ ...id, avatarUrl: draftRow?.avatar_url ?? "", id: r.identity.id, shipImageUrl: null });
      await qc.invalidateQueries({ queryKey: ["active-payment"] });
      await qc.invalidateQueries({ queryKey: ["identities"] });
      setStep("final");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenLoading(false);
    }
  }

  async function genShip() {
    if (!savedIdentity) return;
    setShipLoading(true);
    try {
      const r = await shipFn({ data: { identityId: savedIdentity.id, category: shipCategory } });
      setSavedIdentity({ ...savedIdentity, shipImageUrl: r.shipImageUrl });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setShipLoading(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  return (
    <>
      <main className="relative z-10 px-4 py-6 sm:py-10">
        <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => onPickFile(e.target.files?.[0])} />

        <div className="max-w-3xl mx-auto">
          {step === "intro" && (
            <section className="glass rounded-2xl p-8 text-center">
              <Sparkles className="w-10 h-10 text-accent mx-auto" />
              <h2 className="font-display text-2xl mt-3 text-gradient-neon">Criar nova identidade</h2>
              <p className="text-sm text-muted-foreground mt-2">Grátis — até 3 opções de avatar, escolha 1 para virar a identidade final.</p>
              <button onClick={() => setStep("form")} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-display font-bold shadow-neon">
                Começar
              </button>
            </section>
          )}


          {step === "form" && payment && (
            <section className="glass rounded-2xl p-5 sm:p-7">
              <h2 className="font-display text-xl mb-4 text-gradient-neon">Seus dados terráqueos</h2>

              <div className="flex items-center gap-4 mb-5">
                {photo ? (
                  <img src={photo} alt="" className="w-20 h-20 rounded-xl object-cover border border-accent/40 shadow-neon" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-input grid place-items-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <button onClick={() => fileRef.current?.click()} className="text-sm text-accent underline">
                  {photo ? "trocar foto" : "tirar/enviar foto"}
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Seu nome">
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:ring-2 focus:ring-ring outline-none" />
                </Field>
                <Field label="Data de nascimento">
                  <DateInput value={birthdate} onChange={setBirthdate} />
                </Field>
                <Field label="Gênero">
                  <div className="grid grid-cols-3 gap-2">
                    {(["male", "female", "undefined"] as Gender[]).map((g) => (
                      <button key={g} onClick={() => setGender(g)} className={`px-3 py-2.5 rounded-lg border text-sm ${gender === g ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50"}`}>
                        {g === "male" ? "♂ Macho" : g === "female" ? "♀ Fêmea" : "⚧ Não-binário"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Planeta de origem">
                  <div className="grid grid-cols-2 gap-2">
                    {PLANETS.map((p) => (
                      <button key={p.id} type="button" onClick={() => setPlanet(p.id)} className={`text-left px-3 py-2.5 rounded-lg border transition ${planet === p.id ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50 hover:border-accent/50"}`}>
                        <div className="font-display text-sm">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.species}</div>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <button onClick={genDraft} disabled={genLoading} className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-alien-grad text-primary-foreground font-display font-bold shadow-neon disabled:opacity-60">
                {genLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Transmutando DNA...</> : <><Wand2 className="w-5 h-5" />Gerar avatar alien (1/3)</>}
              </button>
            </section>
          )}

          {step === "drafts" && payment && (
            <section>
              <h2 className="font-display text-xl text-center mb-1 text-gradient-neon">Escolha seu avatar final</h2>
              <p className="text-center text-xs text-muted-foreground mb-5">{drafts.length}/3 opções geradas — escolha uma para finalizar.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {drafts.map((d) => (
                  <button key={d.id} onClick={() => setSelectedDraft(d.id)} className={`relative rounded-xl overflow-hidden border-2 transition ${selectedDraft === d.id ? "border-accent shadow-neon" : "border-border"}`}>
                    <img src={d.avatar_url} alt={`Avatar ${d.variant_index}`} className="w-full aspect-square object-cover" />
                    {selectedDraft === d.id && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-1.5"><Check className="w-3 h-3" /></div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 text-center font-mono">Opção #{d.variant_index}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {drafts.length < 3 && (
                  <button onClick={() => setStep("form")} disabled={genLoading} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full glass">
                    <RotateCcw className="w-4 h-4" /> Gerar mais 1 ({drafts.length}/3)
                  </button>
                )}
                <button onClick={confirmFinal} disabled={!selectedDraft || genLoading} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-display font-bold shadow-neon disabled:opacity-50">
                  {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirmar identidade final
                </button>
              </div>
            </section>
          )}

          {step === "final" && savedIdentity && (
            <FinalView
              identity={savedIdentity}
              identityId={savedIdentity.id}
              avatarUrl={savedIdentity.avatarUrl}
              shipImageUrl={savedIdentity.shipImageUrl}
              shipCategory={shipCategory}
              setShipCategory={setShipCategory}
              shipLoading={shipLoading}
              onGenShip={genShip}
              onNew={() => { navigate({ to: "/criar" }); window.location.reload(); }}
              onTravel={() => navigate({ to: "/galaxia", search: { identityId: savedIdentity.id } })}
            />
          )}
        </div>
      </main>
    </>
  );
}

function FinalView(props: {
  identity: AlienIdentity;
  identityId: string;
  avatarUrl: string;
  shipImageUrl: string | null;
  shipCategory: "esportiva" | "offroad" | "corrida";
  setShipCategory: (c: "esportiva" | "offroad" | "corrida") => void;
  shipLoading: boolean;
  onGenShip: () => void;
  onNew: () => void;
  onTravel: () => void;
}) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <section>
      <div className="text-center mb-6">
        <div className="text-[11px] font-mono text-accent uppercase tracking-widest">Identificação confirmada</div>
        <h2 className="font-display text-3xl text-gradient-alien mt-1">{props.identity.alienName}</h2>
        <div className="text-sm text-muted-foreground">{props.identity.species} de {props.identity.planetName} · {props.identity.genderLabel}</div>
      </div>

      <div className="space-y-6 print:space-y-2" id="badges">
        <AlienCard type="identidade" identity={props.identity} avatarUrl={props.avatarUrl} />
        <AlienCard type="trabalho" identity={props.identity} avatarUrl={props.avatarUrl} />
        <AlienCard type="motorista" identity={props.identity} avatarUrl={props.avatarUrl} />
      </div>

      <div className="mt-8 glass rounded-2xl p-5">
        <h3 className="font-display text-base mb-2 flex items-center gap-2"><Rocket className="w-4 h-4 text-accent" /> Sua nave alien</h3>
        {props.shipImageUrl ? (
          <img src={props.shipImageUrl} alt="Nave" className="w-full rounded-xl border border-accent/30" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {SHIPS.map((s) => (
                <button key={s.id} onClick={() => props.setShipCategory(s.id)} className={`px-3 py-2.5 rounded-lg border text-left ${props.shipCategory === s.id ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50"}`}>
                  <div className="font-display text-sm">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={props.onGenShip} disabled={props.shipLoading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-alien-grad text-primary-foreground font-display font-bold shadow-neon disabled:opacity-60">
              {props.shipLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando nave...</> : <><Wand2 className="w-4 h-4" />Gerar nave</>}
            </button>
          </>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <ShareButtons url={url} text={`Sou ${props.identity.alienName}, ${props.identity.species} de ${props.identity.planetName}. Crie a sua identidade alien:`} />
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={props.onTravel} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-alien-grad text-primary-foreground font-bold text-xs shadow-neon">
            <Rocket className="w-3.5 h-3.5" /> Viajar pela galáxia
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-xs">
            <Printer className="w-3.5 h-3.5" /> Imprimir crachá
          </button>
          <button onClick={props.onNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-xs shadow-neon">
            <Sparkles className="w-3.5 h-3.5" /> Criar outra (grátis)
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-");
      if (y && m && d) setRaw(`${d}/${m}/${y}`);
    }
  }, [value]);

  function validate(d: number, m: number, y: number): string | null {
    if (y < 1900 || y > 2100) return "Ano deve estar entre 1900 e 2100";
    if (m < 1 || m > 12) return "Mês inválido";
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) return `Dia inválido para ${String(m).padStart(2, "0")}/${y}`;
    if (new Date(y, m - 1, d) > new Date()) return "Data não pode estar no futuro";
    return null;
  }

  function parseRaw(input: string) {
    const digits = input.replace(/\D/g, "").slice(0, 8);
    let display = digits.slice(0, Math.min(2, digits.length));
    if (digits.length >= 3) display = digits.slice(0, 2) + "/" + digits.slice(2, Math.min(4, digits.length));
    if (digits.length >= 5) display = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
    setRaw(display);

    if (digits.length === 0) { setError(null); onChange(""); return; }
    if (digits.length < 8) { setError("Data incompleta"); onChange(""); return; }

    const d = +digits.slice(0, 2), m = +digits.slice(2, 4), y = +digits.slice(4, 8);
    const err = validate(d, m, y);
    if (err) { setError(err); onChange(""); }
    else { setError(null); onChange(`${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`); }
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={raw}
        onChange={(e) => parseRaw(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? "birthdate-error" : undefined}
        className={`w-full px-4 py-3 rounded-lg bg-input border focus:ring-2 outline-none pr-12 ${error ? "border-destructive focus:ring-destructive" : "border-border focus:ring-ring"}`}
      />
      <button type="button" onClick={() => hiddenDateRef.current?.showPicker?.()} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent">
        <CalendarIcon className="w-5 h-5" />
      </button>
      <input ref={hiddenDateRef} type="date" value={value} max={new Date().toISOString().slice(0, 10)} onChange={(e) => {
        const v = e.target.value;
        if (v) { const [y, m, d] = v.split("-"); setRaw(`${d}/${m}/${y}`); setError(null); onChange(v); }
      }} className="sr-only" tabIndex={-1} />
      {error && (
        <p id="birthdate-error" className="mt-1.5 text-xs text-destructive font-mono">{error}</p>
      )}
    </div>
  );
}
