"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Check, Pencil, Plus, Tags } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { CategoriaCustom } from "@/lib/novarecash/categorias";
import { ErroDados, usuarioDaSessao } from "@/lib/novarecash/dados";
import {
  arquivarCategoriaCustom,
  criarCategoriaCustom,
  lerCategoriasCustom,
  renomearCategoriaCustom,
} from "@/lib/novarecash/ajustes";
import { AvisoSemTabelaExtras } from "../AvisoExtras";
import { Janela } from "../Janela";
import { ANEL, AvisoErro, Botao, CAMPO, Cartao, Esqueleto, ROTULO_CAMPO, Selo } from "../pecas";

/**
 * CATEGORIAS PERSONALIZADAS: além da lista fixa do app, as que a pessoa cria
 * (`ncash_categorias_custom`, chave `c_<slug>`). Criar, renomear e arquivar.
 *
 * Não há "apagar": um lançamento antigo pode estar na categoria, e apagá-la o
 * deixaria apontando para nada. Arquivar tira dos seletores e preserva o nome.
 */

type Estado = "carregando" | "pronto" | "sem-tabela" | "erro";

export function CategoriasPersonalizadas() {
  const sb = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [uid, setUid] = useState<string | null>(null);
  const [lista, setLista] = useState<CategoriaCustom[]>([]);
  const [nova, setNova] = useState("");
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [ocupado, setOcupado] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [editando, setEditando] = useState<CategoriaCustom | null>(null);
  const [verArquivadas, setVerArquivadas] = useState(false);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    try {
      const eu = await usuarioDaSessao(sb);
      setUid(eu);
      setLista(await lerCategoriasCustom(sb, eu));
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setOcupado(true);
    setRecado(null);
    try {
      const r = await criarCategoriaCustom(sb, uid, nova, tipo, lista);
      if (!r.ok) setRecado(r.mensagem);
      else {
        setNova("");
        setLista(await lerCategoriasCustom(sb, uid));
      }
    } catch {
      setRecado("Não consegui criar agora. Tente de novo em instantes.");
    } finally {
      setOcupado(false);
    }
  }

  async function arquivar(c: CategoriaCustom, arquivada: boolean) {
    if (!uid) return;
    setLista((l) => l.map((x) => (x.chave === c.chave ? { ...x, arquivada } : x)));
    try {
      await arquivarCategoriaCustom(sb, uid, c.chave, arquivada);
    } catch {
      setLista((l) => l.map((x) => (x.chave === c.chave ? c : x)));
      setRecado("Não consegui mudar agora. Tente de novo em instantes.");
    }
  }

  if (estado === "carregando") return <Esqueleto linhas={2} />;
  if (estado === "sem-tabela") return <AvisoSemTabelaExtras oQue="As categorias personalizadas" />;
  if (estado === "erro") return <AvisoErro mensagem="Não consegui ler as suas categorias agora." onTentar={carregar} />;

  const ativas = lista.filter((c) => !c.arquivada);
  const arquivadas = lista.filter((c) => c.arquivada);
  const visiveis = verArquivadas ? arquivadas : ativas;

  return (
    <Cartao className="p-4 sm:p-5">
      <form onSubmit={criar} className="grid gap-2 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
        <label className="block">
          <span className={ROTULO_CAMPO}>Nova categoria</span>
          <input
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            maxLength={40}
            placeholder="Ex.: Pet, Academia, Filhos"
            className={`${CAMPO} mt-1`}
          />
        </label>
        <label className="block">
          <span className={ROTULO_CAMPO}>Para</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value === "entrada" ? "entrada" : "saida")} className={`${CAMPO} mt-1`}>
            <option value="saida">Gastos (saída)</option>
            <option value="entrada">Entradas</option>
          </select>
        </label>
        <Botao type="submit" Icone={Plus} desabilitado={ocupado || !nova.trim()}>
          {ocupado ? "Criando…" : "Criar"}
        </Botao>
      </form>

      {recado && (
        <p role="status" className="mt-3 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
          {recado}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wider text-white/55">
          {verArquivadas ? "Arquivadas" : "Suas categorias"}
        </p>
        {arquivadas.length > 0 && (
          <button
            type="button"
            onClick={() => setVerArquivadas((v) => !v)}
            className={`min-h-11 rounded-lg px-2 text-xs font-semibold text-ouro hover:bg-white/[0.06] ${ANEL}`}
          >
            {verArquivadas ? "Ver as ativas" : `Ver arquivadas (${arquivadas.length})`}
          </button>
        )}
      </div>

      {visiveis.length === 0 ? (
        <div className="mt-2 flex items-start gap-3 rounded-xl border border-dashed border-white/15 p-4">
          <Tags className="mt-0.5 h-4 w-4 shrink-0 text-ouro" />
          <p className="text-xs leading-relaxed text-white/70">
            {verArquivadas
              ? "Nenhuma categoria arquivada."
              : "Você ainda usa só as categorias do app. Crie uma acima para separar o que é só seu, como “Pet” ou “Academia”: ela aparece na hora de escolher a categoria de um lançamento."}
          </p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-white/[0.07] rounded-xl border border-white/10">
          {visiveis.map((c) => (
            <li key={c.chave} className="flex items-center gap-2 px-3 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm text-white">{c.rotulo}</p>
                <Selo tom={c.tipo === "entrada" ? "verde" : "neutro"}>{c.tipo === "entrada" ? "Entrada" : "Gasto"}</Selo>
              </div>
              {!c.arquivada && (
                <button
                  type="button"
                  onClick={() => setEditando(c)}
                  aria-label={`Renomear ${c.rotulo}`}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/75 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => arquivar(c, !c.arquivada)}
                aria-label={c.arquivada ? `Voltar a usar ${c.rotulo}` : `Arquivar ${c.rotulo}`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/75 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
              >
                {c.arquivada ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-2xs leading-relaxed text-white/55">
        Arquivar tira a categoria das listas de escolha. O que já foi lançado nela continua com ela, e com o mesmo nome.
      </p>

      {editando && uid && (
        <Renomear
          c={editando}
          onFechar={() => setEditando(null)}
          onSalvar={async (rotulo) => {
            await renomearCategoriaCustom(sb, uid, editando.chave, rotulo);
            setLista((l) => l.map((x) => (x.chave === editando.chave ? { ...x, rotulo: rotulo.trim() } : x)));
            setEditando(null);
          }}
        />
      )}
    </Cartao>
  );
}

function Renomear({
  c,
  onFechar,
  onSalvar,
}: {
  c: CategoriaCustom;
  onFechar: () => void;
  onSalvar: (rotulo: string) => Promise<void>;
}) {
  const [rotulo, setRotulo] = useState(c.rotulo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Janela titulo="Renomear categoria" onFechar={onFechar}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!rotulo.trim()) return;
          setSalvando(true);
          setErro(null);
          try {
            await onSalvar(rotulo);
          } catch {
            setErro("Não consegui salvar agora. Tente de novo.");
            setSalvando(false);
          }
        }}
      >
        <label className="block">
          <span className={ROTULO_CAMPO}>Nome</span>
          <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} maxLength={40} className={`${CAMPO} mt-1`} />
        </label>
        <p className="mt-1.5 text-2xs text-white/60">Os lançamentos que já estão nela passam a mostrar o nome novo.</p>
        {erro && <p className="mt-2 text-xs text-warning-claro">{erro}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Botao variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" Icone={Check} desabilitado={salvando || !rotulo.trim()}>
            {salvando ? "Salvando…" : "Salvar"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}
