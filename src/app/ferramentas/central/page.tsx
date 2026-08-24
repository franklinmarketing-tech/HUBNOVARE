"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Repeat,
  Wallet,
} from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

interface Compromisso {
  id: string;
  nome: string;
  dia: number;
  valor: number;
  tipo: "Conta" | "Cartão" | "Parcela" | "Imposto" | "Receita";
}

interface Calendario {
  compromissos: Compromisso[];
  pagos: Record<string, boolean>;
}

interface Assinatura {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
}

interface Orcamento {
  renda?: string;
  categorias?: Array<Record<string, unknown>>;
}

interface Patrimonio {
  ativos: Array<{ id: string; nome: string; classe: string; valor: number }>;
  dividas: Array<{ id: string; nome: string; valor: number }>;
}

const pad = (n: number) => String(n).padStart(2, "0");

/* -------------------------------------------------------------------------- */

export default function CentralPage() {
  const [gastos, , carGastos] = useArmazenado<Gasto[]>("gastos", []);
  const [calendario, , carCalendario] = useArmazenado<Calendario>(
    "calendario",
    { compromissos: [], pagos: {} }
  );
  const [assinaturas, , carAssinaturas] = useArmazenado<Assinatura[]>(
    "assinaturas",
    []
  );
  const [orcamento, , carOrcamento] = useArmazenado<Orcamento>("orcamento", {
    renda: "",
    categorias: [],
  });
  const [patrimonio, , carPatrimonio] = useArmazenado<Patrimonio>(
    "patrimonio",
    { ativos: [], dividas: [] }
  );

  const carregouTudo =
    carGastos && carCalendario && carAssinaturas && carOrcamento && carPatrimonio;

  /* ------------------------------ Leituras -------------------------------- */

  const listaGastos = Array.isArray(gastos) ? gastos : [];
  const compromissos = Array.isArray(calendario?.compromissos)
    ? calendario.compromissos
    : [];
  const pagos =
    calendario?.pagos && typeof calendario.pagos === "object"
      ? calendario.pagos
      : {};
  const listaAssinaturas = Array.isArray(assinaturas) ? assinaturas : [];
  const ativos = Array.isArray(patrimonio?.ativos) ? patrimonio.ativos : [];
  const dividas = Array.isArray(patrimonio?.dividas) ? patrimonio.dividas : [];

  const agora = new Date();
  const anoMes = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`;

  const gastoDoMes = useMemo(
    () =>
      listaGastos
        .filter((g) => typeof g?.data === "string" && g.data.slice(0, 7) === anoMes)
        .reduce((acc, g) => acc + (Number(g.valor) || 0), 0),
    [listaGastos, anoMes]
  );

  const vencimentos = useMemo(() => {
    const pendentes = compromissos.filter(
      (c) => c && c.tipo !== "Receita" && pagos[`${c.id}:${anoMes}`] !== true
    );
    const total = pendentes.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
    const diaHoje = agora.getDate();
    const proximo = pendentes
      .map((c) => Number(c.dia) || 1)
      .filter((d) => d >= diaHoje)
      .sort((a, b) => a - b)[0];
    return { total, quantidade: pendentes.length, proximoDia: proximo ?? null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compromissos, pagos, anoMes]);

  const custoAnualAssinaturas = useMemo(
    () =>
      listaAssinaturas.reduce((acc, a) => acc + (Number(a?.valor) || 0), 0) * 12,
    [listaAssinaturas]
  );

  const rendaOrcamento = parseNumero(
    typeof orcamento?.renda === "string" || typeof orcamento?.renda === "number"
      ? orcamento.renda
      : ""
  );
  const categoriasOrcamento = Array.isArray(orcamento?.categorias)
    ? orcamento.categorias
    : [];

  const patrimonioLiquido = useMemo(() => {
    const somaAtivos = ativos.reduce((acc, a) => acc + (Number(a?.valor) || 0), 0);
    const somaDividas = dividas.reduce(
      (acc, d) => acc + (Number(d?.valor) || 0),
      0
    );
    return somaAtivos - somaDividas;
  }, [ativos, dividas]);

  /* --------------------------- Ferramentas em uso -------------------------- */

  const usos = [
    listaGastos.length > 0,
    compromissos.length > 0,
    listaAssinaturas.length > 0,
    rendaOrcamento > 0 || categoriasOrcamento.length > 0,
    ativos.length > 0 || dividas.length > 0,
  ];
  const emUso = usos.filter(Boolean).length;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Central financeira
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Ferramenta inteligente
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Sua vida financeira num lugar só
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            A Central lê o que você já registrou nas outras ferramentas da
            Novare e monta o retrato do mês: gastos, contas a vencer,
            assinaturas, orçamento e patrimônio, lado a lado.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Ferramentas já em uso
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {emUso}
            <span className="text-2xl sm:text-3xl font-bold text-white/60">
              {" "}
              / {usos.length}
            </span>
          </p>
          <p className="text-sm text-white/70 mt-3">
            {emUso === 0
              ? "Comece por qualquer card abaixo: cada ferramenta alimenta esta central."
              : emUso === usos.length
                ? "Retrato completo: todas as ferramentas alimentando a central."
                : "Quanto mais ferramentas você usa, mais completo fica o retrato."}
          </p>
        </section>

        {/* Cards-resumo */}
        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <CardResumo
            usado={usos[0]}
            carregado={carregouTudo}
            href="/ferramentas/gastos"
            icone={<Receipt className="h-5 w-5 text-primary" />}
            titulo="Gasto do mês"
            valor={brl(gastoDoMes)}
            legenda={`${listaGastos.filter((g) => typeof g?.data === "string" && g.data.slice(0, 7) === anoMes).length} lançamentos em ${anoMes.slice(5, 7)}/${anoMes.slice(0, 4)}`}
            convite="Registre seus gastos e veja o total do mês aqui."
            acao="Abrir Controle de Gastos"
          />
          <CardResumo
            usado={usos[1]}
            carregado={carregouTudo}
            href="/ferramentas/calendario"
            icone={<CalendarDays className="h-5 w-5 text-primary" />}
            titulo="A vencer no mês"
            valor={brl(vencimentos.total)}
            legenda={
              vencimentos.quantidade > 0
                ? `${vencimentos.quantidade} ${
                    vencimentos.quantidade === 1
                      ? "compromisso pendente"
                      : "compromissos pendentes"
                  }${vencimentos.proximoDia ? `, próximo dia ${vencimentos.proximoDia}` : ""}`
                : "Nada pendente neste mês"
            }
            convite="Cadastre suas contas fixas e acompanhe os vencimentos."
            acao="Abrir Calendário de Contas"
          />
          <CardResumo
            usado={usos[2]}
            carregado={carregouTudo}
            href="/ferramentas/assinaturas"
            icone={<Repeat className="h-5 w-5 text-primary" />}
            titulo="Assinaturas por ano"
            valor={brl(custoAnualAssinaturas)}
            legenda={`${listaAssinaturas.length} ${
              listaAssinaturas.length === 1
                ? "assinatura ativa"
                : "assinaturas ativas"
            }, ${brl(custoAnualAssinaturas / 12)} por mês`}
            convite="Liste suas assinaturas e descubra o custo anual delas."
            acao="Mapear Assinaturas"
          />
          <CardResumo
            usado={usos[3]}
            carregado={carregouTudo}
            href="/ferramentas/orcamento"
            icone={<Wallet className="h-5 w-5 text-primary" />}
            titulo="Renda no orçamento"
            valor={brl(rendaOrcamento)}
            legenda={
              categoriasOrcamento.length > 0
                ? `Orçamento com ${categoriasOrcamento.length} ${
                    categoriasOrcamento.length === 1 ? "categoria" : "categorias"
                  }`
                : "Renda informada no orçamento"
            }
            convite="Monte seu orçamento e defina quanto vai para cada área."
            acao="Montar Orçamento"
          />
          <CardResumo
            usado={usos[4]}
            carregado={carregouTudo}
            href="/ferramentas/patrimonio"
            icone={<PiggyBank className="h-5 w-5 text-primary" />}
            titulo="Patrimônio líquido"
            valor={brl(patrimonioLiquido)}
            legenda={`${ativos.length} ${ativos.length === 1 ? "ativo" : "ativos"} e ${dividas.length} ${dividas.length === 1 ? "dívida" : "dívidas"} cadastrados`}
            convite="Cadastre ativos e dívidas para ver seu patrimônio líquido."
            acao="Mapear Patrimônio"
          />
          <Link
            href="/ferramentas/alertas"
            className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between transition-shadow hover:shadow-sm"
          >
            <div>
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-700 mt-3">
                Alerta de Vencimentos
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                A leitura inteligente do seu calendário e das assinaturas:
                tudo o que vence nos próximos 15 dias.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Ver alertas
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CardResumo({
  usado,
  carregado,
  href,
  icone,
  titulo,
  valor,
  legenda,
  convite,
  acao,
}: {
  usado: boolean;
  carregado: boolean;
  href: string;
  icone: ReactNode;
  titulo: string;
  valor: string;
  legenda: string;
  convite: string;
  acao: string;
}) {
  if (carregado && !usado) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 flex flex-col justify-between transition-shadow hover:shadow-sm"
      >
        <div>
          {icone}
          <p className="text-sm font-semibold text-slate-700 mt-3">{titulo}</p>
          <p className="text-[11px] text-slate-500 mt-1">{convite}</p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {acao}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between transition-shadow hover:shadow-sm"
    >
      <div>
        {icone}
        <p className="text-sm font-semibold text-slate-700 mt-3">{titulo}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
          {valor}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
          {legenda}
        </p>
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {acao}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
