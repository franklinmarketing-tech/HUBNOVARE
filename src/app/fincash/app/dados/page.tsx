"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Database,
  Download,
  FileSpreadsheet,
  FolderTree,
  Landmark,
  Package,
  PiggyBank,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  CabecalhoTela,
  Esqueleto,
  Pastilha,
  Vazio,
} from "../pecas";
import { LinhaDaLixeira } from "./LinhaDaLixeira";
import { faltaTabela, FALTA_SQL } from "@/lib/fincash/erros";
import {
  DIAS_NA_LIXEIRA,
  apagarDeVez,
  carregarBaseExportacao,
  carregarLixeira,
  esvaziarLixeira,
  expurgarLixeira,
  restaurarLancamento,
  type Cartao,
  type Categoria,
  type Conta,
  type Lancamento,
} from "@/lib/fincash/modelo";
import { carregarMetas, type Aporte, type Meta } from "@/lib/fincash/metas";
import {
  carregarInvestimentos,
  type Investimento,
} from "@/lib/fincash/investimentos";
import { createClient } from "@/lib/supabase/client";
import type { Orcamento } from "@/lib/fincash/categorias";
import {
  baixarCsv,
  csvCartoes,
  csvCategorias,
  csvContas,
  csvInvestimentos,
  csvLancamentos,
  csvLixeira,
  csvMetas,
  csvOrcamento,
  nomeArquivo,
  type Dicionario,
} from "@/lib/fincash/exportar";

/**
 * Dados — sair do app, e desfazer o que se apagou.
 *
 * DUAS COISAS NA MESMA TELA, e não é economia de rota: é o mesmo assunto visto
 * de dois lados. "Estes dados são meus" se prova de duas formas — podendo
 * levá-los embora, e podendo recuperá-los quando some algo. As duas juntas são
 * o que faz alguém confiar o dinheiro de um ano a um app; separadas, cada uma
 * vira um detalhe de configuração que ninguém acha.
 *
 * O QUE ESTA TELA PROMETE, EXPLICITAMENTE: CSV, e não `.xlsx`. É promessa que
 * o app cumpre — CSV abre no Excel, no Google Sheets e no LibreOffice — em vez
 * de prometer um formato que exigiria 400 KB de biblioteca para um botão tocado
 * uma vez por semestre. A tela DIZ isso em palavras, porque "exportar para
 * Excel" e receber um `.csv` sem aviso é o tipo de surpresa que parece defeito.
 *
 * O DOWNLOAD NÃO PASSA PELO SERVIDOR. O dado já está no navegador; mandá-lo
 * para uma rota nossa só para voltar significaria o extrato inteiro do cliente
 * trafegando de novo e passando por logs de uma máquina que não precisava
 * tê-lo visto. Ver `baixarCsv`.
 *
 * O EXPURGO DA LIXEIRA ACONTECE AO ABRIR ESTA TELA. É de propósito que não haja
 * cron no banco: rotina que apaga dado de produção de madrugada é a que ninguém
 * lembra que existe. Aqui ela roda com o dono olhando para a lixeira, e o que
 * some é só o que passou dos 30 dias.
 */
