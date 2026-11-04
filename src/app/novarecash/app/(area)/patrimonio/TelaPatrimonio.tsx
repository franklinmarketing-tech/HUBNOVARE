"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Landmark, Pencil, PiggyBank, Plus, Scale, Trash2, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ErroDados, comSaldos, dataCurta, hojeNoBrasil, lerContas, usuarioDaSessao, type ContaComSaldo } from "@/lib/novarecash/dados";
import { ErroBanco, listarInvestimentos, type InvestimentoBanco } from "@/lib/novarecash/openfinance";
import { lerValor } from "@/lib/novarecash/importar";
import {
  CLASSES_INVESTIMENTO,
  apagarInvestimento,
  lerInvestimentos,
  montarPatrimonio,
  rotuloDaClasse,
  salvarInvestimento,
  type ClasseInvestimento,
  type Investimento,
} from "@/lib/novarecash/patrimonio";
import { AvisoSemTabelaExtras } from "../AvisoExtras";
import { AvisoModoEquipe, EmAtivacao } from "../EmAtivacao";
import { Janela } from "../Janela";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Barra,
  Botao,
  CAMPO,
  COR_SAIDA,
  Cartao,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  Vazio,
  brl,
} from "../pecas";

type Estado = "carregando" | "pronto" | "sem-tabela" | "erro";

const AVISO_CVM =
  "O NovareCash mostra e soma o que você tem. Ele não recomenda nenhum ativo, produto ou corretora, nem sugere comprar ou vender: a divisão por classe é só um retrato.";

