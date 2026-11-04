import {
  CalendarClock,
  Check,
  CheckCheck,
  Copy,
  Headset,
  Landmark,
  MessageCircle,
  Plus,
  ReceiptText,
  Repeat,
  SendHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { NOVARECASH_NOME, RECURSOS, type Recurso } from "@/lib/novarecash/config";
import { statusRecurso } from "@/lib/novarecash/oferta";
import { GradeLuz } from "./GradeLuz";

/**
 * O QUE VEM NO NOVARECASH, num BENTO escuro (04/11/2026: a grade de cartões
 * brancos iguais "não é moderna"). Cada bloco traz uma mini ilustração da
 * interface, com dados de EXEMPLO, no lugar do ícone num quadrado.
 *
 * ⚠️ CÓDIGO DE DEFESA DO CONSUMIDOR: o status de cada bloco sai de
 * `statusRecurso` (que lê `RECURSOS[].noAr`/`liberaEm` em `config.ts`), nunca
 * de texto escrito aqui. O que não está no ar vai para o bloco "Vem aí", com a
 * data em destaque e a ilustração apagada, para não parecer disponível.
 * Ligou o recurso em `config.ts`? Ele sai do "Vem aí" e ganha bloco próprio.
 *
 * ⚠️ O desenho da grade foi pensado para 8 no ar + "Vem aí" (sem buraco em 1, 2
 * e 4 colunas). Se o número mudar, a grade continua fechando (`grid-flow-dense`),
 * mas vale olhar `LAYOUT` de novo.
 *
 * As ilustrações são `aria-hidden`: quem usa leitor de tela ouve o título, a
 * frase e o status, que são a descrição de cada bloco.
 */

/** Título curto e uma frase de no máximo linha e meia. O texto longo continua em `RECURSOS`. */
const CURTO: Record<Recurso["chave"], { titulo: string; texto: string }> = {
  ia: { titulo: "IA que conhece o seu dinheiro", texto: "Pergunte em português. A resposta sai dos seus lançamentos, não de uma média da internet." },
  alertas: { titulo: "Alertas do dinheiro que some", texto: "Assinatura esquecida, tarifa e cobrança duplicada aparecem sozinhas." },
  cartoes: { titulo: "Fatura de verdade", texto: "Fechamento, parcelas e quanto vem na próxima." },
  contas: { titulo: "Contas a pagar", texto: "O que vence, o que já foi pago e quanto sobra." },
  metas: { titulo: "Metas e relatórios", texto: "Quanto guardar por mês e os últimos 6 meses lado a lado." },
  extrato: { titulo: "Extrato e orçamento", texto: "Cada gasto na categoria certa, com aviso antes de estourar." },
  compartilhada: { titulo: "Para o casal ou a família", texto: "Os dois veem e lançam, com uma assinatura só." },
  consultor: { titulo: "Um consultor de verdade", texto: "Gente da Novare no WhatsApp, sem vender produto." },
  whatsapp: { titulo: "Lançou no WhatsApp, está no app", texto: "Uma mensagem, um áudio ou a foto da nota." },
  banco: { titulo: "Conectado ao seu banco", texto: "Open Finance oficial: saldo e extrato entram sozinhos." },
};

/** Tamanho de cada bloco na grade (1 coluna no celular, 2 no tablet, 4 no computador). */
const LAYOUT: Partial<Record<Recurso["chave"], string>> = {
  ia: "sm:col-span-2 lg:row-span-2",
  alertas: "sm:col-span-2",
  metas: "sm:row-span-2",
  extrato: "sm:col-span-2",
};

/** Os blocos largos põem a ilustração ao lado do texto no computador. */
const DEITADO: Partial<Record<Recurso["chave"], boolean>> = { alertas: true };

/** A ordem do bento (a de `RECURSOS` é a da lista, não a da composição). */
const ORDEM: Recurso["chave"][] = ["ia", "alertas", "cartoes", "contas", "metas", "extrato", "compartilhada", "consultor", "whatsapp", "banco"];

export function Recursos() {
  const ordenados = [...RECURSOS].sort((a, b) => ORDEM.indexOf(a.chave) - ORDEM.indexOf(b.chave));
  const noAr = ordenados.filter((r) => r.noAr);
  const pendentes = ordenados.filter((r) => !r.noAr);

  return (
    <>
      <GradeLuz className="grid grid-flow-dense gap-3 sm:grid-cols-2 sm:gap-4 lg:auto-rows-[minmax(14.5rem,auto)] lg:grid-cols-4">
        {noAr.map((r) => (
          <Bloco key={r.chave} recurso={r} />
        ))}
        {pendentes.length > 0 && <BlocoVemAi pendentes={pendentes} />}
      </GradeLuz>
      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
        Ilustrações com dados de exemplo.
        {pendentes.length > 0 &&
          " O que tem data ainda não funciona. Quando ligar, entra na mesma assinatura. Até lá, esta página mostra a data, não a promessa."}
      </p>
    </>
  );
}

const ILUSTRACAO: Partial<Record<Recurso["chave"], () => React.ReactElement>> = {
  ia: IlustraIA,
  alertas: IlustraAlertas,
  cartoes: IlustraCartoes,
  contas: IlustraContas,
  metas: IlustraMetas,
  extrato: IlustraExtrato,
  compartilhada: IlustraCompartilhada,
  consultor: IlustraConsultor,
  whatsapp: IlustraWhatsApp,
  banco: IlustraBanco,
};

function Bloco({ recurso: r }: { recurso: Recurso }) {
  const s = statusRecurso(r);
  const { titulo, texto } = CURTO[r.chave];
  const Ilustra = ILUSTRACAO[r.chave];
  const deitado = DEITADO[r.chave];
  const fundo = r.chave === "ia" ? "ncv-bloco-ia" : r.chave === "cartoes" ? "ncv-bloco-cartao" : "";
  return (
    <li
      data-luz
      className={`ncv-bloco ${fundo} flex flex-col gap-5 rounded-[1.75rem] p-5 text-white sm:p-6 ${LAYOUT[r.chave] ?? ""} ${
        deitado ? "lg:grid lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-6" : ""
      }`}
    >
      {Ilustra && (
        <div aria-hidden className={`flex-1 ${deitado ? "lg:order-2" : ""}`}>
          <Ilustra />
        </div>
      )}
      <div className={deitado ? "lg:order-1" : ""}>
        <h3 className={`font-display font-semibold leading-snug text-white ${r.chave === "ia" ? "text-2xl" : "text-lg"}`}>{titulo}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/70">{texto}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-emerald-300">
          <Check className="h-3.5 w-3.5" />
          {s.rotulo}
        </p>
      </div>
    </li>
  );
}

/** "Vem aí": os recursos com data, juntos, frios e com a data em destaque. */
function BlocoVemAi({ pendentes }: { pendentes: Recurso[] }) {
  return (
    <li data-luz className="ncv-bloco ncv-bloco-vem flex flex-col gap-5 rounded-[1.75rem] p-5 text-white sm:col-span-2 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">Vem aí</h3>
        <p className="text-xs text-white/70">{pendentes.length > 1 ? "Quando ligarem, entram" : "Quando ligar, entra"} na mesma assinatura.</p>
      </div>
      <div className={`grid gap-4 ${pendentes.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {pendentes.map((r) => {
          const Ilustra = ILUSTRACAO[r.chave];
          const { titulo, texto } = CURTO[r.chave];
          return (
            <div key={r.chave} className="flex flex-col gap-3">
              {Ilustra && (
                <div aria-hidden className="opacity-60 saturate-50">
                  <Ilustra />
                </div>
              )}
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-ciano-claro/15 px-2.5 py-1 text-[0.75rem] font-bold text-ciano-claro ring-1 ring-ciano-claro/40">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {statusRecurso(r).rotulo}
                </p>
                <p className="mt-2 font-semibold leading-snug">{titulo}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/70">{texto}</p>
              </div>
            </div>
          );
        })}
      </div>
    </li>
  );
}

/* ═══ As mini ilustrações (dados de EXEMPLO, de uma pessoa fictícia) ═══ */

const PAINEL = "rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07]";

function IlustraIA() {
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="space-y-2.5 text-[13px] leading-snug">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 text-white">Por que sobrou menos este mês?</p>
        <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-ouro/12 px-3.5 py-2.5 text-white/90 ring-1 ring-ouro/25">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-ouro">
            <Sparkles className="h-3.5 w-3.5" />
            IA do {NOVARECASH_NOME}
          </span>
          Restaurantes passou do orçamento: R$ 410 de R$ 350, em 9 pedidos. O resto ficou dentro do combinado.
        </div>
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 text-white">Posso gastar R$ 300 no sábado?</p>
        <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-ouro/12 px-3.5 py-2.5 text-white/90 ring-1 ring-ouro/25">
          Pode. Depois do passeio, ainda sobram R$ 920 no mês.
        </div>
        <p className="ml-auto hidden w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 text-white lg:block">E a fatura do cartão?</p>
        <div className="hidden w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-ouro/12 px-3.5 py-2.5 text-white/90 ring-1 ring-ouro/25 lg:block">
          Fecha em 3 dias: R$ 1.284,30, e já está descontada da sobra.
        </div>
      </div>
      <div className={`flex items-center justify-between gap-3 py-2 pl-4 pr-2 ${PAINEL}`}>
        <span className="text-[12.5px] text-white/60">Pergunte sobre o seu dinheiro</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ouro text-noite">
          <SendHorizontal className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function IlustraAlertas() {
  const itens: { Icone: LucideIcon; nome: string; detalhe: string; valor: string }[] = [
    { Icone: Repeat, nome: "Streaming subiu", detalhe: "de R$ 39,90 para R$ 44,90", valor: "+ R$ 5/mês" },
    { Icone: Landmark, nome: "Tarifa do banco", detalhe: "cobrada todo mês", valor: "R$ 32,90/mês" },
    { Icone: Copy, nome: "Cobrança duplicada", detalhe: "Farmácia, dia 12", valor: "R$ 62,30" },
  ];
  return (
    <ul className="space-y-2">
      {itens.map(({ Icone, nome, detalhe, valor }, i) => (
        <li key={nome} className={`flex items-center gap-3 px-3 py-2.5 ${PAINEL}`}>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              i === 0 ? "bg-accent/20 text-accent-claro" : "bg-ouro/12 text-ouro"
            }`}
          >
            <Icone className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium">{nome}</span>
            <span className="block truncate text-[11px] text-white/60">{detalhe}</span>
          </span>
          <span className="shrink-0 text-[12px] font-semibold tabular-nums">{valor}</span>
        </li>
      ))}
    </ul>
  );
}

