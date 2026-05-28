import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2, Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/_authenticated/criar",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { auth } = Route.useRouteContext();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: redirect, replace: true });
  }, [auth.isAuthenticated, navigate, redirect]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) toast.error(r.error.message ?? "Falha no login Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-sm glass rounded-2xl p-6 shadow-card-alien">
        <Link to="/" className="block text-center mb-6">
          <div className="inline-flex items-center gap-2 text-accent">
            <Sparkles className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-widest">Federação Galáctica</span>
          </div>
          <h1 className="font-display text-2xl text-gradient-neon mt-1">Acesso da nave</h1>
        </Link>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white text-black font-medium hover:bg-white/90 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.96 6.96 0 015.47 12c0-.73.13-1.44.36-2.1V7.06H2.18A11 11 0 001 12c0 1.77.42 3.44 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
          Entrar com Google
        </button>

        <div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou e-mail <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full px-3 py-2.5 rounded-lg bg-input border border-border focus:ring-2 focus:ring-ring outline-none" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full px-3 py-2.5 rounded-lg bg-input border border-border focus:ring-2 focus:ring-ring outline-none" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (mín 6)" className="w-full px-3 py-2.5 rounded-lg bg-input border border-border focus:ring-2 focus:ring-ring outline-none" />
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-accent-foreground font-display font-bold disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="block w-full text-center text-xs text-muted-foreground mt-4 hover:text-accent">
          {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
