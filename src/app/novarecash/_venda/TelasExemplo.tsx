import { Camera, Landmark, MessageCircle, Mic, Sparkles, type LucideIcon } from "lucide-react";
import { RECURSOS } from "@/lib/novarecash/config";

/** Banco E WhatsApp no ar? Só então a legenda pode dizer "se preenche sozinho" (CDC). */
const AUTOMATICO_NO_AR = RECURSOS.filter((r) => r.chave === "banco" || r.chave === "whatsapp").every((r) => r.noAr);

/**
 * TELAS DE EXEMPLO DO NOVARECASH — ilustração em HTML, não captura.
 *
 * O app ainda está sendo construído (03/11/2026), e não há tela real para
 * fotografar. Estas três telas são DESENHADAS aqui, com dados de EXEMPLO, e
 * dizem isso na legenda: nada de vender print de um app que não existe assim.
 * Quando houver capturas de verdade, trocam-se estes desenhos por elas.
 *
 * Leves de propósito: só Tailwind e ícones que a página já carrega, nenhuma
 * imagem. Cada celular é um `role="img"` com descrição, para o leitor de tela
 * não ler número de exemplo como se fosse dado.
 *
 * ⚠️ Os valores daqui são de UMA PESSOA FICTÍCIA. Não são preço do NovareCash
 * (esse mora em `lib/novarecash/config.ts`) nem promessa de resultado.
 */

/** A moldura de celular, escura com aro dourado discreto. */
function Celular({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div
      role="img"
      aria-label={rotulo}
      className="mx-auto w-full max-w-[16.5rem] rounded-[2.4rem] bg-noite p-2 shadow-[0_30px_60px_-24px_hsl(42_74%_62%/0.35)] ring-1 ring-ouro/25"
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-noite-2 px-4 pb-5 pt-7 text-white ring-1 ring-white/5">
        <span aria-hidden className="absolute left-1/2 top-2.5 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/15" />
        {children}
      </div>
    </div>
  );
}

/** O "NovareCash" de dentro do app, em texto (sem imagem, para não pesar). */
function TopoApp({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-display text-sm font-semibold tracking-[-0.02em]">
        Novare<span className="text-ouro">Cash</span>
      </p>
      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/70">{titulo}</span>
    </div>
  );
}

const ORCAMENTO = [
  { nome: "Moradia", gasto: "R$ 1.800", teto: "R$ 2.000", pct: 90 },
  { nome: "Mercado", gasto: "R$ 820", teto: "R$ 1.000", pct: 82 },
  { nome: "Restaurantes", gasto: "R$ 410", teto: "R$ 350", pct: 100, estourou: true },
  { nome: "Transporte", gasto: "R$ 290", teto: "R$ 400", pct: 72 },
];