export function TelaPatrimonio({
  bancoLiberado,
  modoEquipe,
  liberaEm,
}: {
  bancoLiberado: boolean;
  modoEquipe: boolean;
  liberaEm: string | null;
}) {
  const sb = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [uid, setUid] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaComSaldo[]>([]);
  const [manuais, setManuais] = useState<Investimento[]>([]);
  const [semTabelaInvest, setSemTabelaInvest] = useState(false);
  const [doBanco, setDoBanco] = useState<InvestimentoBanco[]>([]);
  const [erroBanco, setErroBanco] = useState<string | null>(null);
  const [editando, setEditando] = useState<Investimento | "novo" | null>(null);
  const [apagar, setApagar] = useState<Investimento | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    setErroBanco(null);
    try {
      const eu = await usuarioDaSessao(sb);
      setUid(eu);
      const cs = await comSaldos(sb, eu, await lerContas(sb, eu));
      setContas(cs);

      try {
        setManuais(await lerInvestimentos(sb, eu));
        setSemTabelaInvest(false);
      } catch (e) {
        if (!(e instanceof ErroDados && e.motivo === "sem-tabela")) throw e;
        setManuais([]);
        setSemTabelaInvest(true);
      }

      if (bancoLiberado) {
        try {
          setDoBanco(await listarInvestimentos());
        } catch (e) {
          setDoBanco([]);
          setErroBanco(e instanceof ErroBanco ? e.message : "Não consegui ler os investimentos do banco agora.");
        }
      }
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb, bancoLiberado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const p = useMemo(() => montarPatrimonio(contas, manuais, doBanco), [contas, manuais, doBanco]);

  async function confirmarApagar() {
    if (!uid || !apagar) return;
    try {
      await apagarInvestimento(sb, uid, apagar.id);
      setManuais((l) => l.filter((x) => x.id !== apagar.id));
      setApagar(null);
    } catch {
      setApagar(null);
      setRecado("Não consegui apagar agora. Tente de novo em instantes.");
    }
  }

  if (estado === "carregando") return <Esqueleto linhas={3} />;
  if (estado === "sem-tabela") return <AvisoSemTabela />;
  if (estado === "erro") return <AvisoErro mensagem="Não consegui montar o seu patrimônio agora. Nada se perdeu." onTentar={carregar} />;

  const vazio = p.ativos.length === 0 && p.dividas.length === 0;
  const manualDe = new Map(manuais.map((i) => [`m-${i.id}`, i]));

  return (
    <div className="space-y-4">
      {modoEquipe && <AvisoModoEquipe liberaEm={liberaEm ?? undefined} />}

      {recado && (
        <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
          {recado}
        </p>
      )}

      {vazio ? (
        <Vazio
          Icone={PiggyBank}
          titulo="Seu patrimônio aparece aqui"
          texto="Informe o saldo das suas contas no Extrato (em Minhas contas) e lance os seus investimentos. O NovareCash soma tudo e desconta as faturas em aberto."
        >
          <Botao Icone={Plus} onClick={() => setEditando("novo")} desabilitado={semTabelaInvest}>
            Lançar um investimento
          </Botao>
          <Botao variante="contorno" Icone={Wallet} href="/novarecash/app/extrato?contas=1">
            Informar saldo das contas
          </Botao>
        </Vazio>
      ) : (
        <>
          <Cartao className="p-5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-white/60">Patrimônio líquido</p>
            <p className={`mt-1 font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] ${p.liquido < 0 ? COR_SAIDA : "text-white"}`}>
              {brl(p.liquido)}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
              <div className="min-w-0">
                <dt className="text-white/60">O que você tem</dt>
                <dd className="truncate font-semibold tabular-nums text-white">{brl(p.totalAtivos)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-white/60">O que você deve</dt>
                <dd className={`truncate font-semibold tabular-nums ${p.totalDividas > 0 ? COR_SAIDA : "text-white"}`}>
                  {brl(p.totalDividas)}
                </dd>
              </div>
            </dl>
            {p.semSaldo.length > 0 && (
              <p className="mt-2 text-2xs leading-relaxed text-white/55">
                Sem saldo conhecido, fora da soma: {p.semSaldo.join(", ")}.
              </p>
            )}
          </Cartao>

          {p.porClasse.length > 0 && (
            <Cartao className="p-4 sm:p-5">
              <h2 className="font-display text-base font-semibold text-white">Divisão por classe</h2>
              <ul className="mt-3 space-y-3">
                {p.porClasse.map((c) => (
                  <li key={c.chave}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-white/90">{c.rotulo}</span>
                      <span className="shrink-0 tabular-nums text-white">
                        {brl(c.total)} <span className="text-xs text-white/60">· {Math.round(c.fracao * 100)}%</span>
                      </span>
                    </div>
                    <div className="mt-1">
                      <Barra fracao={c.fracao} tom="ouro" />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-white/60">
                <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ciano-claro" />
                {AVISO_CVM}
              </p>
            </Cartao>
          )}

          {p.ativos.length > 0 && (
            <section aria-labelledby="pat-tem">
              <h2 id="pat-tem" className="mb-1.5 px-1 text-2xs font-semibold uppercase tracking-wider text-white/55">
                O que você tem
              </h2>
              <Cartao>
                <ul className="divide-y divide-white/[0.07]">
                  {p.ativos.map((a) => {
                    const manual = manualDe.get(a.chave);
                    return (
                      <li key={a.chave} className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-white">{a.nome}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <Selo tom={a.classe === "conta" ? "ciano" : "ouro"}>{rotuloDaClasse(a.classe)}</Selo>
                            <span className="text-2xs text-white/55">
                              {a.detalhe}
                              {manual ? ` · valor de ${dataCurta(manual.data)}` : ""}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-white">{brl(a.valor)}</span>
                        {manual && (
                          <button
                            type="button"
                            onClick={() => setEditando(manual)}
                            aria-label={`Editar ${manual.nome}`}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Cartao>
            </section>
          )}

          {p.dividas.length > 0 && (
            <section aria-labelledby="pat-deve">
              <h2 id="pat-deve" className="mb-1.5 px-1 text-2xs font-semibold uppercase tracking-wider text-white/55">
                O que você deve
              </h2>
              <Cartao>
                <ul className="divide-y divide-white/[0.07]">
                  {p.dividas.map((d) => (
                    <li key={d.chave} className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-white">{d.nome}</p>
                        <p className="text-2xs text-white/55">{d.detalhe}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${COR_SAIDA}`}>− {brl(d.valor)}</span>
                    </li>
                  ))}
                </ul>
              </Cartao>
            </section>
          )}
        </>
      )}

      {/* Investimentos à mão */}
      {semTabelaInvest ? (
        <AvisoSemTabelaExtras oQue="O lançamento de investimentos" />
      ) : (
        !vazio && (
          <div className="flex flex-wrap gap-2">
            <Botao Icone={Plus} onClick={() => setEditando("novo")}>
              Lançar investimento
            </Botao>
          </div>
        )
      )}

      {/* Investimentos do banco (Open Finance) */}
      {bancoLiberado ? (
        erroBanco ? (
          <p className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
            Investimentos do banco: {erroBanco} O resto do patrimônio está certo.
          </p>
        ) : doBanco.length === 0 ? (
          <p className="flex items-start gap-2 text-2xs leading-relaxed text-white/60">
            <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ciano-claro" />
            Nenhum investimento veio do banco. Conecte uma conta em Banco para eles entrarem sozinhos, ou lance à mão.
          </p>
        ) : null
      ) : (
        <EmAtivacao titulo="Investimentos pelo banco" liberaEm={liberaEm ?? undefined}>
          Quando liberar, os investimentos das contas conectadas pelo Open Finance entram aqui sozinhos. Enquanto isso,
          lance os seus à mão.
        </EmAtivacao>
      )}

      {editando && uid && (
        <FormInvestimento
          inicial={editando === "novo" ? null : editando}
          onFechar={() => setEditando(null)}
          onApagar={editando === "novo" ? undefined : () => {
            setApagar(editando);
            setEditando(null);
          }}
          onSalvar={async (d) => {
            await salvarInvestimento(sb, uid, d, editando === "novo" ? undefined : editando.id);
            setEditando(null);
            setManuais(await lerInvestimentos(sb, uid));
          }}
        />
      )}

      {apagar && (
        <Janela titulo="Apagar este investimento?" onFechar={() => setApagar(null)}>
          <p className="break-words text-sm leading-relaxed text-white/80">
            <strong className="text-white">{apagar.nome}</strong> ({brl(apagar.valor)}) sai do seu patrimônio. Isso não
            mexe em nada no banco ou na corretora.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Botao variante="fantasma" onClick={() => setApagar(null)}>
              Manter
            </Botao>
            <Botao variante="perigo" Icone={Trash2} onClick={confirmarApagar}>
              Apagar
            </Botao>
          </div>
        </Janela>
      )}
    </div>
  );
}

function FormInvestimento({
  inicial,
  onFechar,
  onSalvar,
  onApagar,
}: {
  inicial: Investimento | null;
  onFechar: () => void;
  onSalvar: (d: Omit<Investimento, "id">) => Promise<void>;
  onApagar?: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [classe, setClasse] = useState<ClasseInvestimento>(inicial?.classe ?? "renda_fixa");
  const [instituicao, setInstituicao] = useState(inicial?.instituicao ?? "");
  const [valor, setValor] = useState(inicial ? inicial.valor.toFixed(2).replace(".", ",") : "");
  const [data, setData] = useState(inicial?.data ?? hojeNoBrasil());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const v = lerValor(valor, valor.includes(",") || !valor.includes(".") ? "," : ".");
    if (!nome.trim()) return setErro("Dê um nome, como “CDB do banco X” ou “Tesouro Selic”.");
    if (v === null || v < 0) return setErro("Confira o valor: use só números, como 1.500,00.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return setErro("Confira a data.");
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar({ nome: nome.trim(), classe, instituicao: instituicao.trim() || null, valor: Math.abs(v), data });
    } catch {
      setErro("Não consegui salvar agora. Tente de novo em instantes.");
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={inicial ? "Editar investimento" : "Lançar investimento"} onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-3">
        <label className="block">
          <span className={ROTULO_CAMPO}>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Ex.: Tesouro Selic 2029" className={`${CAMPO} mt-1`} />
        </label>
        <label className="block">
          <span className={ROTULO_CAMPO}>Classe</span>
          <select value={classe} onChange={(e) => setClasse(e.target.value as ClasseInvestimento)} className={`${CAMPO} mt-1`}>
            {CLASSES_INVESTIMENTO.map((c) => (
              <option key={c.chave} value={c.chave}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={ROTULO_CAMPO}>Onde está (opcional)</span>
          <input value={instituicao} onChange={(e) => setInstituicao(e.target.value)} maxLength={60} placeholder="Banco ou corretora" className={`${CAMPO} mt-1`} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor atual (R$)</span>
            <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="0,00" className={`${CAMPO} mt-1`} />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor de</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        </div>
        <p className="text-2xs leading-relaxed text-white/60">
          Use o valor que aparece hoje no extrato do banco ou da corretora. Atualize quando quiser.
        </p>
        {erro && <p className="text-xs text-warning-claro">{erro}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {onApagar ? (
            <Botao variante="perigo" Icone={Trash2} onClick={onApagar}>
              Apagar
            </Botao>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Botao variante="fantasma" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" Icone={Check} desabilitado={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Botao>
          </div>
        </div>
      </form>
    </Janela>
  );
}
