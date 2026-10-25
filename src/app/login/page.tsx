"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar" | "recuperar";

/**
 * O erro do Supabase em português (auditoria de 25/10/2026). Só "Invalid login credentials" era
 * traduzido; o resto chegava em inglês na tela ("Email not confirmed", limite de tentativas…).
 */
function emPortugues(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail. Tente entrar.";
  if (m.includes("email not confirmed")) return "Falta confirmar o seu e-mail. Abra o link que enviamos (veja também o spam).";
  if (m.includes("password should be") || m.includes("weak password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("for security purposes") || m.includes("too many"))
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if (m.includes("invalid format") || m.includes("unable to validate email")) return "Confira o e-mail: parece que falta alguma parte.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com a internet. Confira a rede e tente de novo.";
  return "Não deu certo agora. Tente de novo em instantes.";
}

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  // "/" é o Workspace redesenhado; "/hub" era a versão antiga da home
  // logada e hoje só redireciona para cá (ver src/app/hub/page.tsx).
  const proximo = params.get("proximo") || "/";

  /**
   * `?modo=criar` abre direto no cadastro.
   *
   * É o que faz quem vem criar conta cair numa tela que já pede nome e
   * senha, em vez de numa tela de login onde a pessoa precisa primeiro achar
   * o link de criar conta. Cada clique a mais aqui é venda perdida.
   *
   * (O botão de ASSINAR não passa mais por aqui: desde que a oferta virou
   * "pague e tenha 7 dias de garantia", ele vai direto para o checkout. Esta
   * rota continua sendo a de quem já comprou e vem entrar pela primeira vez.)
   */
  const modoInicial: Modo = params.get("modo") === "criar" ? "criar" : "entrar";

  /**
   * O que dizer quando a volta do link de e-mail falha.
   *
   * ⚠️ "LINK INVÁLIDO" SOZINHO NÃO AJUDA NINGUÉM. As duas causas reais são
   * banais e têm solução — o link já foi aberto uma vez (é de uso único, e
   * o Gmail chega a consumi-lo ao gerar a prévia) ou foi aberto em outro
   * navegador, onde o `code_verifier` do PKCE não existe. Dizer isso é a
   * diferença entre a pessoa pedir outro link e a pessoa desistir.
   */
  const GASTO =
    "Esse link já foi usado ou expirou. Peça outro abaixo e abra logo em seguida — pedir um link novo invalida o anterior, então vale sempre o último que chegou.";

  const MOTIVO: Record<string, string> = {
    "link-gasto": GASTO,
    "sem-codigo": "O endereço veio incompleto. Peça um link novo abaixo.",
  };
  const erroDaVolta = MOTIVO[params.get("erro") ?? ""] ?? null;

  const [modo, setModo] = useState<Modo>(modoInicial);
  const [email, setEmail] = useState("");
  // 21/10/2026: o cadastro passa a pedir o nome — contas "Sem nome" no admin.
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  // Ver a senha digitada: no celular é fácil errar uma letra sem perceber (auditoria 25/10/2026).
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(erroDaVolta);

  /**
   * ⚠️ O SUPABASE MANDA O ERRO DEPOIS DO `#`, E ISSO NÃO CHEGA AO SERVIDOR.
   *
   * Quando o link falha, a volta vem como
   * `#error=access_denied&error_code=otp_expired&...` — e o que está depois
   * do `#` fica só no navegador. O `/auth/callback` roda no servidor, não
   * enxerga nada disso, e concluía "veio sem código", mostrando "o endereço
   * veio incompleto" para um link que na verdade tinha **expirado**. A
   * mensagem mandava a pessoa olhar o endereço em vez de pedir outro link.
   *
   * Por isso o motivo real é lido aqui, no cliente, e tem prioridade sobre
   * o que o servidor deduziu.
   */
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const vindo = new URLSearchParams(hash);
    const codigo = vindo.get("error_code");
    if (!codigo) return;

    setErro(
      codigo === "otp_expired" || codigo === "access_denied"
        ? GASTO
        : "Não consegui validar esse link. Peça outro abaixo.",
    );

    /* Tira o `#...` da barra de endereço: ele não serve para mais nada e,
       se a pessoa recarregar, o erro reaparece como se fosse novo. */
    window.history.replaceState(null, "", window.location.pathname);
  }, [GASTO]);
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

    /* Recuperar senha: manda o link e fica na mesma tela.
     *
     * ⚠️ O DESTINO ERA `/login` E ISSO NÃO LEVAVA A NADA. O link voltava
     * para esta mesma tela com um `?code=` que ninguém trocava por sessão,
     * então a pessoa clicava no e-mail e caía de novo no login, sem lugar
     * para digitar a senha nova.
     *
     * ⚠️ E PRECISA SER `/reset-password`, NÃO `/auth/callback`. O e-mail é
     * montado pela Edge Function `auth-email-hook`, que em recuperação
     * DESCARTA qualquer destino que não contenha `/reset-password` e troca
     * pelo domínio do app antigo. Apontar direto para o callback fazia o
     * link sair para `novareapp.com.br`, onde o código não vale — a chave
     * do PKCE fica no navegador sob este domínio. A rota
     * `/reset-password` existe só para ter o nome que o e-mail aceita, e
     * encaminha para o `/auth/callback`. Ver o comentário lá. */
    if (modo === "recuperar") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setEnviando(false);
      if (error) return setErro(emPortugues(error.message));
      return setAviso("Enviamos um link de recuperação para o seu e-mail.");
    }

    // Criar conta: o perfil em hub_profiles nasce sozinho pelo trigger.
    if (modo === "criar") {
      if (nome.trim().length < 2) {
        setEnviando(false);
        return setErro("Digite o seu nome.");
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        // `nome` vai para o raw_user_meta_data, de onde o gatilho
        // hub_criar_perfil copia para hub_profiles.nome.
        options: { emailRedirectTo: `${window.location.origin}${proximo}`, data: { nome: nome.trim() } },
      });
      if (error) {
        setEnviando(false);
        return setErro(emPortugues(error.message));
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
      setErro(emPortugues(error.message));
      setEnviando(false);
      return;
    }

    router.push(proximo);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {modo === "criar" && (
        <div>
          <label htmlFor="nome" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Seu nome
          </label>
          <input
            id="nome"
            type="text"
            required
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
        </div>
      )}

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
          <div className="relative">
          <input
            id="senha"
            type={verSenha ? "text" : "password"}
            required
            minLength={modo === "criar" ? 6 : undefined}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-white pl-3.5 pr-12 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
          <button
            type="button"
            onClick={() => setVerSenha((v) => !v)}
            aria-label={verSenha ? "Esconder a senha" : "Mostrar a senha"}
            aria-pressed={verSenha}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:text-primary"
          >
            {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          </div>
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
              className="min-h-10 font-semibold text-primary hover:text-accent-strong"
            >
              Criar conta grátis
            </button>
            <button
              type="button"
              onClick={() => trocarModo("recuperar")}
              className="min-h-10 text-muted-foreground hover:text-primary"
            >
              Esqueci minha senha
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => trocarModo("entrar")}
            className="min-h-10 font-semibold text-primary hover:text-accent-strong"
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
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
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
          <h1 className="mt-6 font-display text-xl font-medium text-primary">
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