export function TelaInicio() {
  return (
    <Celular rotulo="Ilustração da tela Início do NovareCash, com dados de exemplo: saldo do mês, entradas e saídas e o orçamento por categoria, com Restaurantes acima do limite.">
      <TopoApp titulo="Novembro" />
      <p className="mt-5 text-[11px] text-white/65">Sobra no mês</p>
      <p className="font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.03em] text-ouro">R$ 2.340,50</p>
      <div className="mt-2 flex gap-3 text-[10px] text-white/65">
        <span>
          Entrou <strong className="text-emerald-300">R$ 6.200</strong>
        </span>
        <span>
          Saiu <strong className="text-white">R$ 3.859</strong>
        </span>
      </div>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Orçamento</p>
      <ul className="mt-2 space-y-2.5">
        {ORCAMENTO.map((c) => (
          <li key={c.nome}>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-white/90">{c.nome}</span>
              <span className={c.estourou ? "font-semibold text-accent-claro" : "text-white/65"}>
                {c.gasto} <span className="text-white/60">/ {c.teto}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${c.estourou ? "bg-accent" : "bg-ouro"}`}
                style={{ width: `${c.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-xl bg-accent/15 px-2.5 py-1.5 text-[10px] leading-snug text-accent-claro">
        Restaurantes passou R$ 60 do combinado.
      </p>
    </Celular>
  );
}

type Origem = { rotulo: string; Icone: LucideIcon; cor: string };
const BANCO: Origem = { rotulo: "Banco", Icone: Landmark, cor: "text-ouro" };
const ZAP_FOTO: Origem = { rotulo: "WhatsApp · foto", Icone: Camera, cor: "text-emerald-300" };
const ZAP_AUDIO: Origem = { rotulo: "WhatsApp · áudio", Icone: Mic, cor: "text-emerald-300" };
const ZAP_TEXTO: Origem = { rotulo: "WhatsApp", Icone: MessageCircle, cor: "text-emerald-300" };

const EXTRATO: { nome: string; categoria: string; valor: string; entrada?: boolean; origem: Origem }[] = [
  { nome: "Salário", categoria: "Salário", valor: "+ R$ 6.200,00", entrada: true, origem: BANCO },
  { nome: "Supermercado", categoria: "Mercado", valor: "− R$ 187,40", origem: ZAP_FOTO },
  { nome: "Almoço", categoria: "Restaurantes", valor: "− R$ 45,00", origem: ZAP_AUDIO },
  { nome: "Uber", categoria: "Transporte", valor: "− R$ 23,90", origem: BANCO },
  { nome: "Farmácia", categoria: "Saúde", valor: "− R$ 62,30", origem: ZAP_TEXTO },
  { nome: "Streaming", categoria: "Assinaturas", valor: "− R$ 44,90", origem: BANCO },
];

export function TelaExtrato() {
  return (
    <Celular rotulo="Ilustração do Extrato do NovareCash, com dados de exemplo: cada lançamento traz a categoria e um selo de origem, Banco ou WhatsApp, por texto, áudio ou foto da nota.">
      <TopoApp titulo="Extrato" />
      <ul className="mt-4 divide-y divide-white/8">
        {EXTRATO.map(({ nome, categoria, valor, entrada, origem: { rotulo, Icone, cor } }) => (
          <li key={nome} className="flex items-center justify-between gap-2 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium text-white">{nome}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/65">
                {categoria}
                <span className={`inline-flex items-center gap-1 rounded-full bg-white/8 px-1.5 py-px font-semibold ${cor}`}>
                  <Icone className="h-2.5 w-2.5" />
                  {rotulo}
                </span>
              </span>
            </span>
            <span className={`shrink-0 text-[12px] font-semibold tabular-nums ${entrada ? "text-emerald-300" : "text-white"}`}>
              {valor}
            </span>
          </li>
        ))}
      </ul>
    </Celular>
  );
}

export function TelaIA() {
  return (
    <Celular rotulo="Ilustração de uma conversa com a IA do NovareCash, com dados de exemplo: a pessoa pergunta por que sobrou menos no mês e se pode gastar 300 reais no fim de semana, e a IA responde com os números dela.">
      <TopoApp titulo="Pergunte" />
      <div className="mt-4 space-y-2.5 text-[11px] leading-snug">
        <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2 text-white">
          Por que sobrou menos este mês?
        </p>
        <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-ouro/12 px-3 py-2 text-white/90 ring-1 ring-ouro/25">
          <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-ouro">
            <Sparkles className="h-3 w-3" />
            IA do NovareCash
          </span>
          Restaurantes passou do orçamento: R$ 410 de R$ 350, em 9 pedidos, 6 deles depois das 21h. O resto
          ficou dentro do combinado.
        </div>
        <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2 text-white">
          Dá para gastar R$ 300 no fim de semana?
        </p>
        <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-ouro/12 px-3 py-2 text-white/90 ring-1 ring-ouro/25">
          Dá. Sobram R$ 2.340 no mês e as contas fixas que faltam somam R$ 1.120. Depois do passeio, ficam
          R$ 920.
        </div>
      </div>
    </Celular>
  );
}

/** A legenda obrigatória de toda tela desenhada. */
export function LegendaExemplo({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-2xs font-medium text-white/65 ${className}`}>Ilustração com dados de exemplo</p>
  );
}

/** A seção "por dentro": Extrato e IA lado a lado (o Início já aparece no herói). */
export function TelasExemplo() {
  const telas = [
    {
      Tela: TelaExtrato,
      titulo: AUTOMATICO_NO_AR ? "O extrato se preenche sozinho" : "Cada gasto na categoria certa",
      texto: AUTOMATICO_NO_AR
        ? "O que vem do banco e o que você manda pelo WhatsApp (texto, áudio ou a foto da nota) entra com a categoria e um selo dizendo de onde veio."
        : "Cada lançamento entra com a categoria e um selo de origem. Hoje, você lança à mão; banco e WhatsApp passam a lançar quando liberarem.",
    },
    {
      Tela: TelaIA,
      titulo: "A IA responde com os seus números",
      texto: "Pergunte como falaria com alguém de casa. A resposta sai dos seus lançamentos, não de uma média da internet.",
    },
  ];
  return (
    <div className="grid gap-12 md:grid-cols-2 md:gap-8">
      {telas.map(({ Tela, titulo, texto }) => (
        <figure key={titulo} className="flex flex-col items-center">
          <Tela />
          <figcaption className="mt-6 max-w-sm text-center">
            <span className="block font-display text-lg font-semibold text-white">{titulo}</span>
            <span className="mt-1.5 block text-sm leading-relaxed text-white/70">{texto}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
