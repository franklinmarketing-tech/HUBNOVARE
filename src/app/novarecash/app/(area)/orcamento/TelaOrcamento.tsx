"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Target } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { parseNumero } from "@/lib/calculos";
import { NAO_E_GASTO, todasAsCategorias, type CategoriaCustom } from "@/lib/novarecash/categorias";
import { lerCategoriasCustomOuNada } from "@/lib/novarecash/ajustes";
import {
  ErroDados,
  hojeNoBrasil,
  lerOrcamentos,
  lerTransacoesDoMes,
  linhasDoOrcamento,
  nomeDoMes,
  removerOrcamento,
  salvarOrcamento,
  totalPorCategoria,
  usuarioDaSessao,
  type LinhaOrcamento,
  type Orcamento,
  type TotalCategoria,
} from "@/lib/novarecash/dados";
import { Janela } from "../Janela";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Barra,
  Botao,
  CAMPO,
  Cartao,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  Vazio,
  brl,
} from "../pecas";
import { Toast, useToast } from "../Toast";

type Estado = "carregando" | "pronto" | "sem-tabela" | "erro";
type Editando = { chave: string; rotulo: string; limite: number | null; gasto: number };

export function TelaOrcamento() {
  const sb = useMemo(() => createClient(), []);
  const ref = hojeNoBrasil().slice(0, 7);
  const [uid, setUid] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [gastos, setGastos] = useState<TotalCategoria[]>([]);
  const [editando, setEditando] = useState<Editando | null>(null);
  const toast = useToast();
  // Categorias personalizadas (Ajustes). Sem a tabela, segue só com as fixas.
  const [custom, setCustom] = useState<CategoriaCustom[]>([]);
  const todas = useMemo(() => todasAsCategorias(custom, { incluirArquivadas: true }), [custom]);

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setEstado("carregando");
      try {
        const eu = await usuarioDaSessao(sb);
        setUid(eu);
        const [os, ts, cat] = await Promise.all([
          lerOrcamentos(sb, eu),
          lerTransacoesDoMes(sb, eu, ref),
          lerCategoriasCustomOuNada(sb, eu),
        ]);
        setCustom(cat);
        setOrcamentos(os);
        setGastos(totalPorCategoria(ts, "saida"));
        setEstado("pronto");
      } catch (e) {
        setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
      }
    },
    [sb, ref],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Pagamento de fatura, transferências e aplicações não são gasto (NAO_E_GASTO): não têm limite.
  const linhas = useMemo(() => linhasDoOrcamento(orcamentos, gastos, todas), [orcamentos, gastos, todas]);
  const comLimite = new Set(linhas.map((l) => l.chave));
  const gastoDe = new Map(gastos.map((g) => [g.chave, g.total]));
  // As de saída ativas, com as personalizadas (arquivada não ganha limite novo).
  const semLimite = todasAsCategorias(custom)
    .filter((c) => c.tipo === "saida" && !NAO_E_GASTO.has(c.chave) && !comLimite.has(c.chave))
    .map((c) => ({ chave: c.chave, rotulo: c.rotulo, gasto: gastoDe.get(c.chave) ?? 0 }))
    .sort((a, b) => b.gasto - a.gasto);

  const orcado = linhas.reduce((t, l) => t + l.limite, 0);
  const gastoOrcado = linhas.reduce((t, l) => t + l.gasto, 0);
  const estouradas = linhas.filter((l) => l.nivel === "estourou").length;
  const atencao = linhas.filter((l) => l.nivel === "atencao").length;

  if (estado === "carregando") return <Esqueleto linhas={4} />;
  if (estado === "sem-tabela") return <AvisoSemTabela />;
  if (estado === "erro") {
    return <AvisoErro mensagem="Não consegui ler o orçamento agora. Tente de novo em instantes." onTentar={() => carregar()} />;
  }

  return (
    <div className="space-y-4">
      {linhas.length === 0 ? (
        <Vazio
          Icone={Target}
          titulo="Nenhum limite ainda"
          texto="Escolha uma categoria abaixo e toque em “+ Limite”. Comece pelas que mais pesam: o quanto já saiu em cada uma neste mês está ao lado do nome."
        />
      ) : (
        <Cartao className="p-5">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">{nomeDoMes(ref)}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-white">
            {brl(gastoOrcado)} <span className="text-base font-medium text-white/60">de {brl(orcado)}</span>
          </p>
          <div className="mt-3">
            <Barra
              fracao={orcado > 0 ? gastoOrcado / orcado : 0}
              tom={gastoOrcado > orcado ? "perigo" : gastoOrcado > orcado * 0.8 ? "alerta" : "ouro"}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {estouradas > 0 && (
              <Selo tom="perigo">
                <AlertTriangle className="h-3 w-3" />
                {estouradas} {estouradas === 1 ? "estourou" : "estouraram"}
              </Selo>
            )}
            {atencao > 0 && (
              <Selo tom="alerta">
                {atencao} perto do limite
              </Selo>
            )}
            {estouradas === 0 && atencao === 0 && <Selo tom="verde">Tudo dentro do limite</Selo>}
          </div>
        </Cartao>
      )}

      {linhas.length > 0 && (
        <section aria-labelledby="titulo-com-limite">
          <h2 id="titulo-com-limite" className="mb-2 font-display text-base font-semibold text-white">
            Com limite
          </h2>
          <Cartao>
            <ul className="divide-y divide-white/[0.07]">
              {linhas.map((l) => (
                <LinhaComLimite
                  key={l.chave}
                  l={l}
                  onEditar={() => setEditando({ chave: l.chave, rotulo: l.rotulo, limite: l.limite, gasto: l.gasto })}
                />
              ))}
            </ul>
          </Cartao>
        </section>
      )}

      <section aria-labelledby="titulo-sem-limite">
        <h2 id="titulo-sem-limite" className="mb-2 font-display text-base font-semibold text-white">
          Sem limite
        </h2>
        <Cartao>
          <ul className="divide-y divide-white/[0.07]">
            {semLimite.map((c) => (
              <li key={c.chave} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">{c.rotulo}</span>
                  <span className="block text-2xs text-white/55">
                    {c.gasto > 0 ? `${brl(c.gasto)} neste mês` : "Nada neste mês"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditando({ ...c, limite: null })}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white hover:border-ouro/50 ${ANEL}`}
                >
                  <Plus className="h-3.5 w-3.5 text-ouro" /> Limite
                </button>
              </li>
            ))}
          </ul>
        </Cartao>
      </section>

      {editando && uid && (
        <FormLimite
          editando={editando}
          onFechar={() => setEditando(null)}
          onSalvar={async (limite) => {
            if (limite === null) await removerOrcamento(sb, uid, editando.chave);
            else await salvarOrcamento(sb, uid, editando.chave, limite);
            setEditando(null);
            toast.mostrar({
              texto: limite === null ? `${editando.rotulo}: limite retirado.` : `${editando.rotulo}: limite de ${brl(limite)} por mês.`,
            });
            await carregar(true);
          }}
        />
      )}

      <Toast {...toast} />
    </div>
  );
}

function LinhaComLimite({ l, onEditar }: { l: LinhaOrcamento; onEditar: () => void }) {
  const tom = l.nivel === "estourou" ? "perigo" : l.nivel === "atencao" ? "alerta" : "ciano";
  const resta = l.limite - l.gasto;
  return (
    <li className="px-3 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-white">{l.rotulo}</span>
            <span className="shrink-0 text-xs tabular-nums text-white/70">
              <strong className="font-semibold text-white">{brl(l.gasto)}</strong> de {brl(l.limite)}
            </span>
          </div>
          <div className="mt-1.5">
            <Barra fracao={l.fracao} tom={tom} />
          </div>
          <p
            className={`mt-1 text-2xs font-semibold ${
              l.nivel === "estourou" ? "text-accent-claro" : l.nivel === "atencao" ? "text-warning-claro" : "text-white/60"
            }`}
          >
            {l.nivel === "estourou"
              ? `Passou do limite em ${brl(-resta)}`
              : l.nivel === "atencao"
                ? `Atenção: ${Math.round(l.fracao * 100)}% usado, restam ${brl(resta)}`
                : `Restam ${brl(resta)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Mudar o limite de ${l.rotulo}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function FormLimite({
  editando,
  onFechar,
  onSalvar,
}: {
  editando: Editando;
  onFechar: () => void;
  onSalvar: (limite: number | null) => Promise<void>;
}) {
  const [valor, setValor] = useState(editando.limite != null ? editando.limite.toFixed(2).replace(".", ",") : "");
  // Um ponto de partida: o que já saiu no mês, arredondado para cima (a pessoa ajusta).
  const sugestao = editando.gasto > 0 ? Math.ceil(editando.gasto / 50) * 50 : null;
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(limite: number | null) {
    setErro(null);
    setSalvando(true);
    try {
      await onSalvar(limite);
    } catch {
      setErro("Não consegui salvar agora. Tente de novo.");
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={`Limite de ${editando.rotulo}`} onFechar={onFechar}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const v = Math.round(parseNumero(valor) * 100) / 100;
          if (!(v > 0)) return setErro("Informe um limite maior que zero.");
          enviar(v);
        }}
      >
        <label className="block">
          <span className={ROTULO_CAMPO}>Limite por mês (R$)</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            data-autofoco=""
            className={`${CAMPO} mt-1 tabular-nums`}
          />
          <span className="mt-1 block text-2xs text-white/55">
            Neste mês você já gastou {brl(editando.gasto)} em {editando.rotulo.toLowerCase()}. O limite vale para todo mês
            até você mudar.
          </span>
        </label>
        {sugestao !== null && editando.limite == null && (
          <button
            type="button"
            onClick={() => setValor(sugestao.toFixed(2).replace(".", ","))}
            className={`-mt-2 min-h-11 rounded-full px-3.5 text-xs font-semibold text-ouro ring-1 ring-inset ring-ouro/40 hover:bg-ouro/[0.08] ${ANEL}`}
          >
            Usar {brl(sugestao)} (o que já saiu, arredondado)
          </button>
        )}

        {erro && (
          <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {editando.limite != null ? (
            <Botao variante="perigo" onClick={() => enviar(null)} desabilitado={salvando}>
              Tirar o limite
            </Botao>
          ) : (
            <span />
          )}
          <Botao type="submit" desabilitado={salvando}>
            {salvando ? "Salvando…" : "Salvar limite"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}
