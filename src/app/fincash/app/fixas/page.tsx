"use client";

import { useCallback, useEffect, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import { ArrowDownRight, ArrowUpRight, Plus, Repeat, X } from "lucide-react";
import {
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoGrupo,
  CabecalhoTela,
  CartaoTransacao,
  Esqueleto,
  Medidor,
  NumeroHeroi,
  Pastilha,
  Vazio,
  type TomGrupo,
} from "../pecas";
import { createClient } from "@/lib/supabase/client";
import {
  desligarRecorrencia,
  salvarRecorrencia,
  type Categoria,
  type Conta,
  type Recorrencia,
  type TipoLancamento,
} from "@/lib/fincash/modelo";

/**
 * Contas fixas — o que se repete todo mês.
 *
 * O NOME NÃO É "RECORRÊNCIAS". No banco é `fin_recorrencias`, porque é o termo
 * técnico correto; na tela é "contas fixas", porque é como a pessoa chama o
 * aluguel e a mensalidade da escola. Cliente não deve aprender o vocabulário
 * do banco de dados para usar o próprio dinheiro.
 *
 * POR QUE ESTA TELA DECIDE SE O APP SOBREVIVE AO SEGUNDO MÊS
 * Sem ela, em fevereiro a pessoa digita de novo aluguel, luz, água, internet e
 * salário — as mesmas seis linhas de janeiro. É exatamente aí que se abandona
 * app de finanças. Cadastrando uma vez, o mês seguinte já abre preenchido.
 *
 * O que é gerado nasce como PREVISTO, nunca como pago: o app não pode afirmar
 * que a conta foi paga sem ninguém ter pago.
 *
 * O QUE MUDOU NO DESENHO
 * O número do topo era "quanto sobra do fixo", e sobra é um valor sem escala:
 * R$ 1.200 sobrando é folga para quem ganha 3 mil e aperto para quem ganha 20.
 * O MEDIDOR ao lado responde a pergunta que falta — que FATIA da renda fixa já
 * está comprometida antes de a pessoa gastar o primeiro real do mês.
 *
 * Ele substituiu o anel, e não por gosto: anel é recipiente ("quanto já está
 * dentro"), medidor é escala ("quanto de quanto pode"). Comprometimento de
 * renda é escala — e é o mesmo desenho que o Painel usa para a mesma pergunta,
 * que é o que faz as duas telas parecerem o mesmo produto.
 *
 * O número virou o HERÓI navy da tela, um só, com as duas pontas (o que entra
 * e o que sai) em pastilhas embaixo dele.
 */
export default function FixasPage() {
  const [itens, setItens] = useState<Recorrencia[] | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    const [r, c, k] = await Promise.all([
      supabase
        .from("fin_recorrencias")
        .select("*")
        .eq("ativa", true)
        .order("dia"),
      supabase.from("fin_contas").select("*").eq("arquivada", false).order("nome"),
      supabase
        .from("fin_categorias")
        .select("*")
        .eq("arquivada", false)
        .order("nome"),
    ]);
    if (r.error) {
      setErro(faltaTabela(r.error) ? "FALTA_SQL" : r.error.message);
      return;
    }
    setItens((r.data ?? []) as Recorrencia[]);
    setContas((c.data ?? []) as Conta[]);
    setCategorias((k.data ?? []) as Categoria[]);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro === "FALTA_SQL") return <AvisoSQL arquivo="supabase/fincash.sql" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  /* Duas listas empilhadas, não um painel: o esqueleto de lista é o que
     desenha o que vai nascer aqui. */
  if (!itens) return <Esqueleto forma="lista" />;

  const saidas = itens.filter((i) => i.tipo === "despesa");
  const entradas = itens.filter((i) => i.tipo === "receita");
  const totalSaidas = saidas.reduce((s, i) => s + Number(i.valor), 0);
  const totalEntradas = entradas.reduce((s, i) => s + Number(i.valor), 0);
  const sobra = totalEntradas - totalSaidas;
  const comprometido =
    totalEntradas > 0 ? (totalSaidas / totalEntradas) * 100 : 0;

  return (
    <div className="surgir">
      <CabecalhoTela
        /* Tela que se alcança pelo "Mais": o ícone aqui é o mesmo do item do
           menu, e é ele que amarra a página ao botão que a pessoa tocou. */
        Icone={Repeat}
        chapeu="Todo mês, sem digitar de novo"
        titulo="Contas fixas"
        resumo="O que se repete todo mês. Cadastre uma vez e o app lança sozinho — você só confirma quando pagar."
        acao={
          <BotaoAcao Icone={Plus} onClick={() => setAbrindo(true)}>
            Nova conta fixa
          </BotaoAcao>
        }
      />

      {itens.length === 0 ? (
        <Vazio
          Icone={Repeat}
          titulo="Nenhuma conta fixa ainda"
          texto="Aluguel, luz, internet, salário. Cadastrando aqui, você não precisa digitar as mesmas linhas de novo no mês que vem."
          passos={[
            "Diga se entra ou sai todo mês.",
            "Escreva o que é, quanto é e em que dia cai.",
            "Pronto: o app lança sozinho todo mês, como previsto — você só confirma quando pagar.",
          ]}
          acao={
            <BotaoAcao Icone={Plus} onClick={() => setAbrindo(true)}>
              Cadastrar a primeira
            </BotaoAcao>
          }
        />
      ) : (
        <>
          {/* O saldo fixo do mês: o que sobra ANTES de qualquer gasto variável.
              É o número que diz se a vida cabe no orçamento — e por isso é ele
              que ocupa o único bloco escuro da tela. */}
          <div className="mb-3">
            <NumeroHeroi
              rotulo={
                sobra >= 0
                  ? "Todo mês, antes de qualquer gasto do dia a dia, sobra"
                  : "Todo mês, antes de qualquer gasto do dia a dia, falta"
              }
              valor={brl(Math.abs(sobra))}
              sinal={sobra >= 0 ? "positivo" : "negativo"}
              explicacao={
                sobra < 0
                  ? "O fixo já custa mais do que a renda fixa. Enquanto isso não mudar, todo mês fecha no vermelho antes do primeiro gasto do dia a dia."
                  : "É o que a renda que se repete deixa livre depois das contas que se repetem. O gasto do dia a dia sai daqui."
              }
              /* O medidor só existe quando há renda fixa cadastrada:
                 percentual de zero é divisão por zero disfarçada de
                 informação. */
              lateral={
                totalEntradas > 0 && (
                  <Medidor
                    valor={comprometido}
                    rotulo="Da renda fixa já comprometida"
                    sobre="escuro"
                    compacto
                  />
                )
              }
            >
              <Pastilha tom="pago" Icone={ArrowUpRight} sobre="escuro">
                {brl(totalEntradas)} entra
              </Pastilha>
              <Pastilha tom="saida" Icone={ArrowDownRight} sobre="escuro">
                {brl(totalSaidas)} sai
              </Pastilha>
            </NumeroHeroi>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Lista
              titulo="Entra todo mês"
              tom="entrada"
              total={totalEntradas}
              itens={entradas}
              contas={contas}
              categorias={categorias}
              aoDesligar={carregar}
            />
            <Lista
              titulo="Sai todo mês"
              tom="saida"
              total={totalSaidas}
              itens={saidas}
              contas={contas}
              categorias={categorias}
              aoDesligar={carregar}
            />
          </div>
        </>
      )}

      {abrindo && (
        <Formulario
          contas={contas}
          categorias={categorias}
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

function Lista({
  titulo,
  tom,
  total,
  itens,
  contas,
  categorias,
  aoDesligar,
}: {
  titulo: string;
  tom: TomGrupo;
  total: number;
  itens: Recorrencia[];
  contas: Conta[];
  categorias: Categoria[];
  aoDesligar: () => void;
}) {
  const cats = new Map(categorias.map((c) => [c.id, c]));
  const cts = new Map(contas.map((c) => [c.id, c]));

  if (itens.length === 0) return null;

  return (
    <Bloco className="overflow-hidden">
      <CabecalhoGrupo titulo={titulo} tom={tom} total={brl(total)} />
      <ul className="divide-y divide-border/50">
        {itens.map((i) => (
          <li key={i.id}>
            {/* A MESMA LINHA DOS LANÇAMENTOS. Uma conta fixa é um lançamento
                que ainda não aconteceu, e desenhá-la de outro jeito faria a
                pessoa achar que é outra coisa. O disco leva a cor da
                categoria, o valor leva o sinal, e o dia do mês entra onde nos
                lançamentos entra a data — que é o que ele é. */}
            <CartaoTransacao
              descricao={i.descricao}
              valor={Number(i.valor)}
              sinal={i.tipo === "receita" ? "entrada" : "saida"}
              quando={`todo dia ${i.dia}`}
              categoria={
                (i.conta_id && cts.get(i.conta_id)?.nome) ||
                cats.get(i.categoria_id ?? "")?.nome
              }
              cor={cats.get(i.categoria_id ?? "")?.cor}
              Icone={i.tipo === "receita" ? ArrowUpRight : ArrowDownRight}
              acao={
                <button
                  type="button"
                  onClick={async () => {
                    await desligarRecorrencia(i.id);
                    aoDesligar();
                  }}
                  aria-label={`Desligar ${i.descricao}`}
                  title="Desligar. Os lançamentos já criados continuam no histórico."
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            />
          </li>
        ))}
      </ul>
    </Bloco>
  );
}

function Formulario({
  contas,
  categorias,
  aoFechar,
  aoSalvar,
}: {
  contas: Conta[];
  categorias: Categoria[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState(10);
  const [categoriaId, setCategoriaId] = useState("");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const doTipo = categorias.filter((c) => c.tipo === tipo);

  useEffect(() => {
    setCategoriaId(doTipo[0]?.id ?? "");
  }, [tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sair = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", sair);
    return () => window.removeEventListener("keydown", sair);
  }, [aoFechar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!descricao.trim() || !n || n <= 0) return;

    setSalvando(true);
    try {
      await salvarRecorrencia({
        tipo,
        descricao: descricao.trim(),
        valor: n,
        categoria_id: categoriaId || null,
        conta_id: contaId || null,
        cartao_id: null,
        frequencia: "mensal",
        dia,
        // Começa no mês atual: cadastrar em março não deve fazer o app criar
        // lançamento retroativo de janeiro e fevereiro.
        inicio: new Date().toISOString().slice(0, 10),
        fim: null,
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
      aria-labelledby="titulo-fixa"
    >
      {/* A sombra é a do app (`fincash.css`), a de elemento flutuante: duas
          receitas de sombra na mesma tela é o que faz a página parecer montada
          por duas pessoas. */}
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[var(--fin-sombra-flutua)] sm:p-7"
      >
        <h2
          id="titulo-fixa"
          className="font-display text-lg font-semibold text-primary"
        >
          Nova conta fixa
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Vai aparecer sozinha todo mês, como prevista. Você confirma quando
          pagar.
        </p>

        {/* 44px também aqui: é a primeira escolha do formulário e a que muda
            todo o resto dele. A pastilha escolhida sobe com a sombra da casa —
            era um `shadow-sm` avulso, a única sombra da tela que não vinha da
            folha do app. */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-gelo p-1">
          {(["despesa", "receita"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={`min-h-11 rounded-lg px-2 text-sm font-semibold transition-all ${
                tipo === t
                  ? "bg-white text-primary shadow-[var(--fin-sombra-card)]"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t === "despesa" ? "Sai todo mês" : "Entra todo mês"}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">O que é</span>
          <input
            autoFocus
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === "despesa" ? "Aluguel, internet…" : "Salário"}
            className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Quanto</span>
            <input
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Dia do mês
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={dia}
              onChange={(e) =>
                setDia(Math.min(31, Math.max(1, Number(e.target.value))))
              }
              className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
            />
          </label>
        </div>

        {dia > 28 && (
          <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
            Em meses mais curtos, cai no último dia — nunca escorrega para o mês
            seguinte.
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Categoria
            </span>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            >
              {doTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Conta</span>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        {/* `BotaoAcao` no rodapé: era o mesmo botão redesenhado à mão, com a
            sombra laranja copiada linha a linha. Uma tinta só, num lugar só. */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <BotaoAcao variante="contorno" larguraTotal onClick={aoFechar}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            larguraTotal
            desabilitado={salvando || !descricao.trim() || !valor}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </BotaoAcao>
        </div>
      </form>
    </div>
  );
}
