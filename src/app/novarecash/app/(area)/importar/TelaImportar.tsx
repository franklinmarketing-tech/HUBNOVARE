"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, FileUp, ListOrdered, RotateCcw, ShieldCheck, Upload } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { adivinharCategoria, todasAsCategorias, type CategoriaCustom } from "@/lib/novarecash/categorias";
import { ErroDados, dataCurta, lerContas, usuarioDaSessao, type Conta } from "@/lib/novarecash/dados";
import { lerCategoriasCustomOuNada } from "@/lib/novarecash/ajustes";
import {
  ErroArquivo,
  adivinharMapeamento,
  chavesJaImportadas,
  decodificar,
  desfazerImportacao,
  gravarImportacao,
  lerCsv,
  lerOfx,
  lerValor,
  lerData,
  linhasDoCsv,
  pareceOfx,
  ultimaImportacao,
  type FormatoArquivo,
  type Importacao,
  type LinhaLida,
  type Mapeamento,
  type TabelaCsv,
} from "@/lib/novarecash/importar";
import { AvisoSemTabelaExtras } from "../AvisoExtras";
import { Janela } from "../Janela";
import {
  ANEL,
  AvisoErro,
  Botao,
  CAMPO,
  COR_ENTRADA,
  Cartao,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  Vazio,
  brl,
} from "../pecas";

type Estado = "carregando" | "pronto" | "sem-tabela" | "erro";
type Etapa = "escolher" | "mapear" | "previa";

type LinhaPrevia = LinhaLida & { categoria: string; incluir: boolean; ja: boolean };

const LIMITE_BYTES = 5 * 1024 * 1024;
const POR_PAGINA = 100;

const dataCompleta = (iso: string) => `${dataCurta(iso)}/${iso.slice(2, 4)}`;

