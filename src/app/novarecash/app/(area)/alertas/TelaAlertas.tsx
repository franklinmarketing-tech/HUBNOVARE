"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, ListOrdered, Undo2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { categoria } from "@/lib/novarecash/categorias";
import { dataCurta, nomeDoMes, usuarioDaSessao } from "@/lib/novarecash/dados";
import {
  TIPO_ALERTA_ROTULO,
  carregarAlertas,
  contadorMensal,
  desfazerDispensa,
  dispensarAlerta,
  type Alerta,
  type ResultadoAlertas,
  type TipoAlerta,
} from "@/lib/novarecash/insights";
import { Janela } from "../Janela";
import { AvisoSqlInsights, ICONE_ALERTA, textoEconomia } from "../_insights/pecas-insights";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Botao,
  COR_SAIDA,
  Cartao,
  Esqueleto,
  Selo,
  Vazio,
  brl,
  type TomSelo,
} from "../pecas";
import { Toast, useToast } from "../Toast";

const TOM_GRAVIDADE: Record<Alerta["gravidade"], TomSelo> = { alta: "perigo", media: "alerta", baixa: "neutro" };
const ROTULO_GRAVIDADE: Record<Alerta["gravidade"], string> = { alta: "Importante", media: "Atenção", baixa: "Para saber" };

const FILTROS: { chave: TipoAlerta | "todos"; rotulo: string }[] = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "assinatura", rotulo: "Assinaturas" },
  { chave: "duplicada", rotulo: "Duplicadas" },
  { chave: "tarifas", rotulo: "Tarifas e juros" },
  { chave: "padrao", rotulo: "Fora do padrão" },
  { chave: "orcamento", rotulo: "Orçamento" },
];

