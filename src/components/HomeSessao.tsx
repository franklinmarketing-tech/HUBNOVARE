"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CardFincashHome } from "@/components/CardFincashHome";
import { PainelMeuDia } from "@/components/PainelMeuDia";
import { useQuemSou } from "@/lib/quem-sou";

/**
 * AS PARTES DA HOME QUE SÃO DE CADA PESSOA (21/11/2026).
 *
 * A home passou a sair PRONTA — igual para todos, sem ir ao servidor a cada
 * visita (era a página que mais gastava processamento na Vercel). O que muda
 * de pessoa para pessoa mora aqui e se completa no navegador, depois que a
 * página abriu: a saudação pela hora e pelo nome, o destino do card do
 * FINCASH, a seta e o painel de baixo.
 *
 * O visitante sem conta (a maioria, e todo robô) vê exatamente o que via.
 */

function saudacaoDaHora() {
  // Pela hora de Brasília, como antes — agora no relógio de quem está vendo.
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  return hora < 6 || hora >= 18 ? "Boa noite" : hora < 12 ? "Bom dia" : "Boa tarde";
}

/**
 * Só sauda pelo nome quando parece nome de gente. Handle de login
 * ("franklin.trader", "ana_c88") vira saudação sem nome — pior que não
 * personalizar é chamar a pessoa pelo usuário do sistema.
 */
function primeiroNomeDe(nome?: string | null) {
  const primeiraPalavra = nome?.trim().split(/\s+/)[0] ?? "";
  return /^[a-záàâãéêíóôõúüç]{2,15}$/i.test(primeiraPalavra)
    ? primeiraPalavra[0].toUpperCase() + primeiraPalavra.slice(1).toLowerCase()
    : undefined;
}

/**
 * Fatia um texto em palavras para a entrada em cascata (`.cine-palavra`).
 * `inicio` desloca o atraso, para uma frase continuar a cascata da anterior.
 * O espaço fica FORA do span: com inline-block, espaço dentro dele sumiria.
 */
function palavras(texto: string, inicio: number) {
  return texto.split(" ").map((p, i) => (
    <span key={i}>
      <span className="cine-palavra" style={{ "--i": inicio + i } as React.CSSProperties}>
        {p}
      </span>{" "}
    </span>
  ));
}

/** O título e a linha de baixo da capa. */
export function TituloHome() {
  const { perfil } = useQuemSou();
  // A hora é a de quem abre, não a de quando a página foi montada: só depois de abrir.
  const [saudacao, setSaudacao] = useState<string | null>(null);
  useEffect(() => setSaudacao(saudacaoDaHora()), []);
  const primeiroNome = primeiroNomeDe(perfil?.nome);

  return (
    <>
      <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-[2.6rem]">
        {/* Palavra por palavra (`.cine-palavra`, globals.css): a saudação
            entra primeiro e a pergunta assenta logo depois. Enquanto a hora
            não chega, "Boa tarde!" invisível guarda o lugar (a linha não pula). */}
        {saudacao ? (
          palavras(primeiroNome ? `${saudacao}, ${primeiroNome}!` : `${saudacao}!`, 0)
        ) : (
          <span className="invisible">Boa tarde! </span>
        )}
        <span className="text-accent-claro">
          {palavras("O que você quer resolver hoje?", 3)}
        </span>
      </h1>
      {/* Não some mais em tela baixa: escondê-lo era parte da mesma
          corrida por caber numa tela, e a página perdia a única
          linha que diz o que a Novare faz. */}
      <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 lg:mt-3">
        {perfil
          ? "Tudo o que você usa, num lugar só — e a gente por perto se precisar."
          : "Ferramentas gratuitas e independentes para organizar o seu dinheiro."}
      </p>
    </>
  );
}

/** O destino e o preço saem da assinatura: quem já paga entra direto no app. */
export function CardFincashHomeSessao() {
  const { assinatura } = useQuemSou();
  return <CardFincashHome assinatura={assinatura} />;
}

