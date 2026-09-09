"use client";

import { useCallback, useEffect, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import { PiggyBank, Plus } from "lucide-react";
import {
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoTela,
  Esqueleto,
  NumeroHeroi,
  Pastilha,
  Vazio,
} from "../pecas";
import { createClient } from "@/lib/supabase/client";
import {
  carregarSaldos,
  salvarConta,
  type Conta,
  type TipoConta,
} from "@/lib/fincash/modelo";

const TIPOS: { valor: TipoConta; rotulo: string }[] = [
  { valor: "corrente", rotulo: "Conta corrente" },
  { valor: "poupanca", rotulo: "Poupança" },
  { valor: "carteira", rotulo: "Dinheiro em espécie" },
  { valor: "investimento", rotulo: "Investimento" },
];

/* Cores da casa primeiro, para a conta nascer com a cara da Novare mesmo que
   a pessoa não escolha nada. */
const CORES = ["#1e3a5f", "#e8703a", "#0891b2", "#16a34a", "#7c3aed", "#db2777"];

/**
 * Onde o dinheiro está.
 *
 * POR QUE ESTA TELA VEM ANTES DE LANÇAR
 * Sem conta não existe saldo — só total de gastos, que é o que todo app já faz
 * e ninguém abre duas vezes. O saldo inicial é o pulo do gato: é ele que
 * transforma "quanto gastei" em "quanto eu tenho".
 *
 * O QUE MUDOU NO DESENHO
 * O total virou uma FITA DE COMPOSIÇÃO: uma barra dividida pelas cores das
 * contas, na proporção de cada uma. É a resposta visual a "está tudo num lugar
 * só?" — pergunta que a lista de cards não respondia, porque comparar quatro
 * números empilhados é conta de cabeça. A cor da fita é a mesma do cartão logo
 * abaixo, então a leitura se transfere sem legenda.
 *
 * E O TOTAL VIROU O HERÓI NAVY, com a fita no rodapé dele. Aqui o número da
 * tela é um só e não tem concorrente — "quanto eu tenho" é literalmente o
 * motivo desta página existir. Os cartões de cada conta continuam brancos: um
 * bloco escuro por tela, senão a hierarquia que o herói cria se anula.
 */
export default function ContasPage() {
  const [contas, setContas] = useState<Conta[] | null>(null);
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("fin_contas")
      .select("*")
      .eq("arquivada", false)
      .order("criado_em");
    if (error) {
      setErro(faltaTabela(error) ? "FALTA_SQL" : error.message);
      return;
    }
    setContas((data ?? []) as Conta[]);
    setSaldos(await carregarSaldos());
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro === "FALTA_SQL") return <AvisoSQL arquivo="supabase/fincash.sql" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  /* A tela é uma grade de cartões, e o esqueleto imita a grade: esqueleto com
     a forma errada promete um layout e entrega outro — a tela pula do mesmo
     jeito que pularia sem esqueleto nenhum. */
  if (!contas) return <Esqueleto forma="cartoes" linhas={2} />;

  const saldoDe = (c: Conta) => saldos[c.id] ?? c.saldo_inicial;
  const total = contas.reduce((s, c) => s + saldoDe(c), 0);
  /* A fita só considera saldo positivo: conta no negativo não ocupa fatia de
     um bolo — ela tira. Misturar as duas coisas na mesma barra daria
     proporções que não somam o total mostrado em cima. */
  const positivo = contas.reduce((s, c) => s + Math.max(0, saldoDe(c)), 0);
  const negativas = contas.filter((c) => saldoDe(c) < 0);

  return (
    <div className="surgir">
      <CabecalhoTela
        Icone={PiggyBank}
        chapeu="A base de tudo"
        titulo="Suas contas"
        resumo="Onde o seu dinheiro está hoje. É o saldo daqui que faz o app dizer quanto você tem, e não só quanto gastou."
        acao={
          <BotaoAcao Icone={Plus} onClick={() => setAbrindo(true)}>
            Nova conta
          </BotaoAcao>
        }
      />

      {contas.length > 0 && (
        <div className="mb-3">
          <NumeroHeroi
            /* O sinal quem diz é a frase, não o menos colado no número: saldo
               somado negativo é raro o bastante para merecer uma palavra em
               vez de um símbolo que passa batido. */
            rotulo={
              total >= 0
                ? "Somando todas as contas, você tem hoje"
                : "Somando todas as contas, você está negativo em"
            }
            valor={brl(Math.abs(total))}
            sinal={total >= 0 ? "positivo" : "negativo"}
            explicacao="É o saldo inicial de cada conta somado a tudo o que você já lançou como pago. O que ainda está previsto não entra aqui — este é o dinheiro que existe agora."
            rodape={
              positivo > 0 && (
                <div>
                  <div
                    className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`Composição do saldo: ${contas
                      .filter((c) => saldoDe(c) > 0)
                      .map((c) => `${c.nome} ${brl(saldoDe(c))}`)
                      .join(", ")}`}
                  >
                    {contas
                      .filter((c) => saldoDe(c) > 0)
                      .map((c) => (
                        <span
                          key={c.id}
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{
                            width: `${(saldoDe(c) / positivo) * 100}%`,
                            background: c.cor,
                          }}
                        />
                      ))}
                  </div>
                  {/* A fita não leva legenda de cores: as mesmas cores voltam
                      na fita do topo de cada cartão logo abaixo, e legenda
                      repetida ocupa espaço para dizer o que a página já diz. */}
                  <p className="mt-2 text-2xs leading-snug text-white/60">
                    A fatia de cada conta no seu total.
                  </p>
                </div>
              )
            }
          >
            <Pastilha tom="neutro" sobre="escuro">
              {contas.length === 1 ? "1 conta" : `${contas.length} contas`}
            </Pastilha>
            {negativas.length > 0 && (
              /* Vermelho aqui não é decoração de saída: conta no negativo é
                 dinheiro que já está custando juros, a mesma família do
                 atraso. E vem com a palavra, porque a cor sozinha não avisa
                 quem não a enxerga. */
              <Pastilha tom="atrasado" sobre="escuro">
                {negativas.length === 1
                  ? "1 conta no negativo"
                  : `${negativas.length} contas no negativo`}
              </Pastilha>
            )}
          </NumeroHeroi>
        </div>
      )}

      {contas.length === 0 ? (
        <Vazio
          Icone={PiggyBank}
          titulo="Nenhuma conta cadastrada"
          texto="Cadastre a conta do seu banco para o app conseguir te dizer quanto você tem. Pode ser um valor aproximado — dá para ajustar depois."
          passos={[
            "Dê um nome — o mesmo que você usa para falar dela (“Nubank”, “carteira”).",
            "Diga quanto tem nela hoje. É daqui que o saldo passa a ser contado.",
            "Repita para cada lugar onde o seu dinheiro está.",
          ]}
          acao={
            <BotaoAcao Icone={Plus} onClick={() => setAbrindo(true)}>
              Cadastrar a primeira
            </BotaoAcao>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {contas.map((c) => {
            const saldo = saldoDe(c);
            const fatia = positivo > 0 ? (Math.max(0, saldo) / positivo) * 100 : 0;

            return (
              <li key={c.id}>
                <Bloco className="overflow-hidden">
                  {/* A cor da conta vira uma fita no topo do cartão, não um
                      risco lateral: no celular o cartão ocupa a largura toda e
                      o risco de 6px na lateral some do campo de visão. */}
                  <span
                    aria-hidden
                    className="block h-1"
                    style={{ background: c.cor }}
                  />
                  <div className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                        <span className="truncate">{c.nome}</span>
                        {saldo < 0 && <Pastilha tom="atrasado">no negativo</Pastilha>}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {TIPOS.find((t) => t.valor === c.tipo)?.rotulo}
                        {contas.length > 1 && saldo > 0 && (
                          <> · {Math.round(fatia)}% do total</>
                        )}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 font-display text-base font-semibold tabular-nums ${
                        saldo < 0 ? "text-destructive" : "text-primary"
                      }`}
                    >
                      {brl(saldo)}
                    </p>
                  </div>
                </Bloco>
              </li>
            );
          })}
        </ul>
      )}

      {abrindo && (
        <FormularioConta
          aoFechar={() => setAbrindo(false)}
          aoSalvar={async () => {
            setAbrindo(false);
            await carregar();
          }}
        />
      )}
    </div>
  );
}

function FormularioConta({
  aoFechar,
  aoSalvar,
}: {
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("corrente");
  const [saldo, setSaldo] = useState("");
  const [cor, setCor] = useState(CORES[0]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sair = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", sair);
    return () => window.removeEventListener("keydown", sair);
  }, [aoFechar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await salvarConta({
        nome: nome.trim(),
        tipo,
        /* Vírgula é como o brasileiro digita. Aceitar só ponto faria
           "1.500,00" virar 1,5 em silêncio — e saldo errado num app de
           dinheiro é o defeito que faz desinstalar. */
        saldo_inicial: Number(saldo.replace(/\./g, "").replace(",", ".")) || 0,
        cor,
      });
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-conta"
    >
      {/* A sombra vem da folha do app (`fincash.css`), como a dos cards: duas
          receitas de sombra na mesma tela é o que faz a página parecer montada
          por duas pessoas. Esta é a de elemento flutuante. */}
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[var(--fin-sombra-flutua)] sm:p-7"
      >
        <h2
          id="titulo-conta"
          className="font-display text-lg font-semibold text-primary"
        >
          Nova conta
        </h2>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-muted-foreground">Nome</span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nubank, Itaú, carteira…"
            className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoConta)}
            className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          >
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">
            Quanto tem nela hoje
          </span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              R$
            </span>
            <input
              inputMode="decimal"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
            />
          </div>
          <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
            É a partir daqui que o saldo passa a ser calculado. Pode ser
            aproximado — dá para ajustar depois.
          </span>
        </label>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-muted-foreground">
            Cor
          </legend>
          {/* 44px de alvo, como o resto do app. O disco colorido continua com
              32px por dentro — o que cresceu foi a área que o dedo acerta, que
              é onde não se economiza pixel. */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={cor === c}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-gelo"
              >
                <span
                  aria-hidden
                  className={`h-8 w-8 rounded-full transition-transform ${
                    cor === c ? "scale-110 ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  style={{ background: c }}
                />
              </button>
            ))}
          </div>
        </fieldset>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        {/* O rodapé do formulário é `BotaoAcao` como no resto do app: era o
            mesmo botão redesenhado à mão, com a sombra laranja copiada. Uma
            tinta só, num lugar só. */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <BotaoAcao variante="contorno" larguraTotal onClick={aoFechar}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            larguraTotal
            desabilitado={salvando || !nome.trim()}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </BotaoAcao>
        </div>
      </form>
    </div>
  );
}