export function TelaAlertas() {
  const sb = useMemo(() => createClient(), []);
  const [uid, setUid] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAlertas | null>(null);
  const [filtro, setFiltro] = useState<TipoAlerta | "todos">("todos");
  const [vendo, setVendo] = useState<Alerta | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verDispensados, setVerDispensados] = useState(false);
  const toast = useToast();

  const carregar = useCallback(async () => {
    setResultado(null);
    try {
      const eu = await usuarioDaSessao(sb);
      setUid(eu);
      setResultado(await carregarAlertas(sb, eu));
    } catch {
      setResultado({ estado: "erro" });
    }
  }, [sb]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Dispensa ou traz de volta na hora; se o banco recusar, desfaz e avisa. */
  async function mudar(a: Alerta, dispensar: boolean) {
    if (!uid || !resultado || resultado.estado !== "ok") return;
    const antes = resultado;
    const alertas = dispensar ? antes.alertas.filter((x) => x.chave !== a.chave) : [...antes.alertas, a];
    const dispensados = dispensar ? [a, ...antes.dispensados] : antes.dispensados.filter((x) => x.chave !== a.chave);
    setResultado({ ...antes, alertas, dispensados, contador: contadorMensal(alertas) });
    setOcupado(a.chave);
    setAviso(null);
    try {
      if (dispensar) {
        await dispensarAlerta(sb, uid, a.chave);
        toast.mostrar({
          texto: "Alerta marcado como resolvido.",
          // Pela ref: o "Desfazer" é tocado depois, e precisa do `resultado` de AGORA, não o deste clique.
          acao: { rotulo: "Desfazer", fazer: () => mudarAgora.current(a, false) },
        });
      } else await desfazerDispensa(sb, uid, a.chave);
    } catch {
      setResultado(antes);
      setAviso("Não consegui salvar agora. Tente de novo em instantes.");
    } finally {
      setOcupado(null);
    }
  }

  const mudarAgora = useRef(mudar);
  useEffect(() => {
    mudarAgora.current = mudar;
  });

  if (!resultado) return <Esqueleto linhas={4} />;
  if (resultado.estado === "sem-tabela") return <AvisoSemTabela />;
  if (resultado.estado === "erro") {
    return <AvisoErro mensagem="Não consegui analisar o seu extrato agora. Tente de novo em instantes." onTentar={carregar} />;
  }

  if (resultado.semDados) {
    return (
      <Vazio
        Icone={Bell}
        titulo="Ainda não há o que analisar"
        texto="Os alertas aparecem quando o extrato tiver lançamentos. Com 2 ou 3 meses de histórico, o NovareCash já encontra assinaturas e gastos fora do padrão."
      >
        <Botao href="/novarecash/app/banco" variante="contorno">
          Conectar o banco
        </Botao>
        <Botao href="/novarecash/app/extrato?novo=1">Lançar à mão</Botao>
      </Vazio>
    );
  }

  const { alertas, dispensados, contador } = resultado;
  const contagem = (t: TipoAlerta | "todos") => (t === "todos" ? alertas.length : alertas.filter((a) => a.tipo === t).length);
  const visiveis = filtro === "todos" ? alertas : alertas.filter((a) => a.tipo === filtro);
  const somaDe = (tipo: TipoAlerta) =>
    alertas.filter((a) => a.tipo === tipo && a.noContador && a.economia).reduce((s, a) => s + (a.economia?.valor ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* O contador */}
      <Cartao className="relative overflow-hidden p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ouro/10 blur-3xl" />
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">{nomeDoMes(resultado.ref)}</p>
        {contador > 0 ? (
          <>
            <p className="mt-1 max-w-prose text-sm text-white/80">Encontramos</p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ouro sm:text-4xl">
              {brl(contador)}
              <span className="text-lg font-medium text-white/70">/mês</span>
            </p>
            <p className="mt-1 max-w-prose text-sm text-white/80">que podem estar saindo sem você perceber.</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-2xs text-white/75">
              {(
                [
                  ["assinatura", "Assinaturas"],
                  ["duplicada", "Cobranças repetidas"],
                  ["tarifas", "Tarifas e juros"],
                ] as const
              ).map(([t, r]) =>
                somaDe(t) > 0 ? (
                  <li key={t} className="rounded-full bg-white/[0.06] px-2.5 py-1 ring-1 ring-inset ring-white/10">
                    {r}: <strong className="font-semibold tabular-nums text-white">{brl(somaDe(t))}</strong>
                  </li>
                ) : null,
              )}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-1 font-display text-xl font-semibold text-white">Nada saindo escondido</p>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">
              Não encontramos assinatura esquecida, cobrança repetida nem tarifa neste período. Os outros alertas estão
              abaixo, se houver.
            </p>
          </>
        )}
      </Cartao>

      {!resultado.podeDispensar && <AvisoSqlInsights oque="alertas dispensados (o botão “Já resolvi”)" />}

      {aviso && (
        <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
          {aviso}
        </p>
      )}

      {/* Filtro no topo, com bolinha de escolha */}
      {alertas.length > 0 && (
        <fieldset>
          <legend className="sr-only">Filtrar alertas por tipo</legend>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {FILTROS.filter((f) => f.chave === "todos" || contagem(f.chave) > 0).map((f) => {
              const ativo = filtro === f.chave;
              return (
                <label
                  key={f.chave}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-semibold ring-1 ring-inset transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ouro ${
                    ativo ? "bg-ouro/[0.14] text-ouro ring-ouro/40" : "bg-white/[0.04] text-white/80 ring-white/15 hover:text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="filtro-alertas"
                    className="sr-only"
                    checked={ativo}
                    onChange={() => setFiltro(f.chave)}
                  />
                  <span
                    aria-hidden
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ${ativo ? "ring-ouro" : "ring-white/40"}`}
                  >
                    {ativo && <span className="h-1.5 w-1.5 rounded-full bg-ouro" />}
                  </span>
                  {f.rotulo}
                  <span className="tabular-nums text-white/55">{contagem(f.chave)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {alertas.length === 0 ? (
        <Vazio
          Icone={Check}
          titulo="Nenhum alerta agora"
          texto="Tudo em ordem por aqui. O NovareCash confere de novo sempre que você abrir esta tela; mantenha o extrato em dia para os alertas ficarem certeiros."
        >
          <Botao href="/novarecash/app/orcamento" variante="contorno">
            Definir limites no orçamento
          </Botao>
        </Vazio>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((a) => (
            <li key={a.chave}>
              <CartaoDoAlerta
                a={a}
                podeDispensar={resultado.podeDispensar}
                ocupado={ocupado === a.chave}
                onVer={() => setVendo(a)}
                onDispensar={() => mudar(a, true)}
              />
            </li>
          ))}
        </ul>
      )}

      {dispensados.length > 0 && (
        <section aria-labelledby="titulo-dispensados">
          <button
            type="button"
            onClick={() => setVerDispensados((v) => !v)}
            aria-expanded={verDispensados}
            className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-1 text-left ${ANEL}`}
          >
            <h2 id="titulo-dispensados" className="font-display text-sm font-semibold text-white/80">
              Já resolvidos ({dispensados.length})
            </h2>
            <ChevronDown aria-hidden className={`h-4 w-4 text-white/60 transition-transform motion-reduce:transition-none ${verDispensados ? "rotate-180" : ""}`} />
          </button>
          {verDispensados && (
            <Cartao>
              <ul className="divide-y divide-white/[0.07]">
                {dispensados.map((a) => (
                  <li key={a.chave} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white/80">{a.titulo}</span>
                      <span className="block text-2xs text-white/55">{TIPO_ALERTA_ROTULO[a.tipo]}</span>
                    </span>
                    <Botao variante="fantasma" Icone={Undo2} onClick={() => mudar(a, false)} desabilitado={ocupado === a.chave}>
                      Trazer de volta
                    </Botao>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}
        </section>
      )}

      <p className="max-w-prose text-2xs leading-relaxed text-white/55">
        Como funciona: os alertas são calculados pelas regras do NovareCash sobre os últimos 7 meses do seu extrato, sem
        enviar nada para a IA. Pagamento de fatura, transferências e aplicações não contam como gasto. Os alertas explicam
        o que aconteceu; a decisão é sempre sua.
      </p>

      {vendo && <JanelaLancamentos alerta={vendo} onFechar={() => setVendo(null)} />}

      <Toast {...toast} />
    </div>
  );
}

function CartaoDoAlerta({
  a,
  podeDispensar,
  ocupado,
  onVer,
  onDispensar,
}: {
  a: Alerta;
  podeDispensar: boolean;
  ocupado: boolean;
  onVer: () => void;
  onDispensar: () => void;
}) {
  const Icone = ICONE_ALERTA[a.tipo];
  const economia = textoEconomia(a);
  return (
    <Cartao className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ouro/[0.12] text-ouro ring-1 ring-inset ring-ouro/25"
        >
          <Icone className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Selo tom={TOM_GRAVIDADE[a.gravidade]}>{ROTULO_GRAVIDADE[a.gravidade]}</Selo>
            {a.selo && <Selo tom={a.selo === "Nova" ? "ouro" : "neutro"}>{a.selo}</Selo>}
            <span className="text-2xs text-white/55">{TIPO_ALERTA_ROTULO[a.tipo]}</span>
          </div>
          <h3 className="mt-1.5 break-words font-display text-base font-semibold text-white">{a.titulo}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/75">{a.explicacao}</p>
          {economia && <p className="mt-2 text-sm font-semibold tabular-nums text-ouro">{economia}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 sm:pl-[52px]">
        <Botao variante="contorno" Icone={ListOrdered} onClick={onVer}>
          Ver no extrato
        </Botao>
        {podeDispensar && (
          <Botao variante="fantasma" Icone={Check} onClick={onDispensar} desabilitado={ocupado}>
            Já resolvi / dispensar
          </Botao>
        )}
      </div>
    </Cartao>
  );
}

/** "Ver no extrato": os lançamentos que levaram ao alerta, e o atalho para o Extrato. */
function JanelaLancamentos({ alerta, onFechar }: { alerta: Alerta; onFechar: () => void }) {
  const params = new URLSearchParams({ mes: alerta.mes });
  if (alerta.busca) params.set("busca", alerta.busca);
  if (alerta.categoria) params.set("categoria", alerta.categoria);
  return (
    <Janela titulo="Os lançamentos deste alerta" onFechar={onFechar}>
      <p className="text-xs leading-relaxed text-white/70">{alerta.titulo}</p>
      {alerta.transacoes.length === 0 ? (
        <p className="mt-3 text-sm text-white/70">Nenhum lançamento para mostrar.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.07] rounded-2xl border border-white/10">
          {alerta.transacoes.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-12 shrink-0 text-2xs tabular-nums text-white/60">{dataCurta(t.data)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{t.descricao}</span>
                <span className="block truncate text-2xs text-white/55">{categoria(t.categoria).rotulo}</span>
              </span>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${COR_SAIDA}`}>−{brl(t.valor)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Botao variante="fantasma" onClick={onFechar}>
          Fechar
        </Botao>
        <Botao href={`/novarecash/app/extrato?${params.toString()}`} Icone={ListOrdered}>
          Abrir o Extrato
        </Botao>
      </div>
    </Janela>
  );
}
