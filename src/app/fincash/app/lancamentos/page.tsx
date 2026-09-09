"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleDashed,
  ListPlus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  AnelProgresso,
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  brl,
  brlExato,
  CabecalhoGrupo,
  CartaoTransacao,
  Esqueleto,
  NavegadorMes,
  NumeroHeroi,
  Pastilha,
  Vazio,
} from "../pecas";
import {
  alternarPago,
  apagarLancamento,
  carregarMes,
  materializarRecorrencias,
  nomeDoMes,
  refDoMes,
  resumirMes,
  salvarLancamento,
  type Mes,
  type TipoLancamento,
} from "@/lib/fincash/modelo";

/**
 * Lançamentos — a tela que a pessoa usa todo dia.
 *
 * TRÊS DECISÕES QUE VALEM O COMENTÁRIO:
 *
 * 1. **O botão de pago é um clique, não um formulário.** Marcar a conta de luz
 *    como paga é o gesto mais repetido do app. Se exigir abrir, editar e
 *    salvar, a pessoa para de marcar — e aí o saldo mente.
 *
 * 2. **Previsto aparece junto com realizado, separado por opacidade.** Quase
 *    todo concorrente só mostra o que já aconteceu; é o que os torna diários
 *    de bordo. Ver o que ainda vai sair, no mesmo lugar, é o que transforma a
 *    lista em decisão. (A opacidade virou um fundo gelo na linha: apagar o
 *    texto de um valor é perder contraste para dizer o que a pastilha ao lado
 *    já diz com uma palavra.)
 *
 * 3. **Parcelamento nasce completo.** "12x de R$ 300" grava as doze de uma vez.
 *    Sem isso, a projeção do mês seguinte mostra sobra que não existe — que é
 *    o erro que faz a pessoa confiar no app e furar o orçamento.
 *
 * O ESTADO É PASTILHA, e sempre com a palavra: **pago**, **previsto** e a
 * terceira leitura que o app já sabia e não dizia — **atrasado**, a despesa
 * não paga com data anterior a hoje. Cor sozinha não diz nada a quem não a
 * enxerga.
 *
 * E os valores aqui levam CENTAVO. É a única tela em que o número é o dado
 * bruto que a pessoa digitou; arredondar "R$ 43,90" para "R$ 44" bem na linha
 * que ela acabou de criar é o detalhe que põe todos os outros números em
 * dúvida. A SÍNTESE do topo não leva: "R$ 4.312" lê mais rápido que
 * "R$ 4.312,47", e ali a ordem de grandeza é a informação.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * O QUE MUDOU NO DESENHO (a tela entrou no sistema visual do app)
 * ══════════════════════════════════════════════════════════════════════════
 * • O trio branco de resumo virou o HERÓI NAVY, o único bloco escuro da tela:
 *   em cima o que JÁ ACONTECEU (o saldo do mês, o número que a lista soma), no
 *   rodapé o que AINDA ESTÁ PREVISTO — inclusive a sobra prevista, que era o
 *   terceiro cartão do trio. Nenhum número saiu; eles ganharam ordem.
 * • O anel ao lado mede quanto do mês já está confirmado. É a pergunta desta
 *   tela e de nenhuma outra: "já lancei tudo?" — anel porque é recipiente
 *   ("quanto já está dentro"), não régua.
 * • Cada dia virou uma TABELA com faixa (`CabecalhoGrupo`), e o total do dia
 *   mora dentro da faixa. Era um cabeçalho solto acima de um card branco; a
 *   faixa é o que orienta o olho numa página de sessenta linhas.
 * • As linhas são `CartaoTransacao`, a mesma peça do painel e das contas
 *   fixas. O disco colorido da categoria é o que faz uma lista longa parecer
 *   curta: o olho filtra pela cor antes de ler palavra por palavra.
 * • Saída é NAVY com "−", não vermelho. Vermelho ficou reservado ao atraso —
 *   se todo gasto for vermelho, o alarme se gasta em coisa normal.
 */
export default function LancamentosPage() {
  /* A forma do esqueleto é a da tela que vem: dias empilhados, não um painel.
     Esqueleto com a forma errada promete um layout e entrega outro — a tela
     pula do mesmo jeito que pularia sem esqueleto nenhum. */
  return (
    <Suspense fallback={<Esqueleto forma="lista" />}>
      <Lancamentos />
    </Suspense>
  );
}

