import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Sparkles, Wand2, Calendar as CalendarIcon, Check, RotateCcw, Rocket, Box, ImageIcon } from "lucide-react";
import { STLPreviewModal } from "@/components/STLPreviewModal";
import techScanBtn from "@/assets/tech-scan-btn.png";
import { RACES, SHIPS, generateAlienIdentity, raceFromBirthdate, type Gender, type AlienIdentity, type ShipId } from "@/lib/alien";
import { AlienCard } from "@/components/AlienCard";
import { ShareButtons } from "@/components/ShareButtons";
import { createAvatarDraft, getActivePayment, saveIdentity, generateShipImage, restartIdentityFlow } from "@/lib/identities.functions";
import { SelfieCropper } from "@/components/SelfieCropper";
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
  const restartFn = useServerFn(restartIdentityFlow);

  const { data: active, isLoading } = useQuery({
    queryKey: ["active-payment"],
    queryFn: () => getActive(),
  });

  const [step, setStep] = useState<Step>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null); // antes do crop ICAO
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("undefined");
  const [planet, setPlanet] = useState<string>("starseed");
  const [raceMode, setRaceMode] = useState<"auto" | "manual">("auto");
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState<AlienIdentity & { avatarUrl: string; id: string; shipImageUrl: string | null } | null>(null);
  const [shipCategory, setShipCategory] = useState<ShipId>("esportiva")
  const [shipLoading, setShipLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem("alien:name") ?? "");
    setBirthdate(localStorage.getItem("alien:birthdate") ?? "");
    setGender((localStorage.getItem("alien:gender") as Gender) ?? "undefined");
    setPlanet(localStorage.getItem("alien:planet") ?? "starseed");
    setRaceMode((localStorage.getItem("alien:raceMode") as "auto" | "manual") ?? "auto");
    setPrefsLoaded(true);
  }, []);

  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("alien:name", name); }, [name]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("alien:birthdate", birthdate); }, [birthdate]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("alien:gender", gender); }, [gender]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("alien:planet", planet); }, [planet]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("alien:raceMode", raceMode); }, [raceMode]);
  useEffect(() => {
    if (raceMode === "auto" && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      setPlanet(raceFromBirthdate(birthdate).id);
    }
  }, [raceMode, birthdate]);

  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const payment = active?.payment ?? null;
  const drafts = active?.drafts ?? [];
  const usedAvatarUrls = (active?.usedAvatarUrls ?? []) as string[];
  const hasForm = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(birthdate);
  const availableDrafts = drafts.filter((draft) => !usedAvatarUrls.includes(draft.avatar_url));

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (isLoading || initialized || !prefsLoaded) return;
    if (payment && availableDrafts.length > 0) setStep("drafts");
    else if (payment) setStep("form");
    else setStep("intro");
    setInitialized(true);
  }, [isLoading, payment, availableDrafts.length, initialized, prefsLoaded]);

  useEffect(() => {
    if (step === "drafts" && !selectedDraft && availableDrafts[0]) {
      setSelectedDraft(availableDrafts[0].id);
    }
  }, [step, selectedDraft, availableDrafts]);

  useEffect(() => {
    if (selectedDraft && !availableDrafts.some((draft) => draft.id === selectedDraft)) {
      setSelectedDraft(availableDrafts[0]?.id ?? null);
    }
  }, [selectedDraft, availableDrafts]);

  useEffect(() => {
    if (!payment) {
      setSavedIdentity(null);
      setSelectedDraft(null);
    }
  }, [payment?.id]);

  function clearFormState() {
    setPhoto(null);
    setName("");
    setBirthdate("");
    setGender("undefined");
    setPlanet("starseed");
    setRaceMode("auto");
    setSelectedDraft(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("alien:name");
      localStorage.removeItem("alien:birthdate");
      localStorage.removeItem("alien:gender");
      localStorage.removeItem("alien:planet");
      localStorage.removeItem("alien:raceMode");
    }
  }

  async function restartFlow() {
    setGenLoading(true);
    try {
      clearFormState();
      setSavedIdentity(null);
      await restartFn();
      await qc.invalidateQueries({ queryKey: ["active-payment"] });
      setStep("form");
      toast.success("Novo começo liberado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenLoading(false);
    }
  }

  // Botão "Começar" da tela inicial. Se já existe uma sessão ativa, só avança
  // pro formulário. Se não existe (payment null), cria uma na hora em vez de
  // mandar o usuário pra galeria comprar — o modo grátis é ilimitado.
  async function startFlow() {
    if (payment) {
      setStep("form");
      return;
    }
    await restartFlow();
  }

  function onPickFile(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Imagem > 8MB");
    const r = new FileReader();
    r.onload = () => {
      // Abre cropper ICAO 5x7 antes de aceitar
      setRawPhoto(r.result as string);
    };
    r.readAsDataURL(file);
  }

  async function genDraft() {
    if (!photo) return toast.error("Adicione uma foto");
    if (!name || !birthdate) return toast.error("Preencha nome e data");
    if (!payment) return toast.error("Aguarde…");
    // Sem limite de avatares por sessão.
    setGenLoading(true);
    try {
      const res = await draftFn({ data: { photoDataUrl: photo, planetId: planet, gender, paymentId: payment.id } });
      await qc.invalidateQueries({ queryKey: ["active-payment"] });
      if (res?.fallback) {
        toast.warning("Modo teste: sem créditos de IA, usamos a imagem padrão da raça alienígena.", { duration: 6000 });
      } else {
        toast.success("Avatar alien gerado!");
      }
      setStep("drafts");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenLoading(false);
    }
  }


  async function confirmFinal() {
    if (!selectedDraft || !payment) return;
    if (!hasForm) {
      toast.error("Preencha seu nome e data de nascimento antes de confirmar");
      setStep("form");
      return;
    }
    setGenLoading(true);
    try {
      const r = await saveFn({ data: { paymentId: payment.id, draftId: selectedDraft, humanName: name, birthdate, gender, planetId: planet } });
      const draftRow = availableDrafts.find((d) => d.id === selectedDraft) ?? drafts.find((d) => d.id === selectedDraft);
      const finalPlanet = (draftRow?.prompt_seed as string | undefined) ?? planet;
      const id = generateAlienIdentity({ name, birthdate, planetId: finalPlanet as never, gender });
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
      if (r?.fallback) {
        toast.warning("Modo teste: créditos de IA esgotados. Usamos uma nave padrão para sua jornada.", { duration: 6000 });
      } else {
        toast.success("Nave espacial gerada!");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setShipLoading(false);
    }
  }

  function createAnotherFromSamePhoto() {
    setSavedIdentity(null);
    setSelectedDraft(availableDrafts[0]?.id ?? null);
    if (availableDrafts.length > 0) setStep("drafts");
    else setStep("form");
  }

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  return (
    <>
      {rawPhoto && (
        <SelfieCropper
          src={rawPhoto}
          onCancel={() => setRawPhoto(null)}
          onConfirm={(dataUrl) => {
            setPhoto(dataUrl);
            setRawPhoto(null);
            toast.success("Selfie enquadrada no padrão ICAO 5×7");
          }}
        />
      )}
      <main className="relative z-10 px-4 py-6 sm:py-10">
        <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = ""; }} />

        <div className="max-w-3xl mx-auto">
          {step === "intro" && (
            <section className="glass rounded-2xl p-8 text-center">
              <Sparkles className="w-10 h-10 text-accent mx-auto" />
              <h2 className="font-display text-2xl mt-3 text-gradient-neon">Criar nova identidade</h2>
              <p className="text-sm text-muted-foreground mt-2">Fluxo grátis: 1 criar identidade, 2 fazer passaporte, 3 escolher destino, 4 escolher nave, 5 fazer quiz.</p>
              <button
                onClick={startFlow}
                disabled={genLoading}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-display font-bold shadow-neon disabled:opacity-60"
              >
                {genLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparando…</> : "Começar"}
              </button>
            </section>
          )}


          {step === "form" && payment && (
            <section className="glass rounded-2xl p-5 sm:p-7">
              <h2 className="font-display text-xl mb-4 text-gradient-neon">Seus dados terráqueos</h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <div className="relative w-full sm:w-56 rounded-xl overflow-hidden border border-accent/40 shadow-neon bg-input/60 shrink-0">
                  {photo ? (
                    <img src={photo} alt="Sua selfie" className="block w-full h-auto" />
                  ) : (
                    <div className="aspect-square grid place-items-center text-muted-foreground">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 justify-center min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Sua selfie será usada inteira: cabelo, rosto, ombros, tronco, roupas e acessórios (óculos, brincos, colares, bonés) entrarão no avatar alien. Se não gostar, tire outra.
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => fileRef.current?.click()} className="text-sm text-accent underline inline-flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> {photo ? "Tirar outra selfie" : "Tirar selfie agora"}
                    </button>
                    <img src={techScanBtn} alt="Scanner tech" className="w-8 h-8 shrink-0 animate-pulse" loading="lazy" />
                    <button onClick={() => galleryRef.current?.click()} className="text-sm text-accent underline inline-flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> {photo ? "Escolher outra da galeria" : "Escolher da galeria"}
                    </button>
                  </div>
                </div>
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
                <Field label="Como definir sua raça?">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setRaceMode("auto"); if (birthdate) setPlanet(raceFromBirthdate(birthdate).id); }}
                      className={`px-3 py-2.5 rounded-lg border text-sm ${raceMode === "auto" ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50"}`}
                    >
                      🌌 Pela data de nascimento
                    </button>
                    <button
                      type="button"
                      onClick={() => setRaceMode("manual")}
                      className={`px-3 py-2.5 rounded-lg border text-sm ${raceMode === "manual" ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50"}`}
                    >
                      ✨ Escolher manualmente
                    </button>
                  </div>
                </Field>

                {raceMode === "auto" && (
                  birthdate ? (() => {
                    const race = raceFromBirthdate(birthdate);
                    return (
                      <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 shadow-neon">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Sua origem cósmica revelada</div>
                        <div className="mt-1 font-display text-xl text-gradient-neon">{race.name}</div>
                        <div className="text-xs text-muted-foreground">{race.species} · {race.origin}</div>
                        <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                          <div><span className="text-accent font-bold">Natureza:</span> {race.nature}</div>
                          <div><span className="text-accent font-bold">Poderes:</span> {race.powers.join(" · ")}</div>
                          <div><span className="text-accent font-bold">Propósito:</span> {race.purpose}</div>
                        </div>
                        <div className="mt-3 text-[10px] text-muted-foreground">
                          Raça determinada pela sua data de nascimento. Toque "Escolher manualmente" para gerar outras raças.
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground text-center">
                      Informe sua data de nascimento para revelar sua raça alienígena.
                    </div>
                  )
                )}

                {raceMode === "manual" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {RACES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setPlanet(r.id)}
                          className={`px-3 py-2.5 rounded-lg border text-left ${planet === r.id ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50"}`}
                        >
                          <div className="font-display text-sm">{r.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{r.origin}</div>
                        </button>
                      ))}
                    </div>
                    {(() => {
                      const race = RACES.find((r) => r.id === planet) ?? RACES[0];
                      return (
                        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 shadow-neon">
                          <div className="font-display text-lg text-gradient-neon">{race.name}</div>
                          <div className="text-xs text-muted-foreground">{race.species} · {race.origin}</div>
                          <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs">
                            <div><span className="text-accent font-bold">Natureza:</span> {race.nature}</div>
                            <div><span className="text-accent font-bold">Poderes:</span> {race.powers.join(" · ")}</div>
                            <div><span className="text-accent font-bold">Propósito:</span> {race.purpose}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <button onClick={genDraft} disabled={genLoading} className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-alien-grad text-primary-foreground font-display font-bold shadow-neon disabled:opacity-60">
                {genLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Transmutando DNA...</> : <><Wand2 className="w-5 h-5" />Gerar avatar alien</>}
              </button>

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  {availableDrafts.length > 0 && (
                  <button onClick={() => setStep("drafts")} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full glass text-xs">
                     <Check className="w-4 h-4" /> Ver opções prontas ({availableDrafts.length})
                  </button>
                )}
                <button onClick={restartFlow} disabled={genLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-accent/40 text-xs disabled:opacity-60">
                  <RotateCcw className="w-4 h-4" /> Começar nova identidade
                </button>
              </div>
            </section>
          )}

          {step === "drafts" && payment && (
            <section>
              <h2 className="font-display text-xl text-center mb-1 text-gradient-neon">Escolha seu avatar final</h2>
              <p className="text-center text-xs text-muted-foreground mb-5">{availableDrafts.length} opção(ões) disponíveis desta selfie — você pode criar novas versões sem limite.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {availableDrafts.map((d) => (
                  <button key={d.id} onClick={() => setSelectedDraft(d.id)} className={`relative rounded-xl overflow-hidden border-2 transition ${selectedDraft === d.id ? "border-accent shadow-neon" : "border-border"}`}>
                    <img src={d.avatar_url} alt={`Avatar ${d.variant_index}`} className="w-full aspect-square object-cover object-[center_25%]" />
                    {selectedDraft === d.id && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-1.5"><Check className="w-3 h-3" /></div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 text-center font-mono">Opção #{d.variant_index}</div>
                  </button>
                ))}
              </div>

              {!hasForm && (
                <div className="glass rounded-xl p-4 mb-4 text-center text-xs text-muted-foreground">
                  Preencha nome e data de nascimento para confirmar a identidade final.
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button onClick={() => setStep("form")} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full glass">
                  <CalendarIcon className="w-4 h-4" /> {hasForm ? "Editar dados" : "Preencher dados"}
                </button>
                {photo && (
                  <button onClick={() => setStep("form")} disabled={genLoading} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full glass">
                    <RotateCcw className="w-4 h-4" /> Gerar mais 1 com a mesma selfie
                  </button>
                )}
                <button onClick={confirmFinal} disabled={!selectedDraft || genLoading} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-display font-bold shadow-neon disabled:opacity-50">
                  {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirmar identidade final
                </button>
                <button onClick={restartFlow} disabled={genLoading} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-accent/40 text-xs disabled:opacity-60">
                  <Sparkles className="w-4 h-4" /> Começar do zero
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
              onNew={createAnotherFromSamePhoto}
              canCreateAnother={availableDrafts.length > 0 || !!photo}
              onTravel={() => navigate({ to: "/galaxia", search: { identityId: savedIdentity.id } })}
              onPlayGame={() => navigate({ to: "/rota" })}
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
  shipCategory: ShipId;
setShipCategory: (c: ShipId) => void;
  shipLoading: boolean;
  onGenShip: () => void;
  onNew: () => void;
  canCreateAnother: boolean;
  onTravel: () => void;
  onPlayGame: () => void;
}) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const [stlOpen, setStlOpen] = useState(false);
  return (
    <section>
      <div className="text-center mb-6">
        <div className="text-[11px] font-mono text-accent uppercase tracking-widest">Identificação confirmada</div>
        <h2 className="font-display text-3xl text-gradient-alien mt-1">{props.identity.alienName}</h2>
        <div className="text-sm text-muted-foreground">{props.identity.species} de {props.identity.planetName} · {props.identity.genderLabel}</div>
      </div>

      <div className="space-y-6 print:space-y-2" id="badges">
        <AlienCard type="identidade" identity={props.identity} avatarUrl={props.avatarUrl} />
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
          <button onClick={props.onPlayGame} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-alien-grad text-primary-foreground font-bold text-xs shadow-neon">
            🎮 Jogar (Across Age)
          </button>
          <button
            onClick={() => setStlOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-xs"
            title="Prévia 3D e download .stl para impressoras 3D (Bambu, Flashforge, Creality)"
          >
            <Box className="w-3.5 h-3.5" /> Prévia 3D · molde (.stl)
          </button>
          {props.canCreateAnother && (
            <button onClick={props.onNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-xs shadow-neon">
              <Sparkles className="w-3.5 h-3.5" /> Gerar outra com a mesma selfie
            </button>
          )}
        </div>
      </div>
      <STLPreviewModal
        open={stlOpen}
        onClose={() => setStlOpen(false)}
        imageUrl={props.avatarUrl}
        filenameBase={props.identity.alienName}
      />
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
