import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Crown, LogOut, ShieldCheck } from "lucide-react";
import { FormularioPerfil } from "@/components/FormularioPerfil";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { sair } from "./actions";

export const metadata: Metadata = {
  title: "Meu perfil",
  description: "Seus dados no Novare Workspace.",
};

/** Campos que só existem depois da migração `hub_profiles_completo.sql`. */
type Cadastro = {
  apelido: string | null;
  telefone: string | null;
  nascimento: string | null;
  cidade: string | null;
  uf: string | null;
  profissao: string | null;
  objetivo: string | null;
  aceita_email: boolean | null;
};

export default async function PerfilPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/perfil");

  const supabase = await createClient();

  // Busca tolerante: se a migração ainda não rodou, a tela abre mesmo
  // assim, com os campos vazios, em vez de dar erro na cara do cliente.
  const { data, error } = await supabase
    .from("hub_profiles")
    .select("apelido, telefone, nascimento, cidade, uf, profissao, objetivo, aceita_email")
    .eq("id", perfil.id)
    .maybeSingle();

  const cadastro = (data ?? {}) as Partial<Cadastro>;
  const faltaMigracao = Boolean(error);

  const assinante = perfil.plano === "pro" || perfil.role !== "cliente";
  const inicial = (perfil.nome?.trim()[0] ?? perfil.email[0] ?? "N").toUpperCase();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare Consultoria de Investimentos"
              width={128}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Workspace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        {/* Cartão de identidade */}
        <section className="mt-8 flex flex-wrap items-center gap-5 rounded-3xl bg-primary p-6 sm:p-7">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-btn text-2xl font-bold text-accent-foreground">
            {inicial}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold text-white">
              {perfil.nome || "Seu perfil"}
            </h1>
            <p className="truncate text-sm text-white/60">{perfil.email}</p>
          </div>
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              assinante
                ? "bg-accent/20 text-[hsl(16_90%_75%)]"
                : "bg-white/10 text-white/70"
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            {assinante ? "Workspace ativo" : "Plano gratuito"}
          </span>
        </section>

        {faltaMigracao && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            O banco ainda não tem os campos do cadastro completo. Rode{" "}
            <code className="font-mono">supabase/hub_profiles_completo.sql</code>{" "}
            no SQL Editor do Supabase para liberar o formulário abaixo.
          </p>
        )}

        <FormularioPerfil
          nome={perfil.nome ?? ""}
          email={perfil.email}
          apelido={cadastro.apelido ?? ""}
          telefone={cadastro.telefone ?? ""}
          nascimento={cadastro.nascimento ?? ""}
          cidade={cadastro.cidade ?? ""}
          uf={cadastro.uf ?? ""}
          profissao={cadastro.profissao ?? ""}
          objetivo={cadastro.objetivo ?? ""}
          aceitaEmail={cadastro.aceita_email ?? true}
        />

        {/* Plano */}
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-primary">
            Seu plano
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {assinante
              ? "Você tem acesso ao Planejamento Financeiro, à Íris e ao desconto nas consultorias."
              : "As ferramentas são todas livres. O Planejamento e a Íris fazem parte do Workspace."}
          </p>
          {!assinante && (
            <Link
              href="/assinar/workspace"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Conhecer o Workspace
            </Link>
          )}
        </section>

        {/* Sair */}
        <form action={sair} className="mt-5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </form>

        <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
          Seus dados ficam na Novare e servem para personalizar o atendimento.
          Não vendemos nem compartilhamos cadastro com terceiros. Para apagar
          sua conta, fale com a gente pelo WhatsApp.
        </p>
      </main>
    </div>
  );
}