export default function DadosPage() {
  const [base, setBase] = useState<
    | (Dicionario & {
        lancamentos: Lancamento[];
        saldos: Record<string, number>;
        orcamentos: Orcamento[];
        metas: Meta[];
        aportes: Aporte[];
        investimentos: Investimento[];
      })
    | null
  >(null);
  const [lixeira, setLixeira] = useState<Lancamento[] | null>(null);
  const [semLixeira, setSemLixeira] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [confirmandoEsvaziar, setConfirmandoEsvaziar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const supabase = createClient();

      /* Tudo em paralelo, e a LIXEIRA à parte com `catch` próprio: o aditivo do
         soft delete pode não ter sido rodado ainda, e nesse caso a exportação —
         que não depende dele — precisa continuar funcionando. Um `Promise.all`
         só derrubaria a tela inteira por causa de uma função que falta. */
      const [dados, m, inv, orc] = await Promise.all([
        carregarBaseExportacao(),
        carregarMetas(),
        carregarInvestimentos(),
        supabase.from("fin_orcamentos").select("*"),
      ]);

      setBase({
        lancamentos: dados.lancamentos,
        contas: dados.contas,
        cartoes: dados.cartoes,
        categorias: dados.categorias,
        saldos: dados.saldos,
        /* Orçamento pode simplesmente não existir (é aditivo, `fincash_orcamento.sql`).
           Aqui isso não é erro: é uma exportação a menos, e o resto vale. */
        orcamentos: (orc.data ?? []) as Orcamento[],
        metas: m.metas,
        aportes: m.aportes,
        investimentos: inv,
      });

      try {
        /* Primeiro o expurgo, depois a lista: na ordem inversa a tela mostraria
           por um instante linhas que ela mesma acabou de apagar. */
        await expurgarLixeira();
        setLixeira(await carregarLixeira());
        setSemLixeira(false);
      } catch (e) {
        if (faltaTabela(e)) setSemLixeira(true);
        else throw e;
      }
    } catch (e) {
      setErro(faltaTabela(e) ? FALTA_SQL : (e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /* O quanto já foi guardado por meta, somando os aportes. A conta vive em
     `metas.ts` para o app inteiro; aqui só a repetimos no formato que o CSV
     pede — um mapa por id. */
  const guardado = useMemo(() => {
    if (!base) return {};
    const mapa: Record<string, number> = {};
    for (const meta of base.metas) mapa[meta.id] = meta.valor_inicial;
    for (const a of base.aportes) {
      if (!(a.meta_id in mapa)) continue;
      mapa[a.meta_id] += a.tipo === "resgate" ? -a.valor : a.valor;
    }
    return mapa;
  }, [base]);

  /**
   * As exportações disponíveis.
   *
   * Cada uma sabe QUANTAS linhas tem, e o número aparece no botão. Não é enfeite:
   * é a diferença entre baixar um arquivo e conferir que ele veio inteiro. Um
   * "Lançamentos (0)" na tela evita o download que a pessoa abriria vazio,
   * concluindo que a exportação está quebrada quando, na verdade, ela ainda não
   * lançou nada naquele mês.
   */
  const exportacoes = useMemo(() => {
    if (!base) return [];
    const dic: Dicionario = {
      contas: base.contas,
      cartoes: base.cartoes,
      categorias: base.categorias,
    };

    return [
      {
        chave: "lancamentos",
        titulo: "Lançamentos",
        detalhe: "Data, descrição, valor, categoria, subcategoria, conta ou cartão e estado.",
        Icone: FileSpreadsheet,
        quantos: base.lancamentos.length,
        gerar: () => csvLancamentos(base.lancamentos, dic),
      },
      {
        chave: "contas",
        titulo: "Contas",
        detalhe: "Com o saldo inicial e o saldo de hoje.",
        Icone: Landmark,
        quantos: base.contas.length,
        gerar: () => csvContas(base.contas, base.saldos),
      },
      {
        chave: "cartoes",
        titulo: "Cartões",
        detalhe: "Limite, fechamento, vencimento e a conta que paga a fatura.",
        Icone: CreditCard,
        quantos: base.cartoes.length,
        gerar: () => csvCartoes(base.cartoes, base.contas),
      },
      {
        chave: "categorias",
        titulo: "Categorias",
        detalhe: "Categorias e subcategorias, com o grupo 50/30/20.",
        Icone: FolderTree,
        quantos: base.categorias.length,
        gerar: () => csvCategorias(base.categorias),
      },
      {
        chave: "orcamento",
        titulo: "Orçamento",
        detalhe: "O que estava planejado, no fixo e mês a mês.",
        Icone: Wallet,
        quantos: base.orcamentos.length,
        gerar: () => csvOrcamento(base.orcamentos, base.categorias),
      },
      {
        chave: "metas",
        titulo: "Metas",
        detalhe: "Objetivo, guardado, quanto falta e prazo.",
        Icone: Target,
        quantos: base.metas.length,
        gerar: () => csvMetas(base.metas, guardado),
      },
      {
        chave: "investimentos",
        titulo: "Investimentos",
        detalhe: "Aplicado, valor atual e o rendimento em reais e em percentual.",
        Icone: TrendingUp,
        quantos: base.investimentos.length,
        gerar: () => csvInvestimentos(base.investimentos),
      },
    ];
  }, [base, guardado]);

  const baixar = useCallback((chave: string, conteudo: string) => {
    baixarCsv(nomeArquivo(chave), conteudo);
  }, []);

  /**
   * "Tudo": um arquivo por assunto, um atrás do outro.
   *
   * NÃO É UM ZIP porque zipar exige biblioteca, e não é um CSV único porque
   * lançamento, meta e investimento têm colunas diferentes — empilhá-los no
   * mesmo arquivo daria uma planilha que nenhuma ferramenta consegue ler como
   * tabela. São sete arquivos, e o navegador pergunta uma vez se permite vários
   * downloads.
   *
   * O INTERVALO ENTRE ELES não é superstição: disparados no mesmo tique, o
   * Chrome e o Safari descartam silenciosamente todos menos o primeiro, e a
   * pessoa fica com um arquivo achando que baixou sete.
   */
  const baixarTudo = useCallback(async () => {
    setOcupado("tudo");
    setRecado(null);
    try {
      for (const e of exportacoes) {
        baixar(e.chave, e.gerar());
        await new Promise((r) => setTimeout(r, 400));
      }
      setRecado(`${exportacoes.length} arquivos gerados.`);
    } finally {
      setOcupado(null);
    }
  }, [exportacoes, baixar]);

  const agir = useCallback(
    async (id: string, acao: () => Promise<void>) => {
      setOcupado(id);
      setRecado(null);
      try {
        await acao();
        setLixeira(await carregarLixeira());
      } catch (e) {
        setErro((e as Error).message);
      } finally {
        setOcupado(null);
      }
    },
    [],
  );

  const nomeCategoria = useMemo(() => {
    const mapa = new Map((base?.categorias ?? []).map((c: Categoria) => [c.id, c.nome]));
    return (id: string | null | undefined) => (id ? mapa.get(id) : undefined);
  }, [base]);

  if (carregando) return <Esqueleto forma="lista" />;
  if (erro === FALTA_SQL) return <AvisoSQL arquivo="fincash.sql" oQue="Esta tela" />;
  if (erro) return <AvisoErro mensagem={erro} />;

  return (
    <>
      <CabecalhoTela
        Icone={Database}
        chapeu="Seus dados"
        titulo="Dados"
        resumo="Leve tudo embora quando quiser, e recupere o que apagou sem querer."
      />

      {/* ── Exportar ──────────────────────────────────────────────────── */}
      <Bloco className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-primary">
              Exportar
            </h2>
            {/* A frase que evita o chamado de suporte: o formato é dito antes de
                a pessoa clicar, não depois de o arquivo cair na pasta. */}
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
              Arquivos <strong className="font-semibold text-primary">CSV</strong>,
              no formato brasileiro (ponto e vírgula, vírgula decimal). Abrem com
              dois cliques no Excel, no Google Sheets e no LibreOffice — e são
              gerados aqui no seu aparelho, sem passar pelos nossos servidores.
            </p>
          </div>
          <BotaoAcao
            Icone={Package}
            onClick={() => void baixarTudo()}
            desabilitado={ocupado !== null}
          >
            {ocupado === "tudo" ? "Gerando…" : "Baixar tudo"}
          </BotaoAcao>
        </div>

        {recado && (
          <p role="status" className="mt-3 text-xs font-semibold text-success-strong">
            {recado}
          </p>
        )}

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {exportacoes.map((e) => (
            <li key={e.chave}>
              <Bloco tom="gelo" elevacao="plano" className="flex h-full items-start gap-3 p-3.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ciano-forte"
                >
                  <e.Icone className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{e.titulo}</span>
                    <Pastilha tom={e.quantos > 0 ? "neutro" : "aviso"}>
                      {e.quantos === 1 ? "1 linha" : `${e.quantos} linhas`}
                    </Pastilha>
                  </span>
                  <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
                    {e.detalhe}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => baixar(e.chave, e.gerar())}
                  aria-label={`Baixar ${e.titulo} em CSV`}
                  className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary transition-colors hover:bg-accent-tint hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                >
                  <Download className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                </button>
              </Bloco>
            </li>
          ))}
        </ul>
      </Bloco>

      {/* ── Lixeira ───────────────────────────────────────────────────── */}
      <section className="mt-4">
        <Bloco className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-5">
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-primary">
                Lixeira
              </h2>
              <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
                Lançamento apagado fica aqui por {DIAS_NA_LIXEIRA} dias e não conta
                em saldo, projeção nem relatório. Depois disso ele some de vez.
              </p>
            </div>

            {(lixeira?.length ?? 0) > 0 &&
              (confirmandoEsvaziar ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void agir("esvaziar", async () => {
                        await esvaziarLixeira();
                        setConfirmandoEsvaziar(false);
                      })
                    }
                    disabled={ocupado !== null}
                    className="min-h-11 rounded-xl bg-destructive px-3.5 text-xs font-bold text-white transition-colors hover:bg-destructive/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive disabled:opacity-50"
                  >
                    Apagar os {lixeira?.length} de vez
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoEsvaziar(false)}
                    className="min-h-11 rounded-xl border border-border px-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {/* Exportar ANTES de esvaziar, lado a lado: é a saída para quem
                      quer limpar a lista mas guardar o registro do que apagou. */}
                  <BotaoAcao
                    Icone={Download}
                    variante="contorno"
                    tamanho="sm"
                    onClick={() =>
                      baixar(
                        "lixeira",
                        csvLixeira(lixeira ?? [], {
                          contas: base?.contas ?? [],
                          cartoes: base?.cartoes ?? [],
                          categorias: base?.categorias ?? [],
                        }),
                      )
                    }
                  >
                    Exportar
                  </BotaoAcao>
                  <BotaoAcao
                    Icone={Trash2}
                    variante="contorno"
                    tamanho="sm"
                    onClick={() => setConfirmandoEsvaziar(true)}
                  >
                    Esvaziar
                  </BotaoAcao>
                </span>
              ))}
          </div>

          {semLixeira ? (
            <div className="px-5 pb-5">
              <AvisoSQL arquivo="fincash_lixeira.sql" oQue="A lixeira" />
            </div>
          ) : (lixeira?.length ?? 0) === 0 ? (
            <div className="px-5 pb-5">
              <Vazio
                Icone={PiggyBank}
                titulo="Nada apagado"
                texto={`O que você apagar aparece aqui e pode voltar por ${DIAS_NA_LIXEIRA} dias.`}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {(lixeira ?? []).map((l) => (
                <li key={l.id}>
                  <LinhaDaLixeira
                    lancamento={l}
                    quando={quandoFoi(l.apagado_em)}
                    categoria={nomeCategoria(l.categoria_id)}
                    ocupado={ocupado !== null}
                    aoRestaurar={() =>
                      void agir(l.id, () => restaurarLancamento(l.id))
                    }
                    aoApagar={() => void agir(l.id, () => apagarDeVez(l.id))}
                  />
                </li>
              ))}
            </ul>
          )}
        </Bloco>
      </section>
    </>
  );
}

/**
 * "hoje", "ontem", "há 3 dias" — e o prazo junto quando ele aperta.
 *
 * Data absoluta ("10/09/2026") não responde a pergunta que se faz olhando para
 * uma lixeira, que é "ainda dá tempo?". O tempo relativo responde, e a partir do
 * 25º dia a frase muda para dizer quantos dias restam: é quando a informação
 * deixa de ser curiosidade e vira prazo.
 */
function quandoFoi(iso: string | null | undefined): string {
  if (!iso) return "";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  const restam = DIAS_NA_LIXEIRA - dias;

  const passado =
    dias <= 0 ? "apagado hoje" : dias === 1 ? "apagado ontem" : `apagado há ${dias} dias`;

  if (restam <= 5) {
    return `${passado} · ${restam <= 0 ? "some hoje" : `some em ${restam} dia${restam === 1 ? "" : "s"}`}`;
  }
  return passado;
}
