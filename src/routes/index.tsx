import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, Rocket, Sparkles, Wand2, Download } from "lucide-react";
import { PLANETS, generateAlienIdentity, type AlienIdentity, type PlanetId } from "@/lib/alien";
import { AlienCard } from "@/components/AlienCard";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Identidade Alien · Descubra seu eu cósmico" },
      {
        name: "description",
        content:
          "Tire uma foto, escolha um planeta e gere sua Identidade, Carteira de Trabalho e CNH alienígenas com IA.",
      },
      { property: "og:title", content: "Identidade Alien" },
      {
        property: "og:description",
        content: "Sua versão alien em segundos. Carteiras galácticas com avatar gerado por IA.",
      },
    ],
  }),
  component: Index,
});

type Step = "intro" | "form" | "result";

function Index() {
  const [step, setStep] = useState<Step>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [planet, setPlanet] = useState<PlanetId>("marte");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [identity, setIdentity] = useState<AlienIdentity | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem grande demais (máx 8MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setStep("form");
    };
    reader.readAsDataURL(file);
  }

  async function generate() {
    if (!photo || !name || !birthdate) {
      toast.error("Preencha tudo, terráqueo");
      return;
    }
    setLoading(true);
    try {
      const planetMeta = PLANETS.find((p) => p.id === planet)!;
      const id = generateAlienIdentity({ name, birthdate, planetId: planet });
      setIdentity(id);

      const res = await fetch("/api/generate-alien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: photo,
          planet: planetMeta.name,
          species: planetMeta.species,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 429) toast.error("Muitos pedidos. Espere um instante.");
        else if (res.status === 402) toast.error("Créditos de IA esgotados.");
        else toast.error(`Falha ao transformar: ${text.slice(0, 120)}`);
        return;
      }
      const data = (await res.json()) as { imageDataUrl: string };
      setAvatar(data.imageDataUrl);
      setStep("result");
    } catch (e) {
      toast.error("Erro de comunicação com a nave-mãe");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("intro");
    setPhoto(null);
    setAvatar(null);
    setIdentity(null);
    setName("");
    setBirthdate("");
  }

  return (
    <main className="relative z-10 min-h-screen px-4 py-8 sm:py-12">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-accent">
              Federação Galáctica · v1.0
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold leading-tight">
            <span className="text-gradient-alien">Sua Identidade</span>
            <br />
            <span className="text-gradient-neon">Alienígena</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Tire uma foto, escolha um planeta da galáxia e receba suas três carteiras
            oficiais do cosmos.
          </p>
        </header>

        {step === "intro" && <Intro onStart={() => fileRef.current?.click()} />}

        {step === "form" && photo && (
          <FormStep
            photo={photo}
            name={name}
            setName={setName}
            birthdate={birthdate}
            setBirthdate={setBirthdate}
            planet={planet}
            setPlanet={setPlanet}
            loading={loading}
            onGenerate={generate}
            onRetake={() => fileRef.current?.click()}
          />
        )}

        {step === "result" && identity && avatar && (
          <ResultStep
            identity={identity}
            avatar={avatar}
            onReset={reset}
          />
        )}
      </div>

      <footer className="relative z-10 mt-16 text-center text-[11px] text-muted-foreground font-mono">
        Transmitido via subespaço · Lovable Cloud
      </footer>
    </main>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="text-center">
      <div className="relative inline-block animate-float">
        <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-alien-grad shadow-neon animate-pulse-neon flex items-center justify-center">
          <Rocket className="w-20 h-20 text-primary-foreground" />
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent text-accent-foreground font-display text-base font-bold shadow-neon hover:scale-105 active:scale-95 transition-transform"
      >
        <Camera className="w-5 h-5" />
        Tirar foto / Enviar
      </button>

      <div className="mt-10 grid grid-cols-3 gap-3 max-w-md mx-auto text-left">
        {[
          { n: "01", t: "Sua foto", d: "selfie ou retrato" },
          { n: "02", t: "Planeta", d: "escolha sua origem" },
          { n: "03", t: "3 carteiras", d: "RG, CTPS e CNH" },
        ].map((s) => (
          <div key={s.n} className="glass rounded-xl p-3">
            <div className="font-mono text-[10px] text-accent">{s.n}</div>
            <div className="font-display text-sm mt-1">{s.t}</div>
            <div className="text-[11px] text-muted-foreground">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FormStep(props: {
  photo: string;
  name: string;
  setName: (s: string) => void;
  birthdate: string;
  setBirthdate: (s: string) => void;
  planet: PlanetId;
  setPlanet: (p: PlanetId) => void;
  loading: boolean;
  onGenerate: () => void;
  onRetake: () => void;
}) {
  return (
    <section className="glass rounded-2xl p-5 sm:p-7 shadow-card-alien">
      <div className="flex items-center gap-4 mb-5">
        <img
          src={props.photo}
          alt="Sua foto"
          className="w-20 h-20 rounded-xl object-cover border border-accent/40 shadow-neon"
        />
        <div>
          <div className="font-display text-base">Foto recebida</div>
          <button
            onClick={props.onRetake}
            className="text-xs text-accent underline mt-1"
          >
            trocar foto
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Seu nome terráqueo">
          <input
            type="text"
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            placeholder="Ex: Maria Silva"
            maxLength={60}
            className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Data de nascimento (Terra)">
          <input
            type="date"
            value={props.birthdate}
            onChange={(e) => props.setBirthdate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Planeta de origem">
          <div className="grid grid-cols-2 gap-2">
            {PLANETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => props.setPlanet(p.id)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                  props.planet === p.id
                    ? "border-accent bg-accent/15 shadow-neon"
                    : "border-border bg-input/50 hover:border-accent/50"
                }`}
              >
                <div className="font-display text-sm">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">{p.species}</div>
              </button>
            ))}
          </div>
        </Field>
      </div>

      <button
        onClick={props.onGenerate}
        disabled={props.loading}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-alien-grad text-primary-foreground font-display font-bold shadow-neon disabled:opacity-60 hover:scale-[1.02] active:scale-95 transition-transform"
      >
        {props.loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Transmutando DNA...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Gerar minha identidade alien
          </>
        )}
      </button>
    </section>
  );
}

function ResultStep({
  identity,
  avatar,
  onReset,
}: {
  identity: AlienIdentity;
  avatar: string;
  onReset: () => void;
}) {
  function downloadAvatar() {
    const a = document.createElement("a");
    a.href = avatar;
    a.download = `${identity.alienName}-avatar.png`;
    a.click();
  }

  return (
    <section>
      <div className="text-center mb-8">
        <div className="text-[11px] font-mono tracking-widest text-accent uppercase">
          Identificação confirmada
        </div>
        <h2 className="font-display text-3xl text-gradient-alien mt-1">
          {identity.alienName}
        </h2>
        <div className="text-sm text-muted-foreground">
          {identity.species} de {identity.planetName}
        </div>
      </div>

      <div className="space-y-6">
        <AlienCard type="identidade" identity={identity} avatarUrl={avatar} />
        <AlienCard type="trabalho" identity={identity} avatarUrl={avatar} />
        <AlienCard type="motorista" identity={identity} avatarUrl={avatar} />
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={downloadAvatar}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass text-foreground font-display text-sm hover:border-accent transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar avatar
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-display text-sm font-bold shadow-neon"
        >
          <Sparkles className="w-4 h-4" />
          Criar outra identidade
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
