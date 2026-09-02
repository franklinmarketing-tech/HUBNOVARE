"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar" | "recuperar";

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  // "/" é o Workspace redesenhado; "/hub" era a versão antiga da home
  // logada e hoje só redireciona para cá (ver src/app/hub/page.tsx).
  const proximo = params.get("proximo") || "/";

  /**
   * `?modo=criar` abre direto no cadastro.
   *
   * É o que faz o botão "7 dias grátis" da página de venda cair numa tela que
   * já pede nome e senha, em vez de numa tela de login onde a pessoa precisa
   * primeiro achar o link de criar conta. Cada clique a mais aqui é venda
   * perdida.
   */
  const modoInicial: Modo = params.get("modo") === "criar" ? "criar" : "entrar";

  const [modo, setModo] = useState<Modo>(modoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const trocarModo = (novo: Modo) => {
    setModo(novo);
    setErro(null);
    setAviso(null);
  };

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);

    const supabase = createClient();

    // Recuperar senha: manda o link e fica na mesma tela.
    if (modo === "recuperar") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      setEnviando(false);
      if (error) return setErro(error.message);
      return setAviso("Enviamos um link de recuperação para o seu e-mail.");
    }

    // Criar conta: o perfil em hub_profiles nasce sozinho pelo trigger.
    if (modo === "criar") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: { emailRedirectTo: `${window.location.origin}${proximo}` },
      });
      if (error) {
        setEnviando(false);
        return setErro(
          error.message.includes("already registered")
            ? "Já existe uma conta com este e-mail. Tente entrar."
            : error.message,
        );
      }
      // Com confirmação de e-mail ligada no Supabase, ainda não há sessão.
      if (!data.session) {
        setEnviando(false);
        return setAviso("Conta criada! Confirme o e-mail que enviamos para entrar.");
      }
      router.push(proximo);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      setEnviando(false);
      return;
    }

    router.push(proximo);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold text-muted-foreground"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
        />
      </div>

      {modo !== "recuperar" && (
        <div>
          <label
            htmlFor="senha"
            className="mb-1.5 block text-xs font-semibold text-muted-foreground"
          >
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            minLength={modo === "criar" ? 6 : undefined}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
          {modo === "criar" && (
            <p className="mt-1 text-[11px] text-muted-foreground">Mínimo de 6 caracteres.</p>
          )}
        </div>
      )}

      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success-strong">
          {aviso}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft disabled:opacity-60"
      >
        {enviando
          ? "Enviando..."
          : modo === "criar"
            ? "Criar conta grátis"
            : modo === "recuperar"
              ? "Enviar link de recuperação"
              : "Entrar"}
      </button>

      {/* Saídas: sem elas, quem não tem conta (ou esqueceu a senha) fica preso. */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {modo === "entrar" ? (
          <>
            <button
              type="button"
              onClick={() => trocarModo("criar")}
              className="font-semibold text-primary hover:text-accent-strong"
            >
              Criar conta grátis
            </button>
            <button
              type="button"
              onClick={() => trocarModo("recuperar")}
              className="text-muted-foreground hover:text-primary"
            >
              Esqueci minha senha
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => trocarModo("entrar")}
            className="font-semibold text-primary hover:text-accent-strong"
          >
            ← Já tenho conta, quero entrar
          </button>
        )}
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={126}
              height={35}
              priority
              style={{ height: 35, width: "auto" }}
            />
          </Link>
          <h1 className="mt-6 font-display text-xl font-bold text-primary">
            Acesse sua conta
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            É o mesmo login do app da Novare.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <Suspense fallback={null}>
            <FormularioLogin />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-accent-strong">
            Voltar para o início
          </Link>
        </p>
      </div>
    </div>
  );
}
