import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { getPerfil } from "@/lib/perfil";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { ContaCompartilhada } from "../app/(area)/ajustes/ContaCompartilhada";

export const metadata: Metadata = {
  title: "Convite para o NovareCash",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * O CONVITE PARA A CONTA COMPARTILHADA — fica FORA de `/novarecash/app` de
 * propósito. A porta do app (`ncash_tem_acesso()`) só deixa entrar membro que
 * JÁ aceitou; quem ainda vai aceitar não tem assinatura e seria mandado para a
 * página de venda sem nunca ver o convite. Aqui basta estar logado com o
 * e-mail convidado. É o link que o dono manda pelo WhatsApp em Ajustes.
 */
export default async function ConviteNovareCash() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/novarecash/convite");
  const temAcesso = await temAcessoNovareCash();

  return (
    <div className="min-h-dvh bg-noite text-white [color-scheme:dark] bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,hsl(42_74%_62%/0.10),transparent_70%)]">
      <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
        <MarcaNovareCash tamanho="sm" />
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em] text-white">Convite para o NovareCash</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-white/70">
          Entrou como <span className="break-all text-white">{perfil.email}</span>. O convite vale para este e-mail.
        </p>
        <div className="mt-5">
          <ContaCompartilhada eu={perfil.id} meuEmail={perfil.email} modo="convite" />
        </div>
        {temAcesso && (
          <Link
            href="/novarecash/app"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-ouro outline-none focus-visible:ring-2 focus-visible:ring-ouro"
          >
            Abrir o NovareCash
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </main>
    </div>
  );
}