/**
 * A seta que avisa que a página continua. Sem ela, quem chega numa
 * tela cheia e sem barra de rolagem visível acredita que acabou —
 * e o painel inteiro deixa de existir para essa pessoa.
 */
export function SetaPainelHome() {
  const { perfil, assinante } = useQuemSou();
  if (!perfil) return null;
  return (
    <a
      href="#meu-painel"
      className="mx-auto -mb-1 mt-1 flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-semibold text-muted-foreground transition-colors hover:text-primary"
    >
      {/* Quem não assina encontra lá embaixo um convite de
          assinatura, não um painel: prometer o que a rolagem não
          entrega gasta a confiança de quem clica. */}
      {assinante ? "Seu painel logo abaixo" : "Veja o que tem mais abaixo"}
      <ChevronDown className="h-3.5 w-3.5 motion-safe:animate-bounce" />
    </a>
  );
}

/* ========================================================= SEGUNDA PARTE */

/**
 * A parte de baixo da home: o painel de quem está logado.
 *
 * Vive FORA do `<main>` da vitrine de propósito — aquele bloco é medido
 * para caber numa tela, e enfiar o painel dentro dele estouraria a conta de
 * altura que mantém a primeira dobra inteira.
 *
 * Quem assina vê os próprios números; quem está no plano free vê o convite,
 * porque para ele não existe painel nenhum ainda. Visitante deslogado não
 * entra aqui: a casca vazia seria pior do que não mostrar nada.
 */
export function SegundaParteHome() {
  const { perfil, assinante } = useQuemSou();
  if (!perfil) return null;
  const primeiroNome = primeiroNomeDe(perfil.nome);

  return (
    <section
      id="meu-painel"
      className="scroll-mt-4 border-t border-primary/8 bg-white/40"
    >
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-8 md:px-5">
        {/* Chega depois que a página abriu: o `RevelarAoRolar` pega os `.cine`
            que aparecem tarde (MutationObserver), então a entrada continua igual. */}
        <header className="cine">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-ciano-forte">
            Seu Workspace
          </p>
          <h2 className="titulo-secao mt-1 text-xl sm:text-2xl">
            {primeiroNome ? `A vida financeira de ${primeiroNome}` : "Sua vida financeira"}
          </h2>
        </header>

        {/* `resumo`: só a primeira seção do painel. O painel inteiro são
            seis, e as seis aqui fariam da home uma cópia de /meu-dia — que
            é a página que existe justamente para isso. */}
        {assinante ? <PainelMeuDia resumo /> : <ConvitePainelHome />}
      </div>
    </section>
  );
}

/**
 * Logado sem painel: o convite leva ao que existe e é grátis.
 *
 * ⚠️ ATÉ 20/10/2026 ESTE CARTÃO DIZIA QUE O PAINEL "abre com a assinatura",
 * com o botão "Liberar meus números" para /assinar — numa casa em que tudo
 * passou a ser gratuito, e com um link para o FINPLAN, que saiu do ar. Agora
 * ele leva ao FINCASH (onde o painel do mês de fato nasce) e ao Exame.
 */
function ConvitePainelHome() {
  return (
    <div className="cine cartao-cp mt-5 grid sm:grid-cols-[0.9fr_1.1fr]">
      <div className="relative aspect-[16/10] sm:aspect-auto">
        <Image src="/home/fincash.webp" alt="" fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover" />
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="titulo-cp text-2xl sm:text-3xl">
          Seu painel nasce no <span className="text-accent-strong">FINCASH</span>
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Lance as contas do mês — é grátis — e acompanhe o saldo, os cartões, as
          metas e quanto ainda dá para gastar. Quer começar pelo retrato geral? O
          Exame de Saúde Financeira dá a sua nota e o que melhorar primeiro.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/fincash/app" className="group btn-petroleo">
            Abrir meu FINCASH
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/exame-saude-financeira"
            className="text-sm font-semibold text-accent-strong underline-offset-4 hover:underline"
          >
            Fazer o Exame de Saúde Financeira
          </Link>
        </div>
      </div>
    </div>
  );
}
