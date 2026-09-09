"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Ban,
  Check,
  CreditCard,
  FileUp,
  History,
  Landmark,
  Upload,
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
  brl,
} from "../pecas";
import { LinhaImportada } from "./LinhaImportada";
import { faltaTabela, FALTA_SQL } from "@/lib/fincash/erros";
import { ErroOfx, decodificarOfx, parseOfx, type ExtratoOfx } from "@/lib/fincash/ofx";
import {
  carregarDestinos,
  chavesJaImportadas,
  contarPrevia,
  gravarImportacao,
  listarImportacoes,
  montarPrevia,
  type Destinos,
  type Importacao,
  type LinhaPrevia,
} from "@/lib/fincash/importar";

/**
 * Importar extrato — a tela que decide se a pessoa continua no app.
 *
 * O ESTUDO DO CONCORRENTE foi direto ao ponto: sem importação, a primeira
 * semana é digitar 200 linhas à mão, e ninguém chega à segunda. Mas
 * importação MAL FEITA é pior que nenhuma, e são dois jeitos de fazer mal:
 *
 *   1. **Gravar sem mostrar.** Se o app engolir o arquivo e categorizar
 *      sozinho, um acerto de 80% vira 40 linhas erradas para corrigir uma a
 *      uma — mais trabalho do que digitar. Por isso a PRÉVIA é obrigatória: o
 *      arquivo é lido, a categoria é sugerida, e nada toca o banco até a
 *      pessoa clicar em importar.
 *
 *   2. **Duplicar.** Importar março no dia 20 e de novo no dia 30 tem de
 *      trazer só os dez dias novos. As repetidas continuam visíveis na lista,
 *      apagadas e explicadas — some-las deixaria a conta sem fechar e é aí que
 *      a pessoa desconfia que o app perdeu alguma coisa.
 *
 * O ARQUIVO É LIDO NO NAVEGADOR e nunca sobe. O extrato bruto tem agência,
 * conta e nome do titular; o que vai para o banco são as transações
 * confirmadas e o NOME do arquivo, nada mais. É a mesma decisão do scanner de
 * extratos, e vale repetir porque é a que se perde numa refatoração distraída.
 *
 * O DESTINO É ESCOLHIDO ANTES DE GRAVAR, e não adivinhado do `BANKID`: casar o
 * código 341 com a conta que a pessoa chamou de "Itaú" funciona até ela ter
 * duas contas no mesmo banco — e aí o extrato inteiro cai na conta errada, o
 * que é muito mais caro de desfazer do que um clique a mais.
 */