function IlustraCartoes() {
  return (
    <div>
      <div className="ncv-plastico relative h-[5.5rem] w-full max-w-[13rem] rounded-xl p-3 text-white">
        <span className="block h-4 w-6 rounded-[4px] bg-[linear-gradient(135deg,hsl(44_60%_80%),hsl(40_40%_55%))]" />
        <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold tracking-[0.14em] tabular-nums">•••• 4821</span>
        <span className="absolute bottom-2.5 right-3 text-[10px] font-semibold text-white/85">fecha em 3 dias</span>
      </div>
      <p className="mt-3 flex items-baseline justify-between text-[11px] text-white/65">
        Fatura de novembro <strong className="text-[13px] font-semibold text-white tabular-nums">R$ 1.284,30</strong>
      </p>
      <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <span className="w-[62%] bg-ouro" />
        <span className="w-[38%] bg-ouro/40" />
      </div>
      <p className="mt-1.5 flex justify-between text-[10.5px] text-white/60">
        <span>à vista</span>
        <span>parcelas: 4 de 10</span>
      </p>
    </div>
  );
}

function IlustraContas() {
  const contas = [
    { dia: "05", nome: "Aluguel", valor: "R$ 1.800,00", paga: true },
    { dia: "10", nome: "Luz", valor: "R$ 186,40", paga: false },
    { dia: "15", nome: "Escola", valor: "R$ 933,60", paga: false },
  ];
  return (
    <div>
      <ul className="space-y-1.5">
        {contas.map((c) => (
          <li key={c.dia} className="flex items-center gap-2.5">
            <span className={`flex w-9 shrink-0 flex-col items-center rounded-lg py-0.5 leading-none ${c.paga ? "bg-white/[0.05] text-white/60" : "bg-ouro/12 text-ouro"}`}>
              <span className="text-[13px] font-semibold tabular-nums">{c.dia}</span>
              <span className="text-[8.5px] uppercase tracking-[0.1em]">nov</span>
            </span>
            <span className={`flex-1 text-[12px] ${c.paga ? "text-white/60 line-through decoration-white/30" : "text-white"}`}>{c.nome}</span>
            <span className="text-[11.5px] tabular-nums text-white/80">{c.valor}</span>
            {c.paga ? <CheckCheck className="h-3.5 w-3.5 text-emerald-300" /> : <span className="h-3.5 w-3.5" />}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 flex justify-between border-t border-white/10 pt-2 text-[11px] text-white/65">
        Faltam pagar <strong className="font-semibold text-white tabular-nums">R$ 1.120,00</strong>
      </p>
    </div>
  );
}

function IlustraMetas() {
  /* O anel: 63% de uma circunferência de raio 34. */
  const raio = 34;
  const volta = 2 * Math.PI * raio;
  const meses = [
    { m: "jun", v: 58 },
    { m: "jul", v: 76 },
    { m: "ago", v: 49 },
    { m: "set", v: 92 },
    { m: "out", v: 81 },
    { m: "nov", v: 86, atual: true },
  ];
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 lg:h-32 lg:w-32">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={raio} fill="none" stroke="hsl(0 0% 100% / 0.1)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={raio}
              fill="none"
              stroke="hsl(42 74% 62%)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${volta * 0.63} ${volta}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums">63%</span>
        </div>
        <div className="text-[12px] leading-snug">
          <p className="font-semibold text-white">Viagem de julho</p>
          <p className="text-white/65 tabular-nums">R$ 3.150 de R$ 5.000</p>
          <p className="mt-1 text-ouro">Guardar R$ 232 por mês</p>
        </div>
      </div>
      <div className={`flex min-h-0 flex-1 flex-col px-3 pb-2 pt-3 ${PAINEL}`}>
        <p className="text-[10.5px] text-white/60">Sobra por mês</p>
        <div className="mt-2 flex h-20 flex-1 items-end gap-1.5 lg:h-auto lg:min-h-28">
          {meses.map(({ m, v, atual }) => (
            <div key={m} className="flex h-full flex-1 flex-col items-center gap-1">
              <span className="flex w-full flex-1 items-end">
                <span
                  className={`block w-full rounded-t-md ${atual ? "bg-ouro" : "bg-white/20"}`}
                  style={{ height: `${v}%` }}
                />
              </span>
              <span className={`text-[9.5px] ${atual ? "font-semibold text-ouro" : "text-white/55"}`}>{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IlustraExtrato() {
  const lancamentos = [
    { nome: "Supermercado", categoria: "Mercado", valor: "- R$ 187,40" },
    { nome: "Almoço", categoria: "Restaurantes", valor: "- R$ 45,00" },
    { nome: "Uber", categoria: "Transporte", valor: "- R$ 23,90" },
  ];
  const categorias = [
    { nome: "Moradia", pct: 90 },
    { nome: "Mercado", pct: 82 },
    { nome: "Restaurantes", pct: 100, estourou: true },
    { nome: "Transporte", pct: 72 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ul className={`divide-y divide-white/[0.07] px-3 py-1 ${PAINEL}`}>
        {lancamentos.map((l) => (
          <li key={l.nome} className="flex items-center justify-between gap-2 py-2">
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium">{l.nome}</span>
              <span className="block text-[10.5px] text-white/60">{l.categoria}</span>
            </span>
            <span className="shrink-0 text-[12px] font-semibold tabular-nums">{l.valor}</span>
          </li>
        ))}
      </ul>
      <ul className="space-y-2.5 py-1">
        {categorias.map((c) => (
          <li key={c.nome}>
            <p className="flex justify-between text-[11px]">
              <span className="text-white/85">{c.nome}</span>
              <span className={c.estourou ? "font-semibold text-accent-claro" : "text-white/60"}>{c.estourou ? "passou" : `${c.pct}%`}</span>
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${c.estourou ? "bg-accent" : "bg-ouro"}`} style={{ width: `${c.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IlustraCompartilhada() {
  return (
    <div>
      <div className="flex items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(42_74%_62%),hsl(36_78%_40%))] text-sm font-bold text-noite ring-2 ring-noite-2">
          LU
        </span>
        <span className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(197_75%_68%),hsl(197_68%_38%))] text-sm font-bold text-noite ring-2 ring-noite-2">
          TH
        </span>
        <span className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/35 bg-noite-2 text-white/70">
          <Plus className="h-4 w-4" />
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-[11.5px] text-white/70">
        <li>
          <strong className="font-semibold text-ouro">LU</strong> lançou Mercado, R$ 187,40
        </li>
        <li>
          <strong className="font-semibold text-ciano-claro">TH</strong> marcou a luz como paga
        </li>
      </ul>
    </div>
  );
}

function IlustraConsultor() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-ouro/15 text-ouro ring-1 ring-ouro/40">
          <Headset className="h-5 w-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-[12.5px] font-semibold">Equipe Novare</span>
          <span className="block text-[11px] text-white/60">gente, não robô</span>
        </span>
      </div>
      <p className="mt-3 w-fit rounded-2xl rounded-tl-md bg-white/[0.08] px-3 py-2 text-[12px] leading-snug text-white/90">
        Me conta a dúvida que eu te explico.
      </p>
    </div>
  );
}

function IlustraWhatsApp() {
  return (
    <div className={`space-y-1.5 p-3 ${PAINEL}`}>
      <p className="flex items-center gap-1 text-[10.5px] font-semibold text-white/70">
        <MessageCircle className="h-3.5 w-3.5 text-emerald-300" />
        WhatsApp
      </p>
      <p className="ml-auto w-fit rounded-xl rounded-br-sm bg-emerald-400/20 px-2.5 py-1.5 text-[11.5px]">gastei 45 no mercado</p>
      <p className="flex w-fit items-center gap-1 rounded-xl rounded-bl-sm bg-white/[0.08] px-2.5 py-1.5 text-[11.5px] text-white/90">
        <Check className="h-3 w-3 text-emerald-300" />
        Anotado: Mercado, R$ 45,00
      </p>
    </div>
  );
}

function IlustraBanco() {
  return (
    <div className={`flex items-center gap-2 p-3 ${PAINEL}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Landmark className="h-4 w-4" />
      </span>
      <span className="h-px flex-1 border-t border-dashed border-white/35" />
      <span className="rounded-full bg-white/[0.08] px-2 py-1 text-[10px] font-semibold text-white/80">Open Finance</span>
      <span className="h-px flex-1 border-t border-dashed border-white/35" />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ouro/15 text-ouro">
        <ReceiptText className="h-4 w-4" />
      </span>
    </div>
  );
}