function Lancamentos() {
  const params = useSearchParams();
  const hoje = refDoMes();
  const [ref, setRef] = useState(hoje);
  const [dados, setDados] = useState<Mes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // O painel manda `?novo=1` pelo botão "Lançar": a pessoa chega com o
  // formulário já aberto, em vez de ter de clicar de novo.
  const [abrindo, setAbrindo] = useState(params.get("novo") === "1");

  /* MODO APAGAR. Numa linha de celular cabe UM alvo de 44px à direita, e ele
     é do gesto de todo dia (marcar pago) — não do gesto que se faz uma vez por
     mês e não tem volta. Apagar continua a um toque de distância, só que dentro
     de um modo que se liga de propósito: era a única ação irreversível do app
     encostada no dedo que rola a lista. */
  const [apagando, setApagando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      let m = await carregarMes(ref);
      if (m.recorrencias.length > 0) {
        const criados = await materializarRecorrencias(ref, m.recorrencias, m.lancamentos);
        if (criados > 0) m = await carregarMes(ref);
      }
      setDados(m);
      setErro(null);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setErro(faltaTabela(err) ? "FALTA_SQL" : err.message ?? "Falhou.");
    }
  }, [ref]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro === "FALTA_SQL") return <AvisoSQL arquivo="supabase/fincash.sql" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  if (!dados) return <Esqueleto forma="lista" />;

  const cats = new Map(dados.categorias.map((c) => [c.id, c]));
  const contas = new Map(dados.contas.map((c) => [c.id, c]));
  const r = resumirMes(dados.lancamentos);
  const hojeISO = new Date().toISOString().slice(0, 10);
  const ontemISO = new Date(Date.parse(hojeISO) - 86_400_000)
    .toISOString()
    .slice(0, 10);

  /* Vencidas e não pagas. Receita vencida NÃO entra: salário que o banco
     liberou um dia depois não é atraso, e chamar as duas coisas de vermelho é
     gastar o alarme. */
  const atrasadas = dados.lancamentos.filter(
    (l) => !l.pago && l.tipo === "despesa" && l.data < hojeISO,
  );
  const totalAtrasado = atrasadas.reduce((s, l) => s + l.valor, 0);

  /* Quanto do mês já está confirmado, em dinheiro. Por VALOR e não por
     quantidade: dez cafés lançados e o aluguel esquecido dariam 91% de um mês
     que na verdade mal começou. A contagem vira a legenda dentro do anel, que
     é onde ela é contexto e não a medida. */
  const movimentado = r.entrouPrevisto + r.saiuPrevisto;
  const confirmado = r.entrouRealizado + r.saiuRealizado;
  const pctConfirmado = movimentado > 0 ? (confirmado / movimentado) * 100 : 0;
  const pagos = dados.lancamentos.filter((l) => l.pago).length;
  const temPrevisto = r.aPagar > 0 || r.aReceber > 0;

  /* Agrupado por dia: uma lista corrida de 60 lançamentos não tem onde o olho
     descansar, e a data vira ruído repetido em toda linha. */
  const porDia = new Map<string, typeof dados.lancamentos>();
  for (const l of dados.lancamentos) {
    porDia.set(l.data, [...(porDia.get(l.data) ?? []), l]);
  }

  return (
    <div className="surgir">
      <NavegadorMes
        mes={ref}
        hoje={hoje}
        nome={nomeDoMes(ref)}
        aoMudar={setRef}
        acao={
          <div className="flex items-center gap-2">
            {/* Só quando há o que apagar. Um modo destrutivo oferecido numa
                tela vazia é um botão que só serve para assustar. */}
            {dados.lancamentos.length > 0 && (
              <BotaoAcao
                variante="contorno"
                tamanho="sm"
                Icone={apagando ? Check : Trash2}
                onClick={() => setApagando((v) => !v)}
                /* O rótulo lido em voz alta começa pela palavra que está
                   escrita no botão: quem navega por voz pede "Pronto", e um
                   nome acessível que não contém o texto visível é um comando
                   que não existe. */
                rotuloAcessivel={
                  apagando
                    ? "Pronto, sair do modo de apagar"
                    : "Apagar lançamentos desta lista"
                }
              >
                {apagando ? "Pronto" : "Apagar"}
              </BotaoAcao>
            )}
            {/* O único laranja sólido da tela. Dois competindo é o mesmo que
                nenhum. */}
            <BotaoAcao Icone={Plus} onClick={() => setAbrindo(true)}>
              Lançar
            </BotaoAcao>
          </div>
        }
      />

      {/* O saldo do mês em cima da lista. Sem ele a pessoa rola sessenta linhas
          para responder sozinha uma pergunta que o app já sabe. */}
      {dados.lancamentos.length > 0 && (
        <div className="mb-3">
          <NumeroHeroiDoMes
            ref_={ref}
            r={r}
            atrasadas={atrasadas.length}
            totalAtrasado={totalAtrasado}
            pctConfirmado={pctConfirmado}
            pagos={pagos}
            total={dados.lancamentos.length}
            temPrevisto={temPrevisto}
          />
        </div>
      )}

      {apagando && (
        /* Recado calmo, em gelo: vermelho nesta tela é do atraso, e um aviso
           inteiro em vermelho competiria justamente com as linhas que precisam
           ser vistas. A palavra "não dá para desfazer" faz o trabalho. */
        <Bloco tom="gelo" elevacao="plano" className="mb-3 px-3.5 py-2.5">
          <p role="status" className="text-2xs leading-relaxed text-muted-foreground">
            Toque na lixeira da linha para apagar.{" "}
            <b className="font-semibold text-primary">Não dá para desfazer</b> — e
            apagar um lançamento muda o saldo do mês.
          </p>
        </Bloco>
      )}

      {dados.lancamentos.length === 0 ? (
        <Vazio
          Icone={ListPlus}
          titulo={`Nada lançado em ${nomeDoMes(ref)}`}
          texto="Anote o que entrou e o que saiu. Leva alguns segundos e é o que faz o resto do app ter o que dizer."
          /* O vazio que ENSINA: os três passos são o formulário inteiro, e
             saber que são três (e não trinta) é o que convence a começar. */
          passos={[
            "Diga se saiu ou entrou — é o que muda todo o resto do formulário.",
            "Escreva quanto foi e o que era. A data já vem no dia de hoje.",
            "Se foi parcelado, diga em quantas vezes: o app cria todas de uma vez, e o mês que vem já nasce honesto.",
          ]}
          acao={
            <BotaoAcao Icone={Plus} onClick={() => setAbrindo(true)}>
              Lançar o primeiro
            </BotaoAcao>
          }
        />
      ) : (
        <div className="space-y-3">
          {[...porDia.entries()].map(([dia, itens], i) => {
            /* O total do dia no cabeçalho: é a pergunta que se faz olhando um
               dia inteiro ("quanto eu torrei na sexta?"), e somar de cabeça
               cinco linhas é trabalho que o app tem de fazer. Com centavo,
               porque ele tem de bater com as linhas logo abaixo. */
            const doDia = itens.reduce(
              (s, l) => s + (l.tipo === "receita" ? l.valor : -l.valor),
              0,
            );

            return (
              <Bloco
                key={dia}
                className="fin-entra overflow-hidden"
                style={{ "--fin-i": i } as React.CSSProperties}
              >
                <CabecalhoGrupo
                  /* Ciano: a faixa aqui separa dias, e dia é informação — não
                     é entrada nem saída de dinheiro. O mês inteiro em faixas da
                     mesma cor lê como extrato; uma cor por dia leria como caixa
                     de lápis. */
                  tom="info"
                  titulo={rotuloDoDia(dia, hojeISO, ontemISO)}
                  detalhe={
                    itens.length === 1 ? "1 lançamento" : `${itens.length} lançamentos`
                  }
                  total={`${doDia >= 0 ? "+" : "−"} ${brlExato(Math.abs(doDia))}`}
                />

                <ul className="divide-y divide-border/50">
                  {itens.map((l) => {
                    const atrasado =
                      !l.pago && l.tipo === "despesa" && l.data < hojeISO;

                    const cat = cats.get(l.categoria_id ?? "");
                    const conta = l.conta_id ? contas.get(l.conta_id) : undefined;

                    return (
                      /* O fundo gelo é o "ainda não aconteceu" da decisão 2.
                         Mora no `li` e não no texto: tingir a linha inteira
                         separa os dois mundos sem tirar contraste de nenhum
                         número. */
                      <li key={l.id} className={l.pago ? "" : "bg-gelo/50"}>
                        <CartaoTransacao
                          descricao={l.descricao}
                          valor={l.valor}
                          sinal={l.tipo === "receita" ? "entrada" : "saida"}
                          /* O `quando` da peça é o lugar do contexto curto da
                             linha. Aqui a data já é o cabeçalho do grupo, então
                             ele carrega a parcela — que era um selo cinza
                             espremido ao lado da descrição e cortava o nome. */
                          quando={
                            l.parcela_total
                              ? `parcela ${l.parcela_num} de ${l.parcela_total}`
                              : undefined
                          }
                          categoria={
                            [cat?.nome ?? "Sem categoria", conta?.nome]
                              .filter(Boolean)
                              .join(" · ")
                          }
                          cor={cat?.cor}
                          Icone={
                            l.tipo === "receita" ? ArrowUpRight : ArrowDownRight
                          }
                          estado={
                            atrasado
                              ? {
                                  tom: "atrasado" as const,
                                  texto: "atrasado",
                                  Icone: AlertTriangle,
                                }
                              : !l.pago
                                ? { tom: "previsto" as const, texto: "previsto" }
                                : undefined
                          }
                          acao={
                            apagando ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await apagarLancamento(l.id);
                                  carregar();
                                }}
                                aria-label={`Apagar ${l.descricao}`}
                                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              /* 44px: o gesto mais repetido do app não pode
                                 ser o mais fácil de errar. */
                              <button
                                type="button"
                                onClick={async () => {
                                  await alternarPago(l.id, !l.pago);
                                  carregar();
                                }}
                                aria-pressed={l.pago}
                                aria-label={
                                  l.pago
                                    ? `Marcar ${l.descricao} como previsto`
                                    : `Marcar ${l.descricao} como pago`
                                }
                                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                                  l.pago
                                    ? "text-success hover:bg-success/10"
                                    : "text-muted-foreground/60 hover:bg-muted hover:text-primary"
                                }`}
                              >
                                {l.pago ? (
                                  <Check className="h-4 w-4" strokeWidth={3} />
                                ) : (
                                  <CircleDashed className="h-4 w-4" strokeWidth={2} />
                                )}
                              </button>
                            )
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </Bloco>
            );
          })}
        </div>
      )}

      {abrindo && (
        <FormularioLancamento
          dados={dados}
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

// ────────────────────────────────────────────────────────────── O herói ─────

/**
 * O número do mês, e a única coisa escura da tela.
 *
 * O QUE ELE MEDE, e por que não é a sobra prevista do painel: aqui o número
 * tem de ser o que a lista logo abaixo SOMA — o que já entrou menos o que já
 * saiu. Se o topo dissesse a projeção e as linhas o realizado, os dois nunca
 * bateriam e a pessoa passaria o dia procurando o erro que não existe.
 *
 * O previsto não sumiu por isso: ele desceu para o rodapé do cartão, que é a
 * segunda leitura — o que ainda vai acontecer, e onde o mês termina se
 * acontecer. É a mesma informação do trio antigo, agora com ordem.
 */
function NumeroHeroiDoMes({
  ref_,
  r,
  atrasadas,
  totalAtrasado,
  pctConfirmado,
  pagos,
  total,
  temPrevisto,
}: {
  ref_: string;
  r: ReturnType<typeof resumirMes>;
  atrasadas: number;
  totalAtrasado: number;
  pctConfirmado: number;
  pagos: number;
  total: number;
  temPrevisto: boolean;
}) {
  const positivo = r.sobraRealizada >= 0;
  const mes = nomeDoMes(ref_).split(" de ")[0];

  return (
    <NumeroHeroi
      rotulo={
        positivo
          ? `Do que já entrou e saiu em ${mes}, sobrou`
          : `Do que já entrou e saiu em ${mes}, faltou`
      }
      valor={brl(Math.abs(r.sobraRealizada))}
      sinal={positivo ? "positivo" : "negativo"}
      explicacao={
        temPrevisto
          ? "Só o que já aconteceu: as linhas marcadas como pagas. O que ainda está previsto está aqui embaixo, e é ele que decide como o mês termina."
          : "Só o que já aconteceu. Neste mês não há nada previsto pendente — o que está na lista é tudo o que houve."
      }
      lateral={
        pctConfirmado > 0 || pagos > 0 ? (
          <AnelProgresso
            valor={pctConfirmado}
            rotulo="Do mês já confirmado"
            legenda={`${pagos} de ${total}`}
            sobre="escuro"
            tamanho={120}
          />
        ) : undefined
      }
      rodape={
        temPrevisto && (
          <div className="grid grid-cols-3 gap-3">
            <Previsto rotulo="Ainda a receber" valor={brl(r.aReceber)} />
            <Previsto rotulo="Ainda a pagar" valor={brl(r.aPagar)} />
            <Previsto
              rotulo={
                r.sobraPrevista >= 0 ? "O mês fecha com" : "O mês fecha faltando"
              }
              valor={brl(Math.abs(r.sobraPrevista))}
              negativo={r.sobraPrevista < 0}
            />
          </div>
        )
      }
    >
      <Pastilha tom="pago" Icone={ArrowUpRight} sobre="escuro">
        {brl(r.entrouRealizado)} entrou
      </Pastilha>
      <Pastilha tom="saida" Icone={ArrowDownRight} sobre="escuro">
        {brl(r.saiuRealizado)} saiu
      </Pastilha>
      {atrasadas > 0 && (
        /* A única coisa vermelha da tela. Vencida e não paga é a informação
           que gera juros — e vem com a palavra, porque a cor sozinha não avisa
           quem não a enxerga. */
        <Pastilha tom="atrasado" Icone={AlertTriangle} sobre="escuro">
          {atrasadas === 1
            ? `1 atrasada · ${brl(totalAtrasado)}`
            : `${atrasadas} atrasadas · ${brl(totalAtrasado)}`}
        </Pastilha>
      )}
    </NumeroHeroi>
  );
}

/** Uma coluna do rodapé do herói: o que ainda está por acontecer. */
function Previsto({
  rotulo,
  valor,
  negativo = false,
}: {
  rotulo: string;
  valor: string;
  negativo?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-2xs leading-snug text-white/60">{rotulo}</p>
      <p
        /* O vermelho claro é o mesmo do número do herói: o `destructive` da
           casa é para fundo branco e some sobre o navy. */
        className={`mt-0.5 font-display text-sm font-semibold tabular-nums ${
          negativo ? "text-[hsl(0_90%_82%)]" : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

/**
 * "hoje · terça, 12" — o cabeçalho de cada dia.
 *
 * Sem o mês e sem o ano: a barra de cima já diz qual mês está aberto, e
 * repetir "de março" em quinze faixas é gastar a largura da tela para dizer o
 * que ninguém perguntou. O "-feira" cai pelo mesmo motivo.
 */
function rotuloDoDia(dia: string, hojeISO: string, ontemISO: string) {
  // Meio-dia para o fuso não empurrar a data para o dia anterior.
  const d = new Date(`${dia}T12:00:00`);
  const semana = d
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace("-feira", "");
  const base = `${semana}, ${d.getDate()}`;

  if (dia === hojeISO) return `hoje · ${base}`;
  if (dia === ontemISO) return `ontem · ${base}`;
  return base;
}

// ─────────────────────────────────────────────────────────── O formulário ───

function FormularioLancamento({
  dados,
  aoFechar,
  aoSalvar,
}: {
  dados: Mes;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [categoriaId, setCategoriaId] = useState("");
  const [contaId, setContaId] = useState(dados.contas[0]?.id ?? "");
  const [pago, setPago] = useState(true);
  const [parcelas, setParcelas] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const doTipo = dados.categorias.filter((c) => c.tipo === tipo);

  // Trocar receita ⇄ despesa invalida a categoria escolhida: sem isto dá para
  // gravar um gasto na categoria "Salário".
  useEffect(() => {
    setCategoriaId(doTipo[0]?.id ?? "");
  }, [tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc fecha. Quem abre uma janela por engano no meio de uma lista longa
  // procura o Esc antes de procurar o botão.
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
      await salvarLancamento({
        tipo,
        descricao: descricao.trim(),
        valor: n,
        data,
        categoria_id: categoriaId || null,
        conta_id: contaId || null,
        cartao_id: null,
        pago,
        parcela_num: null,
        parcela_total: null,
        observacao: null,
        parcelas,
      });
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  /* A mesma tinta dos campos das outras telas, escrita uma vez. 44px de altura
     em todos: campo é alvo de toque, e alvo de toque não é lugar de economizar
     pixel. */
  const campo =
    "w-full min-h-11 rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-lancamento"
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
          id="titulo-lancamento"
          className="font-display text-lg font-semibold text-primary"
        >
          Novo lançamento
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          O que já aconteceu entra como pago; o que ainda vai acontecer entra
          como previsto e continua contando na projeção do mês.
        </p>

        {/* Entrada ou saída primeiro: é o que muda todo o resto do formulário.
            A pastilha escolhida sobe com a sombra da casa — era um `shadow-sm`
            avulso, a única sombra da tela que não vinha da folha do app. */}
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
              {t === "despesa" ? "Saiu" : "Entrou"}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-muted-foreground">Quanto</span>
          <div className="relative mt-1">
            {/* O "R$" fixo dentro do campo: o teclado do celular abre no
                numérico e ninguém precisa digitar o cifrão. */}
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-base font-semibold text-muted-foreground">
              R$
            </span>
            <input
              autoFocus
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="min-h-12 w-full rounded-xl border border-border py-3 pl-11 pr-3.5 font-display text-xl font-semibold tabular-nums text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">O que foi</span>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Mercado, aluguel, salário…"
            className={`mt-1 ${campo}`}
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Quando</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Categoria</span>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={`mt-1 bg-white ${campo}`}
            >
              {doTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">Conta</span>
          <select
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className={`mt-1 bg-white ${campo}`}
          >
            {dados.contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        {tipo === "despesa" && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-muted-foreground">
              Parcelas
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={parcelas}
              onChange={(e) => setParcelas(Math.max(1, Number(e.target.value)))}
              className={`mt-1 tabular-nums ${campo}`}
            />
            {parcelas > 1 && (
              <span className="mt-1.5 block rounded-lg bg-ciano-tint px-3 py-2 text-2xs leading-relaxed text-ciano-forte">
                Vão nascer {parcelas} lançamentos de{" "}
                {brlExato(Number(valor.replace(/\./g, "").replace(",", ".")) || 0)}
                , um por mês. As futuras entram como previstas.
              </span>
            )}
          </label>
        )}

        <label className="mt-4 flex min-h-11 items-center gap-2.5">
          <input
            type="checkbox"
            checked={pago}
            onChange={(e) => setPago(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[hsl(16_80%_44%)]"
          />
          <span className="text-sm text-foreground">
            {tipo === "receita" ? "Já caiu na conta" : "Já foi pago"}
          </span>
        </label>

        {dados.contas.length === 0 && (
          /* Ciano, não laranja: é informação sobre o estado das coisas, não
             uma ação nem um gasto. Laranja aqui competiria com o único botão
             que a pessoa precisa achar. */
          <p className="mt-4 rounded-xl bg-ciano-tint px-3.5 py-2.5 text-2xs leading-relaxed text-ciano-forte">
            Você ainda não tem conta cadastrada. Dá para lançar mesmo assim, mas
            o saldo só aparece depois que existir uma conta.
          </p>
        )}

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        {/* O rodapé é `BotaoAcao` como no resto do app: era o mesmo botão
            redesenhado à mão, com a sombra laranja copiada. Uma tinta só, num
            lugar só. */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <BotaoAcao variante="contorno" larguraTotal onClick={aoFechar}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            larguraTotal
            desabilitado={salvando || !descricao.trim() || !valor}
          >
            {salvando ? "Salvando…" : "Lançar"}
          </BotaoAcao>
        </div>
      </form>
    </div>
  );
}