export default function ImportarPage() {
  const [destinos, setDestinos] = useState<Destinos | null>(null);
  const [historico, setHistorico] = useState<Importacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [arquivo, setArquivo] = useState<string | null>(null);
  const [extrato, setExtrato] = useState<ExtratoOfx | null>(null);
  const [linhas, setLinhas] = useState<LinhaPrevia[]>([]);
  const [destino, setDestino] = useState<string>(""); // "conta:<id>" | "cartao:<id>"
  const [lendo, setLendo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [feito, setFeito] = useState<{ importadas: number; ignoradas: number } | null>(
    null,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [d, h] = await Promise.all([carregarDestinos(), listarImportacoes()]);
      setDestinos(d);
      setHistorico(h);
      setErro(null);
      // Um destino só não é escolha, é a única possibilidade — a mesma regra
      // que o assistente de WhatsApp usa para não perguntar à toa.
      if (d.contas.length === 1 && d.cartoes.length === 0) {
        setDestino(`conta:${d.contas[0].id}`);
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

  /* O cartão escolhido, quando for cartão: é ele que diz em qual FATURA cada
     compra cai. A competência é a do VENCIMENTO, não a da compra (ver
     `faturas.ts`), e mostrar isso na prévia evita a pergunta "por que a compra
     de 28/03 foi parar em abril?". */
  const cartaoEscolhido = destino.startsWith("cartao:")
    ? (destinos?.cartoes.find((c) => c.id === destino.slice(7)) ?? null)
    : null;

  async function escolherArquivo(f: File) {
    setErroArquivo(null);
    setFeito(null);
    setLendo(true);
    try {
      // Bytes, e não `f.text()`: `text()` assume UTF-8 e estraga todo acento
      // dos arquivos em ISO-8859-1, que é o que boa parte dos bancos
      // brasileiros ainda exporta. Quem decide a codificação é `decodificarOfx`.
      const lido = parseOfx(decodificarOfx(await f.arrayBuffer()));
      const vistas = await chavesJaImportadas(lido.transacoes.map((t) => t.chave));

      setArquivo(f.name);
      setExtrato(lido);
      setLinhas(montarPrevia(lido, destinos?.categorias ?? [], vistas, cartaoEscolhido));
    } catch (e) {
      setArquivo(null);
      setExtrato(null);
      setLinhas([]);
      if (e instanceof ErroOfx) setErroArquivo(e.message);
      else if (faltaTabela(e)) setErro(FALTA_SQL);
      else setErroArquivo(`Não consegui ler o arquivo. ${(e as Error).message}`);
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  /* Trocar o destino para um cartão recalcula a fatura de cada linha. É
     recálculo puro, sem ida ao banco: as chaves já vistas não mudam. */
  useEffect(() => {
    if (!extrato || !destinos) return;
    setLinhas((atuais) => {
      const vistas = new Set(
        atuais.filter((l) => l.ignorada === "ja-importada").map((l) => l.transacao.chave),
      );
      const novas = montarPrevia(extrato, destinos.categorias, vistas, cartaoEscolhido);
      // Preserva o que a pessoa já marcou e recategorizou à mão.
      const antes = new Map(atuais.map((l) => [l.id, l]));
      return novas.map((n) => {
        const a = antes.get(n.id);
        return a ? { ...n, incluir: a.incluir, categoria_id: a.categoria_id, categoria_nome: a.categoria_nome } : n;
      });
    });
    // Só o destino: `linhas` na lista faria o efeito se realimentar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino]);

  async function confirmar() {
    if (!extrato || !arquivo || !destino) return;
    setGravando(true);
    try {
      const [tipo, id] = destino.split(":");
      const r = await gravarImportacao({
        arquivo,
        extrato,
        linhas,
        destino: tipo === "cartao" ? { cartao_id: id } : { conta_id: id },
      });
      setFeito({ importadas: r.importadas, ignoradas: r.ignoradas });
      setExtrato(null);
      setLinhas([]);
      setArquivo(null);
      setHistorico(await listarImportacoes());
    } catch (e) {
      setErroArquivo(
        faltaTabela(e)
          ? "As tabelas da importação ainda não existem no banco."
          : `Não consegui gravar. ${(e as Error).message}`,
      );
    } finally {
      setGravando(false);
    }
  }

  // ── Estados da tela ───────────────────────────────────────────────────────

  if (erro === FALTA_SQL) {
    return (
      <>
        <Cabecalho />
        <AvisoSQL arquivo="supabase/fincash_importacao.sql" oQue="A importação de extrato" />
      </>
    );
  }
  if (erro) {
    return (
      <>
        <Cabecalho />
        <AvisoErro mensagem={erro} />
      </>
    );
  }
  if (carregando) {
    return (
      <>
        <Cabecalho />
        <Esqueleto forma="lista" />
      </>
    );
  }

  const semDestino = (destinos?.contas.length ?? 0) + (destinos?.cartoes.length ?? 0) === 0;
  const placar = contarPrevia(linhas);

  return (
    <>
      <Cabecalho />

      {semDestino ? (
        <Vazio
          Icone={Landmark}
          titulo="Antes, cadastre onde o dinheiro está"
          texto="Um extrato precisa cair em alguma conta ou cartão. Sem isso, o app não sabe de onde o dinheiro saiu — e saldo sem origem não fecha."
          passos={[
            "Abra Contas e cadastre a conta do banco de onde vem o extrato.",
            "Volte aqui e escolha o arquivo .ofx.",
          ]}
          acao={<BotaoAcao href="/fincash/app/contas" Icone={Landmark}>Cadastrar conta</BotaoAcao>}
        />
      ) : (
        <div className="space-y-4">
          {/* ── 1. O arquivo ─────────────────────────────────────────────── */}
          <Bloco className="p-4 sm:p-5">
            <p className="font-display text-sm font-semibold text-primary">
              1. O arquivo do banco
            </p>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
              No aplicativo do seu banco, procure “exportar extrato” e escolha{" "}
              <strong className="font-semibold text-primary">OFX</strong> — às vezes
              aparece como “Money” ou “gerenciador financeiro”. O arquivo é lido aqui
              no seu navegador: ele não sobe para lugar nenhum.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                id="arquivo-ofx"
                type="file"
                accept=".ofx,.qfx,text/plain,application/x-ofx"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void escolherArquivo(f);
                }}
              />
              <label
                htmlFor="arquivo-ofx"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-primary transition-all hover:border-accent-soft hover:bg-gelo focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-ciano)]"
              >
                <FileUp className="h-4 w-4" strokeWidth={2.5} />
                {arquivo ? "Trocar arquivo" : "Escolher arquivo .ofx"}
              </label>

              {lendo && (
                <span role="status" className="text-xs text-muted-foreground">
                  Lendo o extrato…
                </span>
              )}
              {arquivo && !lendo && (
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  {arquivo}
                </span>
              )}
            </div>

            {erroArquivo && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2.5 rounded-2xl border border-destructive/25 bg-white p-4"
              >
                <Ban aria-hidden className="mt-px h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs leading-relaxed text-foreground">
                  <span className="font-semibold text-destructive">
                    Não deu para usar esse arquivo.{" "}
                  </span>
                  {erroArquivo}
                </p>
              </div>
            )}

            {feito && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-4"
              >
                <Check aria-hidden className="mt-px h-4 w-4 shrink-0 text-success-strong" />
                <p className="text-xs leading-relaxed text-foreground">
                  <span className="font-semibold text-success-strong">Pronto. </span>
                  {feito.importadas} lançamento{feito.importadas === 1 ? "" : "s"}{" "}
                  {feito.importadas === 1 ? "entrou" : "entraram"} no app
                  {feito.ignoradas > 0 && `; ${feito.ignoradas} já estavam lá ou você desmarcou`}.{" "}
                  <a
                    href="/fincash/app/lancamentos"
                    className="font-semibold text-accent-strong underline underline-offset-2"
                  >
                    Ver nos lançamentos
                  </a>
                </p>
              </div>
            )}
          </Bloco>

          {/* ── 2. O destino ─────────────────────────────────────────────── */}
          <Bloco className="p-4 sm:p-5">
            <p className="font-display text-sm font-semibold text-primary">
              2. Onde esse dinheiro entra
            </p>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
              Extrato de conta vai para a conta; fatura de cartão vai para o cartão — e
              aí cada compra cai na fatura do vencimento certo.
            </p>

            <label className="mt-3 block">
              <span className="sr-only">Conta ou cartão de destino</span>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="min-h-11 w-full max-w-sm rounded-xl border border-border bg-white px-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ciano)]"
              >
                <option value="">Escolha…</option>
                {(destinos?.contas ?? []).map((c) => (
                  <option key={c.id} value={`conta:${c.id}`}>
                    Conta · {c.nome}
                  </option>
                ))}
                {(destinos?.cartoes ?? []).map((c) => (
                  <option key={c.id} value={`cartao:${c.id}`}>
                    Cartão · {c.nome}
                  </option>
                ))}
              </select>
            </label>

            {extrato?.conta.cartao && !cartaoEscolhido && (
              <p className="mt-2 flex items-center gap-1.5 text-2xs text-accent-strong">
                <CreditCard aria-hidden className="h-3.5 w-3.5" />
                Esse arquivo parece um extrato de CARTÃO. Escolher um cartão aqui deixa
                as compras na fatura certa.
              </p>
            )}
          </Bloco>

          {/* ── 3. A prévia ──────────────────────────────────────────────── */}
          {extrato && (
            <Bloco className="overflow-hidden">
              <div className="border-b border-border/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-display text-sm font-semibold text-primary">
                    3. Confira antes de gravar
                  </p>
                  <p className="text-2xs text-muted-foreground tabular-nums">
                    {placar.total} no arquivo
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Pastilha tom="previsto">{placar.novas} novo(s)</Pastilha>
                  <Pastilha tom="neutro" Icone={Ban}>
                    {placar.repetidas} já no app
                  </Pastilha>
                  <Pastilha tom="pago">entram: {brl(placar.entradas)}</Pastilha>
                  <Pastilha tom="saida">saem: {brl(placar.saidas)}</Pastilha>
                  {placar.semCategoria > 0 && (
                    <Pastilha tom="aviso">
                      {placar.semCategoria} sem categoria
                    </Pastilha>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLinhas((l) =>
                        l.map((x) => (x.ignorada ? x : { ...x, incluir: true })),
                      )
                    }
                    className="min-h-11 rounded-xl border border-border px-3 text-2xs font-semibold text-primary transition-colors hover:bg-gelo"
                  >
                    Marcar todas as novas
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinhas((l) => l.map((x) => ({ ...x, incluir: false })))}
                    className="min-h-11 rounded-xl border border-border px-3 text-2xs font-semibold text-primary transition-colors hover:bg-gelo"
                  >
                    Desmarcar todas
                  </button>
                </div>
              </div>

              <ul className="max-h-[32rem] overflow-y-auto">
                {linhas.map((l) => (
                  <LinhaImportada
                    key={l.id}
                    linha={l}
                    categorias={destinos?.categorias ?? []}
                    aoMarcar={(incluir) =>
                      setLinhas((atual) =>
                        atual.map((x) => (x.id === l.id ? { ...x, incluir } : x)),
                      )
                    }
                    aoTrocarCategoria={(categoria_id) =>
                      setLinhas((atual) =>
                        atual.map((x) =>
                          x.id === l.id
                            ? {
                                ...x,
                                categoria_id,
                                categoria_nome:
                                  destinos?.categorias.find((c) => c.id === categoria_id)
                                    ?.nome ?? null,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-4 sm:p-5">
                <p className="text-xs text-muted-foreground">
                  {placar.marcadas === 0
                    ? "Nenhuma linha marcada."
                    : `${placar.marcadas} lançamento${placar.marcadas === 1 ? "" : "s"} vai${placar.marcadas === 1 ? "" : "o"} entrar.`}
                  {!destino && " Escolha a conta ou o cartão acima."}
                </p>
                <BotaoAcao
                  Icone={Upload}
                  onClick={() => void confirmar()}
                  desabilitado={gravando || placar.marcadas === 0 || !destino}
                >
                  {gravando ? "Importando…" : "Importar"}
                </BotaoAcao>
              </div>
            </Bloco>
          )}

          {/* ── Histórico ────────────────────────────────────────────────── */}
          {historico.length > 0 && (
            <Bloco className="p-4 sm:p-5">
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
                <History aria-hidden className="h-4 w-4" />
                O que você já importou
              </p>
              <ul className="mt-3 divide-y divide-border/60">
                {historico.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <span className="min-w-0 truncate text-xs text-foreground">
                      {h.arquivo}
                    </span>
                    <span className="shrink-0 text-2xs text-muted-foreground tabular-nums">
                      {h.importadas} entraram · {h.ignoradas} ignorados ·{" "}
                      {new Date(h.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            </Bloco>
          )}
        </div>
      )}
    </>
  );
}

function Cabecalho() {
  return (
    <CabecalhoTela
      chapeu="Importar"
      titulo="Extrato do banco"
      resumo="Traga o extrato em OFX e confira antes de gravar. O que já entrou uma vez não entra de novo."
      Icone={Upload}
    />
  );
}
