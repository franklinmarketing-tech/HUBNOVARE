"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AcaoAssinante } from "@/components/AcaoAssinante";
import { MudouNoMes, type Comparavel } from "@/components/MudouNoMes";
import { usePlanejamento } from "../usePlanejamento";
import { NOTA_RISCO } from "@/lib/planejamento/diagnostico";
import { PERFIS } from "@/lib/planejamento/perfil";
import { CATEGORIAS_DESPESA } from "@/lib/planejamento/catalogos";
import { etapaPorSlug } from "../etapas";
import {
  Carregando,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
  brlCurto,
  pct,
  FalhouAoCarregar,
  SessaoExpirada,
} from "../pecas";

/** "2026-08-01" → "agosto de 2026". */
const mesPorExtenso = (ref: string) =>
  new Date(`${ref}T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

type Fechamento = {
  month_ref: string;
  net_worth: number;
  total_debts: number;
  total_income: number;
  total_expenses: number;
  emergency_reserve_months: number;
  plan_completion_pct: number;
};

type MetaSalva = { source_label: string; meta_text: string | null; prazo: string | null };

/**
 * O relatório do cliente.
 *
 * Sai em PDF pela impressão do próprio navegador ("Salvar como PDF"), com um
 * estilo de impressão que esconde a casca do app. É uma escolha deliberada
 * sobre gerar o arquivo por biblioteca: o relatório é texto e tabela, o
 * resultado sai com as fontes e o gráfico reais da tela, e o produto não ganha
 * uma dependência de ~350 KB para fazer o que o navegador já faz.
 *
 * Detalhe que importa: no app do consultor este botão era escondido do cliente
 * de propósito. Aqui o relatório é dele.
 */
export default function RelatorioPage() {
  const r = usePlanejamento();
  const etapa = etapaPorSlug("relatorio")!;
  const [metas, setMetas] = useState<MetaSalva[]>([]);
  const [nome, setNome] = useState("");
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);

  const clientId = r.fase === "pronto" ? r.dados.clientId : null;

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [metasRes, perfilRes, fechRes] = await Promise.all([
        supabase
          .from("parecer_metas")
          .select("source_label, meta_text, prazo")
          .eq("client_id", clientId),
        user
          ? supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        // Os dois últimos fechamentos: é o que transforma o relatório de um
        // retrato de hoje numa ENTREGA DO MÊS. Sem isso, dois relatórios
        // emitidos em meses diferentes eram documentos idênticos, mudando
        // apenas a data de emissão.
        supabase
          .from("monthly_closings")
          .select("month_ref, net_worth, total_debts, total_income, total_expenses, emergency_reserve_months, plan_completion_pct")
          .eq("client_id", clientId)
          .order("month_ref", { ascending: false })
          .limit(2),
      ]);

      setMetas(metasRes.data ?? []);
      setNome(perfilRes.data?.full_name ?? "");
      setFechamentos(fechRes.data ?? []);
    })();
  }, [clientId]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.fase === "erro") return <FalhouAoCarregar />;
  if (r.dados.vazio) return <PrecisaPreencher />;

  const { diagnostico: d, plano, saude, reserva, acoes, entrada, perfil } = r.dados;
  const nota = NOTA_RISCO[d.risco];
  // O fechamento mais recente é o mês que este relatório documenta; o
  // anterior serve para dizer o que mudou.
  const [atual, anterior] = fechamentos;

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="surgir">
      <style>{`
        @media print {
          /* Só o relatório vai para o papel. O cabeçalho do app carrega a
             classe .nao-imprimir na origem (layout.tsx) — a regra global por
             elemento "header" que existia aqui apagava também o <header> do
             próprio relatório: logo, título, nome do cliente e data sumiam
             do PDF. */
          nav, .nao-imprimir { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
          .folha { break-inside: avoid; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="nao-imprimir">
        <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <AcaoAssinante acao="baixar o relatório em PDF">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
            >
              <Printer className="h-4 w-4" />
              Baixar em PDF
            </button>
          </AcaoAssinante>
          <p className="text-xs text-muted-foreground">
            Escolha <strong>Salvar como PDF</strong> no destino da impressão.
          </p>
        </div>
      </div>

      <article className="space-y-6 rounded-2xl border border-border bg-white p-7 print:border-0 print:p-0">
        <header className="folha flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={120}
              height={32}
              style={{ height: 26, width: "auto" }}
            />
            <h1 className="mt-3 font-display text-2xl font-bold text-primary">
              Seu planejamento financeiro
            </h1>
            {nome && <p className="mt-0.5 text-sm text-slate-600">{nome}</p>}
          </div>
          <p className="text-right text-2xs text-muted-foreground">
            {/* O MÊS DE REFERÊNCIA é o que faz disto um documento mensal.
                Antes havia só a data de emissão, então dois relatórios de
                meses diferentes eram indistinguíveis pelo conteúdo. */}
            {atual && (
              <>
                <span className="font-bold uppercase tracking-wide text-primary">
                  {mesPorExtenso(atual.month_ref)}
                </span>
                <br />
              </>
            )}
            Emitido em
            <br />
            {hoje}
          </p>
        </header>

        {/* O QUE MUDOU abre o relatório quando há dois fechamentos.
        
            Quem recebe um documento mensal quer saber primeiro o que andou
            desde o último — o retrato completo vem depois. Some no primeiro
            mês, quando ainda não existe "mudou". */}
        {atual && anterior && (
          <section className="folha mb-5">
            <MudouNoMes
              mesAnterior={mesPorExtenso(anterior.month_ref)}
              itens={([
                {
                  rotulo: "Patrimônio líquido",
                  antes: anterior.net_worth ?? 0,
                  agora: atual.net_worth ?? 0,
                  formato: (v: number) => brlCurto(v),
                  bomQuando: "sobe",
                  limiar: 100,
                },
                {
                  rotulo: "Dívidas",
                  antes: anterior.total_debts ?? 0,
                  agora: atual.total_debts ?? 0,
                  formato: (v: number) => brlCurto(v),
                  bomQuando: "cai",
                  limiar: 100,
                },
                {
                  rotulo: "Reserva de emergência",
                  antes: anterior.emergency_reserve_months ?? 0,
                  agora: atual.emergency_reserve_months ?? 0,
                  formato: (v: number) => `${v.toFixed(1).replace(".", ",")} meses`,
                  bomQuando: "sobe",
                  limiar: 0.1,
                },
                {
                  rotulo: "Plano cumprido",
                  antes: anterior.plan_completion_pct ?? 0,
                  agora: atual.plan_completion_pct ?? 0,
                  formato: (v: number) => `${Math.round(v)}%`,
                  bomQuando: "sobe",
                  limiar: 1,
                },
              ] satisfies Comparavel[])}
            />
          </section>
        )}

        <section className="folha">
          <h2 className="font-display text-base font-bold text-primary">
            1 · Onde você está
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sua situação é <strong>{nota.rotulo.toLowerCase()}</strong> (nota {d.risco}).{" "}
            {nota.recado}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <Dado rotulo="Entra por mês" valor={brl(d.rendaMensal)} />
            <Dado rotulo="Sai por mês" valor={brl(d.despesaMensal)} />
            <Dado rotulo="Sobra" valor={brl(d.sobraMensal)} />
            <Dado rotulo="Patrimônio líquido" valor={brl(d.patrimonioLiquido)} />
          </dl>
        </section>

        <section className="folha">
          <h2 className="font-display text-base font-bold text-primary">
            2 · Seu Marco Horizonte
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Para sustentar a vida que você descreveu, seu patrimônio precisa chegar
            a <strong>{brlCurto(plano.capitalDeVida)}</strong> — objetivos somados
            à aposentadoria. Da parte de aposentadoria, o ritmo de hoje cobre{" "}
            <strong>{pct(plano.pctAtingido)}</strong> até os{" "}
            {entrada.idadeAposentadoria} anos.
          </p>
          {!plano.viavel && (
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {plano.pouparMaisMes != null && (
                <li>• Guardar mais {brl(plano.pouparMaisMes)} por mês fecha a conta.</li>
              )}
              {plano.esperarAnos != null && (
                <li>
                  • Ou adiar em {plano.esperarAnos} ano(s), parando aos{" "}
                  {entrada.idadeAposentadoria + plano.esperarAnos}.
                </li>
              )}
              {plano.rentNecessariaPct != null && (
                <li>
                  • Ou obter{" "}
                  {plano.rentNecessariaPct.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  % ao ano acima da inflação, contra os 5% previstos.
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="folha">
          <h2 className="font-display text-base font-bold text-primary">
            3 · Sua saúde financeira: {saude.total}/100 ({saude.nota})
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {saude.pilares.map((p) => (
              <li key={p.key}>
                • <strong>{p.nome}</strong> — {p.score}/100. {p.dica}
              </li>
            ))}
          </ul>
        </section>

        <section className="folha">
          <h2 className="font-display text-base font-bold text-primary">
            4 · Para onde vai o seu dinheiro
          </h2>
          {/* As duas tabelas desta página eram as únicas do projeto sem
              contentor de rolagem: em três colunas elas apertavam no celular.
              O `min-w` mantém as colunas legíveis e o contentor rola. */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
            <tbody>
              {d.despesasPorCategoria.slice(0, 10).map((c) => (
                <tr key={c.categoria} className="border-b border-border/60 last:border-0">
                  <td className="py-1.5 text-slate-600">
                    {CATEGORIAS_DESPESA.find((x) => x.valor === c.categoria)?.rotulo ??
                      c.categoria}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-600">
                    {brl(c.valor)}
                  </td>
                  <td className="w-12 py-1.5 text-right tabular-nums font-semibold text-primary">
                    {c.fatia}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section className="folha">
          <h2 className="font-display text-base font-bold text-primary">
            5 · O que fazer, em ordem
          </h2>
          {metas.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Abra a tela do plano uma vez para que ele seja montado.
            </p>
          ) : (
            <ol className="mt-2 space-y-2.5 text-sm text-slate-600">
              {metas.map((m, i) => (
                <li key={`${m.source_label}-${i}`}>
                  <strong>{i + 1}. {m.source_label}</strong>
                  {m.prazo && (
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      (até{" "}
                      {new Date(m.prazo).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                      )
                    </span>
                  )}
                  <br />
                  {m.meta_text}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="folha">
          <h2 className="font-display text-base font-bold text-primary">
            6 · Como dividir o que você guarda
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Aporte recomendado de <strong>{brl(acoes.aporteRecomendadoMes)}</strong> por
            mês, num horizonte de {acoes.anosAteIndependencia} ano(s). Reserva de
            emergência alvo: {brl(reserva.meta)}.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
            <tbody>
              {acoes.carteira.map((f) => (
                <tr key={f.classe} className="border-b border-border/60 last:border-0">
                  <td className="py-1.5 text-slate-600">{f.classe}</td>
                  <td className="w-12 py-1.5 text-right tabular-nums font-semibold text-primary">
                    {f.pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {perfil && (
            <p className="mt-3 text-sm text-slate-600">
              <strong>Seu perfil: {perfil}.</strong> {PERFIS[perfil].comoUsar}
            </p>
          )}
        </section>

        <footer className="folha border-t border-border pt-4 text-[11px] leading-relaxed text-slate-500">
          Este relatório é um estudo de planejamento financeiro pessoal, gerado a
          partir dos dados que você informou. As projeções usam 5% ao ano de
          retorno real bruto (cerca de 3,8% líquidos de imposto de renda, acima
          da inflação) e calculam o capital necessário para sustentar a renda
          desejada até os 90 anos; são estimativas, não promessa de
          rentabilidade. O documento{" "}
          <strong>não é recomendação de investimento</strong> e não indica
          produto, corretora ou instituição. Para uma recomendação personalizada,
          fale com um consultor da Novare.
        </footer>
      </article>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wider text-muted-foreground">{rotulo}</dt>
      <dd className="font-bold tabular-nums text-primary">{valor}</dd>
    </div>
  );
}
