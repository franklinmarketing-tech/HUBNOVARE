import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2, Globe, Mail, MessageCircle, Phone } from "lucide-react";

import { IconesRedes } from "@/components/AssinaturaJefferson";
import { DisclaimerFerramenta, DisclaimerServico } from "@/components/Disclaimers";
import { APPS } from "@/lib/apps";
import { CONTATO, falarNoWhatsApp } from "@/lib/contato";
import { CARTEIRA_PONTUAL_LP, DIAGNOSTICO_GRATUITO_LP } from "@/lib/consultoria";

const ANO = new Date().getFullYear();

/**
 * O RODAPÉ DO SITE INTEIRO (pedido do dono, 21/10/2026: "rodapé moderno,
 * completo, perfeito, padrão Novare"). Substitui o rodapé de uma linha da
 * home (`Rodape`) e o institucional das ferramentas (`RodapeNovare`) — os
 * dois agora renderizam este.
 *
 * Painel noite com as ondas, em três andares:
 *   1. a marca, a promessa, a parceria Nord e os dois botões;
 *   2. cinco colunas de links (ferramentas, apps, conteúdo, serviços,
 *      institucional) e o "Fale com a gente" com os ícones no padrão Nord;
 *   3. o aviso legal (obrigatório para consultoria) e a assinatura.
 *
 * ⚠️ NENHUM LINK ESCRITO À MÃO PARA FERRAMENTA: as cinco vêm do catálogo
 * (`APPS`), só o que é livre e está no ar.
 */
export function RodapeCompleto({ aviso = "ferramenta" }: { aviso?: "ferramenta" | "servico" }) {
  const ferramentas = APPS.filter(
    (a) =>
      a.familia &&
      a.plano === "livre" &&
      a.status !== "em-breve" &&
      a.tipo !== "servico" &&
      a.tipo !== "consulta" &&
      !a.externo &&
      a.familia !== "ia",
  ).slice(0, 5);

  const colunas: { titulo: string; links: { rotulo: string; href: string; externo?: boolean }[] }[] = [
    {
      titulo: "Ferramentas",
      links: [...ferramentas.map((f) => ({ rotulo: f.nome, href: f.href })), { rotulo: "Ver todas →", href: "/aplicativos" }],
    },
    {
      titulo: "Aplicativos",
      links: [
        { rotulo: "FINCASH", href: "/fincash" },
        { rotulo: "Íris, a IA do extrato", href: "/iris" },
        { rotulo: "Exame de Saúde Financeira", href: "/exame-saude-financeira" },
        { rotulo: "Indicadores do mercado", href: "/indicadores" },
        { rotulo: "Calendário econômico", href: "/calendario-economico" },
      ],
    },
    {
      titulo: "Conteúdo",
      links: [
        { rotulo: "Novare News", href: "/novare-news" },
        { rotulo: "eBooks gratuitos", href: "/ebooks" },
        { rotulo: "Sua profissão", href: "/profissionais" },
      ],
    },
    {
      titulo: "Serviços",
      links: [
        { rotulo: "Carteira Pontual", href: CARTEIRA_PONTUAL_LP, externo: true },
        { rotulo: "Diagnóstico Gratuito", href: DIAGNOSTICO_GRATUITO_LP, externo: true },
        { rotulo: "Consultoria", href: "/consultoria" },
      ],
    },
    {
      titulo: "Institucional",
      links: [
        { rotulo: "Fale com a gente", href: "/fale-conosco" },
        { rotulo: "Central de ajuda", href: "/ajuda" },
        { rotulo: "Site oficial da Novare", href: "https://novareinvestimentos.com", externo: true },
        { rotulo: "Privacidade & LGPD", href: "/privacidade" },
        { rotulo: "Termos de Uso", href: "/termos" },
      ],
    },
  ];

  const zap = falarNoWhatsApp("Olá! Vim pelo site da Novare e quero falar sobre o meu planejamento.");

  return (
    <footer className="secao-noite mt-auto pb-24 text-white sm:pb-8 print:hidden">
      <div className="mx-auto max-w-6xl px-5 pt-10 sm:pt-12">
        {/* 1. A marca e a chamada */}
        <div className="grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <Image src="/marca/logo-novare-branca.png" alt="Novare" width={150} height={38} className="h-8 w-auto" />
            <p className="mt-4 max-w-md font-display text-xl font-medium leading-snug tracking-[-0.03em] sm:text-2xl">
              Consultoria de investimentos <span className="text-accent-claro">sem comissão</span> e ferramentas
              gratuitas para você decidir com clareza.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Parceiro oficial</span>
              <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5">
                <Image src="/marca/novare-site/logo-nord.png" alt="Nord Investimentos" width={96} height={30} className="h-5 w-auto" />
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href={zap} target="_blank" rel="noopener noreferrer" className="btn-cp">
              <MessageCircle className="h-4 w-4" />
              Falar com a Novare
            </a>
            <a
              href={CARTEIRA_PONTUAL_LP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Analisar minha carteira
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* 2. Os links e o contato */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 py-7 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1.7fr)]">
          {colunas.map((col) => (
            <nav key={col.titulo} aria-label={col.titulo}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ciano-claro">{col.titulo}</h3>
              <ul className="mt-3 space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.rotulo}>
                    {l.externo ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/65 transition-colors hover:text-white">
                        {l.rotulo} <span aria-hidden>↗</span>
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[13px] text-white/65 transition-colors hover:text-white">
                        {l.rotulo}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ciano-claro">Fale com a gente</h3>
            <ul className="mt-3 space-y-0.5 text-[13px]">
              <li>
                <a href={zap} target="_blank" rel="noopener noreferrer" className="flex min-h-8 items-center gap-2 text-white/65 transition-colors hover:text-white">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {CONTATO.telefone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTATO.email}`} className="flex min-h-8 items-center gap-2 text-white/65 transition-colors [overflow-wrap:anywhere] hover:text-white">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {CONTATO.email}
                </a>
              </li>
              <li>
                <a href={`https://${CONTATO.site}`} target="_blank" rel="noopener noreferrer" className="flex min-h-8 items-center gap-2 text-white/65 transition-colors hover:text-white">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {CONTATO.site}
                </a>
              </li>
            </ul>
            <IconesRedes className="mt-3" />
          </div>
        </div>

        {/* 3. O aviso legal e a assinatura */}
        <div className="space-y-3 border-t border-white/10 pt-5">
          {aviso === "servico" ? <DisclaimerServico tom="escuro" /> : <DisclaimerFerramenta tom="escuro" />}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[11px] text-white/55">
              © {ANO} Novare Consultoria de Investimentos. Todos os direitos reservados.
            </p>
            <a
              href="https://castriani-digital.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
            >
              <Code2 className="h-3.5 w-3.5 text-ciano-claro" strokeWidth={2.5} />
              <span className="text-xs text-white/55">Desenvolvido por</span>
              <span className="bg-gradient-to-r from-[hsl(16_90%_62%)] to-[hsl(197_85%_62%)] bg-clip-text font-display text-sm font-bold tracking-tight text-transparent">
                Castriani Digital
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