export function TelaImportar() {
  const sb = useMemo(() => createClient(), []);
  const entrada = useRef<HTMLInputElement>(null);

  const [estado, setEstado] = useState<Estado>("carregando");
  const [uid, setUid] = useState<string | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [custom, setCustom] = useState<CategoriaCustom[]>([]);
  const [ultima, setUltima] = useState<Importacao | null>(null);

  const [etapa, setEtapa] = useState<Etapa>("escolher");
  const [arquivo, setArquivo] = useState<{ nome: string; formato: FormatoArquivo } | null>(null);
  const [tabela, setTabela] = useState<TabelaCsv | null>(null);
  const [mapa, setMapa] = useState<Mapeamento | null>(null);
  const [linhas, setLinhas] = useState<LinhaPrevia[]>([]);
  const [ignoradas, setIgnoradas] = useState(0);
  const [destino, setDestino] = useState("");
  const [mostrar, setMostrar] = useState(POR_PAGINA);

  const [lendo, setLendo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [recado, setRecado] = useState<{ tom: "ok" | "aviso"; texto: string } | null>(null);
  const [confirmarDesfazer, setConfirmarDesfazer] = useState(false);
  const [desfazendo, setDesfazendo] = useState(false);

  const categorias = useMemo(() => todasAsCategorias(custom), [custom]);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    try {
      const eu = await usuarioDaSessao(sb);
      setUid(eu);
      const [cs, cat, ult] = await Promise.all([lerContas(sb, eu), lerCategoriasCustomOuNada(sb, eu), ultimaImportacao(sb, eu)]);
      setContas(cs);
      setCustom(cat);
      setUltima(ult);
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function recomecar() {
    setEtapa("escolher");
    setArquivo(null);
    setTabela(null);
    setMapa(null);
    setLinhas([]);
    setIgnoradas(0);
    setErroArquivo(null);
    setMostrar(POR_PAGINA);
  }

  /** Lido o arquivo, marca o que já entrou antes e dá o primeiro palpite de categoria. */
  async function montarPrevia(lidas: LinhaLida[], descartadas: number) {
    if (!uid) return;
    if (lidas.length === 0) {
      setErroArquivo("Não encontrei nenhuma linha com data e valor. Confira as colunas escolhidas.");
      return;
    }
    const ja = await chavesJaImportadas(sb, uid, lidas.filter((l) => !l.repetida).map((l) => l.externo_id));
    setLinhas(
      lidas.map((l) => {
        const jaEntrou = !l.repetida && ja.has(l.externo_id);
        return { ...l, categoria: adivinharCategoria(l.descricao, l.tipo), ja: jaEntrou, incluir: !jaEntrou && !l.repetida };
      }),
    );
    setIgnoradas(descartadas);
    setMostrar(POR_PAGINA);
    setEtapa("previa");
  }

  async function escolherArquivo(f: File) {
    setErroArquivo(null);
    setRecado(null);
    if (f.size > LIMITE_BYTES) {
      setErroArquivo("O arquivo passa de 5 MB. Peça ao banco um período menor (um ou dois meses).");
      return;
    }
    setLendo(true);
    try {
      // Bytes, não `f.text()`: muito banco exporta em Windows-1252 e o UTF-8 estragaria os acentos.
      const texto = decodificar(await f.arrayBuffer());
      if (pareceOfx(texto)) {
        const ofx = lerOfx(texto);
        setArquivo({ nome: f.name, formato: "ofx" });
        // Extrato de cartão: sugere o cartão, se houver exatamente um.
        const cartoes = contas.filter((c) => c.tipo === "cartao");
        if (ofx.cartao && cartoes.length === 1) setDestino(cartoes[0].id);
        await montarPrevia(ofx.linhas, 0);
      } else {
        if (/^%PDF/.test(texto)) throw new ErroArquivo("Esse arquivo é um PDF. No banco, exporte o extrato em OFX ou CSV.");
        const t = lerCsv(texto);
        setArquivo({ nome: f.name, formato: "csv" });
        setTabela(t);
        setMapa(adivinharMapeamento(t));
        setEtapa("mapear");
      }
    } catch (e) {
      setArquivo(null);
      if (e instanceof ErroArquivo) setErroArquivo(e.message);
      else if (e instanceof ErroDados && e.motivo === "sem-tabela") setEstado("sem-tabela");
      else setErroArquivo("Não consegui ler esse arquivo. Confira se é o extrato em OFX ou CSV e tente de novo.");
    } finally {
      setLendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function verPreviaCsv() {
    if (!tabela || !mapa) return;
    setLendo(true);
    setErroArquivo(null);
    try {
      const r = linhasDoCsv(tabela, mapa);
      await montarPrevia(r.linhas, r.ignoradas);
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") setEstado("sem-tabela");
      else setErroArquivo("Não consegui montar a prévia agora. Tente de novo.");
    } finally {
      setLendo(false);
    }
  }

  const escolhidas = linhas.filter((l) => l.incluir);
  const jaEstavam = linhas.filter((l) => l.ja).length;
  const repetidas = linhas.filter((l) => l.repetida).length;
  const disponiveis = linhas.filter((l) => !l.ja && !l.repetida);

  async function gravar() {
    if (!uid || !arquivo || escolhidas.length === 0) return;
    setGravando(true);
    setRecado(null);
    try {
      const r = await gravarImportacao(sb, uid, {
        arquivo: arquivo.nome,
        formato: arquivo.formato,
        contaId: destino || null,
        linhas: escolhidas.map(({ externo_id, data, descricao, valor, tipo, categoria }) => ({
          externo_id,
          data,
          descricao,
          valor,
          tipo,
          categoria,
        })),
      });
      recomecar();
      setRecado({
        tom: "ok",
        texto:
          r.gravadas === 0
            ? "Nada novo: esses lançamentos já estavam no seu extrato."
            : `${r.gravadas} ${r.gravadas === 1 ? "lançamento entrou" : "lançamentos entraram"} no seu extrato.`,
      });
      setUltima(await ultimaImportacao(sb, uid).catch(() => null));
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") setEstado("sem-tabela");
      else setRecado({ tom: "aviso", texto: "Não consegui gravar agora. Nada foi perdido: tente de novo em instantes." });
    } finally {
      setGravando(false);
    }
  }

  async function desfazer() {
    if (!uid || !ultima) return;
    setDesfazendo(true);
    try {
      const n = await desfazerImportacao(sb, uid, ultima.id);
      setConfirmarDesfazer(false);
      setRecado({ tom: "ok", texto: `Importação desfeita: ${n} ${n === 1 ? "lançamento saiu" : "lançamentos saíram"} do extrato.` });
      setUltima(await ultimaImportacao(sb, uid).catch(() => null));
    } catch {
      setConfirmarDesfazer(false);
      setRecado({ tom: "aviso", texto: "Não consegui desfazer agora. Tente de novo em instantes." });
    } finally {
      setDesfazendo(false);
    }
  }

  const marcar = (fn: (l: LinhaPrevia) => LinhaPrevia) => setLinhas((ls) => ls.map(fn));

  if (estado === "carregando") return <Esqueleto linhas={3} />;
  if (estado === "sem-tabela") return <AvisoSemTabelaExtras oQue="A importação de extrato" />;
  if (estado === "erro") {
    return <AvisoErro mensagem="Não consegui abrir a importação agora. O seu extrato continua guardado." onTentar={carregar} />;
  }

  const nomeConta = (id: string | null) => contas.find((c) => c.id === id)?.nome ?? "sem conta";

  return (
    <div className="space-y-4">
      {recado && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs ${
            recado.tom === "ok"
              ? "border-[hsl(152_55%_41%/0.4)] bg-[hsl(152_55%_41%/0.12)] text-[hsl(152_60%_62%)]"
              : "border-warning/35 bg-warning/10 text-warning-claro"
          }`}
        >
          {recado.texto}
        </p>
      )}

      {ultima && etapa === "escolher" && (
        <Cartao className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-white/55">Última importação</p>
            <p className="mt-0.5 break-words text-sm font-medium text-white">{ultima.arquivo}</p>
            <p className="text-2xs text-white/60">
              {ultima.quantas} {ultima.quantas === 1 ? "lançamento" : "lançamentos"} em {nomeConta(ultima.conta_id)} ·{" "}
              {new Date(ultima.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          </div>
          <Botao variante="perigo" Icone={RotateCcw} onClick={() => setConfirmarDesfazer(true)}>
            Desfazer
          </Botao>
        </Cartao>
      )}

      {etapa === "escolher" && (
        <>
          <Cartao className="p-5 sm:p-6">
            <input
              ref={entrada}
              type="file"
              accept=".ofx,.qfx,.csv,.txt,application/x-ofx,text/csv,text/plain"
              className="sr-only"
              id="arquivo-extrato"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) escolherArquivo(f);
              }}
            />
            <label
              htmlFor="arquivo-extrato"
              className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ouro/35 bg-ouro/[0.05] px-4 py-6 text-center transition-colors hover:border-ouro/60 focus-within:ring-2 focus-within:ring-ouro ${
                lendo ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ouro/15 text-ouro ring-1 ring-ouro/25">
                <Upload className="h-5 w-5" />
              </span>
              <span className="font-display text-base font-semibold text-white">{lendo ? "Lendo o arquivo…" : "Escolher o arquivo do extrato"}</span>
              <span className="max-w-sm text-xs text-white/70">OFX (o melhor) ou CSV, até 5 MB.</span>
            </label>
            {erroArquivo && (
              <p role="alert" className="mt-3 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
                {erroArquivo}
              </p>
            )}
            <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-white/65">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ciano-claro" />
              O arquivo é lido aqui, no seu aparelho. Ele não é enviado para nenhum servidor: só os lançamentos que você
              confirmar são gravados no seu NovareCash.
            </p>
          </Cartao>

          {!ultima && (
            <Vazio
              Icone={FileUp}
              titulo="Onde achar o arquivo"
              texto="No app ou no site do banco, abra o extrato, escolha o período e procure “exportar” ou “baixar”. Prefira OFX (às vezes aparece como “Money” ou “gerenciador financeiro”); se não houver, CSV ou Excel salvo como CSV."
            />
          )}
        </>
      )}

      {etapa === "mapear" && tabela && mapa && (
        <MapearCsv
          tabela={tabela}
          mapa={mapa}
          onMapa={setMapa}
          nome={arquivo?.nome ?? ""}
          lendo={lendo}
          erro={erroArquivo}
          onVoltar={recomecar}
          onContinuar={verPreviaCsv}
        />
      )}

      {etapa === "previa" && (
        <>
          <Cartao className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words text-sm font-semibold text-white">{arquivo?.nome}</p>
              <Selo tom="ouro">{arquivo?.formato.toUpperCase()}</Selo>
            </div>
            <p className="mt-1 text-xs text-white/70">
              {disponiveis.length} {disponiveis.length === 1 ? "lançamento novo" : "lançamentos novos"}
              {jaEstavam > 0 && ` · ${jaEstavam} já estavam no extrato`}
              {repetidas > 0 && ` · ${repetidas} repetidos no arquivo`}
              {ignoradas > 0 && ` · ${ignoradas} linhas sem data ou valor ficaram de fora`}
            </p>

            <label className="mt-4 block">
              <span className={ROTULO_CAMPO}>Em qual conta estes lançamentos entram?</span>
              <select value={destino} onChange={(e) => setDestino(e.target.value)} className={`${CAMPO} mt-1`}>
                <option value="">Sem conta (só no extrato)</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {c.tipo === "cartao" ? " (cartão)" : c.tipo === "investimento" ? " (investimento)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {destino && contas.find((c) => c.id === destino)?.origem === "manual" && (
              <p className="mt-1.5 text-2xs leading-relaxed text-white/60">
                Lançamentos com data anterior ao saldo que você informou nesta conta não mexem no saldo dela: eles já
                estavam dentro do número que você digitou.
              </p>
            )}
          </Cartao>

          {disponiveis.length === 0 ? (
            <Vazio
              Icone={Check}
              titulo="Tudo deste arquivo já está no seu extrato"
              texto="Nenhum lançamento novo para gravar. Para trazer dias mais recentes, baixe no banco um período que comece depois da última importação."
            >
              <Botao variante="contorno" Icone={ArrowLeft} onClick={recomecar}>
                Escolher outro arquivo
              </Botao>
            </Vazio>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Botao variante="fantasma" onClick={() => marcar((l) => ({ ...l, incluir: !l.ja && !l.repetida }))}>
                  Marcar todos
                </Botao>
                <Botao variante="fantasma" onClick={() => marcar((l) => ({ ...l, incluir: false }))}>
                  Desmarcar todos
                </Botao>
              </div>

              <Cartao>
                <ul className="divide-y divide-white/[0.07]">
                  {linhas.slice(0, mostrar).map((l, i) => (
                    <LinhaDaPrevia
                      key={`${l.externo_id}-${i}`}
                      l={l}
                      opcoes={categorias.filter((c) => c.tipo === l.tipo)}
                      onIncluir={(v) => setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, incluir: v } : x)))}
                      onCategoria={(c) => setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, categoria: c } : x)))}
                    />
                  ))}
                </ul>
                {linhas.length > mostrar && (
                  <div className="border-t border-white/[0.07] p-3 text-center">
                    <Botao variante="contorno" onClick={() => setMostrar((n) => n + POR_PAGINA)}>
                      Mostrar mais {Math.min(POR_PAGINA, linhas.length - mostrar)}
                    </Botao>
                  </div>
                )}
              </Cartao>
            </>
          )}

          <div className="sticky bottom-24 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-noite-2/95 p-3 backdrop-blur-md md:bottom-4">
            <Botao Icone={Check} onClick={gravar} desabilitado={gravando || escolhidas.length === 0}>
              {gravando ? "Gravando…" : `Gravar ${escolhidas.length} no extrato`}
            </Botao>
            <Botao variante="fantasma" Icone={ArrowLeft} onClick={recomecar} desabilitado={gravando}>
              Cancelar
            </Botao>
          </div>
        </>
      )}

      {etapa === "escolher" && (
        <p className="flex items-center gap-2 text-2xs text-white/55">
          <ListOrdered className="h-3.5 w-3.5 shrink-0" />
          Depois de gravar, os lançamentos aparecem no Extrato com a categoria que você escolheu (dá para trocar lá também).
        </p>
      )}

      {confirmarDesfazer && ultima && (
        <Janela titulo="Desfazer a última importação?" onFechar={() => setConfirmarDesfazer(false)}>
          <p className="text-sm leading-relaxed text-white/80">
            Os {ultima.quantas} lançamentos que vieram de <strong className="break-words text-white">{ultima.arquivo}</strong> saem
            do extrato, inclusive se você trocou a categoria de algum depois. O que você lançou à mão, pelo banco ou pelo
            WhatsApp não é tocado.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Botao variante="fantasma" onClick={() => setConfirmarDesfazer(false)} desabilitado={desfazendo}>
              Manter
            </Botao>
            <Botao variante="perigo" Icone={RotateCcw} onClick={desfazer} desabilitado={desfazendo}>
              {desfazendo ? "Desfazendo…" : "Desfazer importação"}
            </Botao>
          </div>
        </Janela>
      )}
    </div>
  );
}

function LinhaDaPrevia({
  l,
  opcoes,
  onIncluir,
  onCategoria,
}: {
  l: LinhaPrevia;
  opcoes: { chave: string; rotulo: string }[];
  onIncluir: (v: boolean) => void;
  onCategoria: (c: string) => void;
}) {
  const bloqueada = l.ja || l.repetida;
  return (
    <li className={`px-3 py-2.5 sm:px-4 ${bloqueada ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <label className={`-ml-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg ${ANEL}`}>
          <span className="sr-only">Incluir {l.descricao}</span>
          <input
            type="checkbox"
            checked={l.incluir}
            disabled={bloqueada}
            onChange={(e) => onIncluir(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-[hsl(42_74%_62%)]"
          />
        </label>
        <div className="min-w-0 flex-1 pt-1">
          <p className="break-words text-sm font-medium text-white">{l.descricao}</p>
          <p className="text-2xs text-white/60">{dataCompleta(l.data)}</p>
        </div>
        <span className={`shrink-0 pt-1 text-sm font-semibold tabular-nums ${l.tipo === "entrada" ? COR_ENTRADA : "text-white"}`}>
          {l.tipo === "entrada" ? "+ " : "− "}
          {brl(l.valor)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 pl-10">
        {l.ja ? (
          <Selo tom="neutro">Já está no extrato</Selo>
        ) : l.repetida ? (
          <Selo tom="neutro">Repetido no arquivo</Selo>
        ) : (
          <label className="min-w-0">
            <span className="sr-only">Categoria de {l.descricao}</span>
            <select
              value={l.categoria}
              onChange={(e) => onCategoria(e.target.value)}
              className="min-h-11 max-w-[15rem] cursor-pointer truncate rounded-lg border border-white/10 bg-white/[0.04] px-2 text-2xs font-semibold text-ouro outline-none hover:border-ouro/40 focus:border-ouro focus:ring-2 focus:ring-ouro/25"
            >
              {opcoes.map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.rotulo}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </li>
  );
}

/** O CSV não tem padrão: a pessoa confirma quais colunas são data, descrição, valor e (se houver) tipo. */
function MapearCsv({
  tabela,
  mapa,
  onMapa,
  nome,
  lendo,
  erro,
  onVoltar,
  onContinuar,
}: {
  tabela: TabelaCsv;
  mapa: Mapeamento;
  onMapa: (m: Mapeamento) => void;
  nome: string;
  lendo: boolean;
  erro: string | null;
  onVoltar: () => void;
  onContinuar: () => void;
}) {
  const colunas = Math.max(...tabela.linhas.map((l) => l.length));
  const cab = mapa.temCabecalho ? tabela.linhas[0] : [];
  const nomeColuna = (i: number) => {
    const exemplo = (mapa.temCabecalho ? tabela.linhas[1] : tabela.linhas[0])?.[i] ?? "";
    const titulo = cab[i] ? cab[i] : `Coluna ${i + 1}`;
    return exemplo && exemplo !== titulo ? `${titulo} (ex.: ${exemplo.slice(0, 24)})` : titulo;
  };
  const opcoes = Array.from({ length: colunas }, (_, i) => i);
  const amostra = (mapa.temCabecalho ? tabela.linhas.slice(1) : tabela.linhas).slice(0, 3);
  const nomeSep = { ";": "ponto e vírgula", ",": "vírgula", "\t": "tabulação" }[tabela.separador];

  const seletor = (rotulo: string, campo: "data" | "descricao" | "valor" | "tipo", opcional = false) => (
    <label className="block">
      <span className={ROTULO_CAMPO}>{rotulo}</span>
      <select
        value={mapa[campo]}
        onChange={(e) => onMapa({ ...mapa, [campo]: Number(e.target.value) })}
        className={`${CAMPO} mt-1`}
      >
        {opcional && <option value={-1}>Não tem (vale o sinal do valor)</option>}
        {opcoes.map((i) => (
          <option key={i} value={i}>
            {nomeColuna(i)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Cartao className="p-4 sm:p-5">
      <p className="break-words text-sm font-semibold text-white">{nome}</p>
      <p className="mt-0.5 text-xs text-white/70">
        CSV separado por {nomeSep}. Confira quais colunas são cada coisa — já deixei o meu palpite.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {seletor("Data", "data")}
        {seletor("Descrição", "descricao")}
        {seletor("Valor", "valor")}
        {seletor("Tipo (débito/crédito)", "tipo", true)}
        <label className="block">
          <span className={ROTULO_CAMPO}>Os centavos vêm depois de</span>
          <select
            value={mapa.decimal}
            onChange={(e) => onMapa({ ...mapa, decimal: e.target.value === "." ? "." : "," })}
            className={`${CAMPO} mt-1`}
          >
            <option value=",">vírgula (1.234,56)</option>
            <option value=".">ponto (1,234.56)</option>
          </select>
        </label>
      </div>

      <div className="mt-3 space-y-1">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-white/85">
          <input
            type="checkbox"
            checked={mapa.temCabecalho}
            onChange={(e) => onMapa({ ...mapa, temCabecalho: e.target.checked })}
            className="h-5 w-5 accent-[hsl(42_74%_62%)]"
          />
          A primeira linha é o cabeçalho
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-white/85">
          <input
            type="checkbox"
            checked={mapa.inverterSinal}
            onChange={(e) => onMapa({ ...mapa, inverterSinal: e.target.checked })}
            className="h-5 w-5 accent-[hsl(42_74%_62%)]"
          />
          Gastos vêm positivos (comum em extrato de cartão)
        </label>
      </div>

      {amostra.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-noite p-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-white/55">Como vai ficar</p>
          <ul className="mt-2 space-y-1.5">
            {amostra.map((l, i) => {
              const d = lerData(l[mapa.data] ?? "");
              const v = lerValor(l[mapa.valor] ?? "", mapa.decimal);
              return (
                <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-white/85">
                    {d ? dataCompleta(d) : "data ?"} · {l[mapa.descricao] || "—"}
                  </span>
                  <span className="shrink-0 tabular-nums text-white/85">{v === null ? "valor ?" : brl(mapa.inverterSinal ? -v : v)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-3 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
          {erro}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Botao Icone={Check} onClick={onContinuar} desabilitado={lendo}>
          {lendo ? "Lendo…" : "Ver a prévia"}
        </Botao>
        <Botao variante="fantasma" Icone={ArrowLeft} onClick={onVoltar} desabilitado={lendo}>
          Outro arquivo
        </Botao>
      </div>
    </Cartao>
  );
}
