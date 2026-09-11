"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Equal,
  FileQuestion,
  Plus,
  RotateCcw,
  Send,
  Undo2,
} from "lucide-react";

import { faltaTabela } from "@/lib/fincash/erros";
import { nomeDoMes, refDoMes } from "@/lib/fincash/modelo";
import {
  aplicar,
  carregarPonte,
  desfazerLote,
  type DadosDaPonte,
  type Escolhas,
  type EstadoPonte,
  type LadoALado,
  type ResultadoAplicar,
} from "@/lib/fincash/ponte-banco";
import {
  contarSituacoes,
  escolhaPadrao,
  type Diferenca,
} from "@/lib/fincash/ponte-planejamento";
import {
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  brlExato,
  CabecalhoTela,
  Esqueleto,
  NavegadorMes,
  Pastilha,
  Vazio,
} from "../pecas";

/**
 * "Levar meu mês para o Planejamento" — a ponte, do lado de quem usa.
 *
 * A TELA INTEIRA EXISTE POR CAUSA DE UMA COLUNA: a do meio, onde o número que
 * está hoje no Planejamento aparece ao lado do número que o FINCASH mediu. Sem
 * ela, isto seria um botão de importar — e botão de importar, num app de
 * dinheiro, é o que troca em silêncio o número em cima do qual um consultor
 * escreveu a revisão trimestral que o cliente pagou.
 *
 * POR QUE A PONTE MORA AQUI, E NÃO NO PLANEJAMENTO
 * Porque a direção é única: o FINCASH tem o número medido, o Planejamento tem o
 * lembrado. Quem puxa é quem tem o dado bom. E nenhuma tela do Planejamento foi
 * tocada neste trabalho — a gravação usa o caminho que já existe (as mesmas
 * tabelas, as mesmas colunas, a mesma RLS).
 *
 * O QUE ESTA TELA SE RECUSA A FAZER
 *
 * 1. **Marcar divergência sozinha.** Linha que já tem valor lá nasce
 *    DESMARCADA, sempre — e o `aplicar` recusa o lote inteiro se alguma
 *    aparecer marcada sem ter passado pelo dedo da pessoa.
 * 2. **Sincronizar no fundo.** Nada aqui roda sem alguém apertar o botão. Não
 *    há efeito que grave, nem "manter atualizado".
 * 3. **Jogar o que não casa em "Outros".** Categoria do FINCASH sem
 *    equivalente aparece numa lista própria, com nome e valor, e fica de fora
 *    da conta até alguém decidir o que fazer com ela.
 */

export default function PontePlanejamentoPage() {
  const hoje = refDoMes();
  const [ref, setRef] = useState(hoje);
  const [estado, setEstado] = useState<EstadoPonte | null>(null);
  const [sqlFaltando, setSqlFaltando] = useState(false);

  /** O que vai. Nasce de `escolhaPadrao` e só muda por toque. */
  const [escolhas, setEscolhas] = useState<Escolhas>({});
  /** O que a PESSOA marcou com o dedo. Espelha `escolhas`, mas só cresce por
      clique — é o que `aplicar` confere contra o estado antes de gravar. */
  const [explicitas, setExplicitas] = useState<Escolhas>({});

  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAplicar | null>(null);
  const [desfazendo, setDesfazendo] = useState(false);

  const carregar = useCallback(async () => {
    setEstado(null);
    setResultado(null);
    try {
      const novo = await carregarPonte(ref);
      setEstado(novo);
      if (novo.tipo === "ok") {
        const todas = novo.dados.secoes.flatMap((s) => s.diferencas);
        setEscolhas(escolhaPadrao(todas));
        setExplicitas({});
      }
    } catch (e) {
      if (faltaTabela(e)) setSqlFaltando(true);
      else
        setEstado({
          tipo: "erro",
          mensagem: (e as { message?: string }).message ?? "Não consegui carregar.",
        });
    }
  }, [ref]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alternar(chave: string) {
    setEscolhas((e) => ({ ...e, [chave]: !e[chave] }));
    /* Só cresce: uma chave que passou pelo dedo continua marcada como
       explícita mesmo se a pessoa desmarcar e remarcar. O que a trava precisa
       saber é se HOUVE decisão humana, não qual foi a última. */
    setExplicitas((e) => ({ ...e, [chave]: true }));
  }

  async function enviar(dados: DadosDaPonte) {
    setEnviando(true);
    const r = await aplicar(dados, escolhas, explicitas);
    setEnviando(false);
    setResultado(r);
    if (!r.erro) carregar();
  }

  async function desfazer(loteId: string) {
    setDesfazendo(true);
    const { erro } = await desfazerLote(loteId);
    setDesfazendo(false);
    if (erro) setResultado({ gravadas: 0, atualizadas: 0, loteId: null, erro });
    else {
      setResultado(null);
      carregar();
    }
  }


  const cabecalho = (
    <CabecalhoTela
      chapeu="FINCASH → Planejamento"
      titulo="Levar meu mês para o Planejamento"
      resumo="O FINCASH tem o número medido, lançamento a lançamento. O Planejamento tem o que você digitou de cabeça. Aqui você vê os dois lado a lado e escolhe, item a item, o que vale."
      Icone={Send}
    />
  );

  if (estado === null)
    return (
      <div className="surgir">
        {cabecalho}
        <Esqueleto forma="lista" />
      </div>
    );

  if (sqlFaltando || estado.tipo === "falta-sql")
    return (
      <AvisoSQL
        arquivo="supabase/fincash_ponte.sql"
        oQue="A ponte com o Planejamento"
      />
    );

  if (estado.tipo === "sem-sessao")
    return (
      <div className="surgir">
        {cabecalho}
        <AvisoErro mensagem="Sua sessão expirou. Entre de novo para continuar." />
      </div>
    );

  if (estado.tipo === "erro")
    return (
      <div className="surgir">
        {cabecalho}
        <AvisoErro mensagem={estado.mensagem} />
      </div>
    );

  /* Sem ficha de cliente: o FINCASH é por usuário, o Planejamento é por ficha,
     e a ficha nasce do lado de lá. A ponte NÃO abre ficha por conta própria —
     ver a nota em `ponte-banco.ts`. Dizer o que falta e para onde ir vale mais
     que um botão que a RLS recusaria. */
  if (estado.tipo === "sem-ficha")
    return (
      <div className="surgir">
        {cabecalho}
        <Vazio
          Icone={FileQuestion}
          titulo="Você ainda não tem uma ficha no Planejamento"
          texto="O FINCASH funciona sozinho, com a sua conta. O Planejamento Financeiro trabalha sobre uma ficha de cliente — e a sua ainda não foi aberta. Sem ela não existe para onde levar estes números."
          passos={[
            "Abra o Planejamento Financeiro e faça o primeiro acesso: é ele que cria a sua ficha.",
            "Se a sua conta é de equipe da Novare, não haverá ficha — contas administrativas não têm planejamento pessoal.",
            "Se já fez isso e continua aparecendo esta mensagem, fale com a Novare: a ficha pode ter sido aberta com outro e-mail.",
          ]}
          acao={
            <BotaoAcao href="/planejamento/app" Icone={ArrowRight}>
              Abrir o Planejamento
            </BotaoAcao>
          }
        />
      </div>
    );

  const { dados } = estado;
  const todas = dados.secoes.flatMap((s) => s.diferencas);
  const contagem = contarSituacoes(todas);
  const marcadas = todas.filter((d) => escolhas[d.chave]).length;
  const nadaAMostrar = todas.length === 0 && dados.fincash.semCasa.length === 0;

  return (
    <div className="surgir">
      {cabecalho}

      <NavegadorMes mes={ref} aoMudar={setRef} nome={nomeDoMes(ref)} hoje={hoje} />

      <Bloco tom="gelo" elevacao="plano" className="mb-4 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Neste mês o FINCASH mediu{" "}
          <strong className="text-primary">{brlExato(dados.entrou)}</strong> de entrada e{" "}
          <strong className="text-primary">{brlExato(dados.saiu)}</strong> de saída, em{" "}
          {dados.fincash.lancamentosLidos} lançamento(s) já pagos. Previsto não entra:
          o que a ponte leva é o que aconteceu.
        </p>
      </Bloco>

      {resultado && (
        <ResultadoDoEnvio
          resultado={resultado}
          desfazendo={desfazendo}
          aoDesfazer={desfazer}
        />
      )}

      {nadaAMostrar ? (
        <Vazio
          Icone={CircleAlert}
          titulo="Não há nada medido neste mês"
          texto="Sem lançamento pago, sem dívida ativa e sem investimento, não existe retrato para levar. Escolha outro mês ou volte depois de lançar."
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2" role="status">
            <Pastilha tom="previsto" Icone={Plus}>
              {contagem.novo} novo(s)
            </Pastilha>
            <Pastilha tom="aviso" Icone={CircleAlert}>
              {contagem.divergente} diferente(s)
            </Pastilha>
            <Pastilha tom="neutro" Icone={Equal}>
              {contagem.igual} igual(is)
            </Pastilha>
          </div>

          {dados.secoes.map((secao) => (
            <SecaoLadoALado
              key={secao.secao}
              secao={secao}
              escolhas={escolhas}
              aoAlternar={alternar}
            />
          ))}

          {dados.fincash.semCasa.length > 0 && <SemCasa itens={dados.fincash.semCasa} />}

          <div className="sticky bottom-20 z-10 mt-5 lg:bottom-4">
            <Bloco className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-xs text-muted-foreground">
                {marcadas === 0
                  ? "Nada marcado — nada vai."
                  : `${marcadas} linha(s) marcada(s) para ir.`}
              </p>
              <div className="flex gap-2">
                <BotaoAcao variante="contorno" Icone={RotateCcw} onClick={carregar}>
                  Reler
                </BotaoAcao>
                <BotaoAcao
                  Icone={Send}
                  desabilitado={marcadas === 0 || enviando}
                  onClick={() => enviar(dados)}
                >
                  {enviando ? "Levando…" : "Levar para o Planejamento"}
                </BotaoAcao>
              </div>
            </Bloco>
          </div>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────── Seções ──────

function SecaoLadoALado({
  secao,
  escolhas,
  aoAlternar,
}: {
  secao: LadoALado;
  escolhas: Escolhas;
  aoAlternar: (chave: string) => void;
}) {
  /* Divergente primeiro, igual por último: a ordem da tela é a ordem da
     atenção. O que já está igual não precisa ser olhado, e empurrá-lo para o
     fim é o que faz as três linhas que importam caberem sem rolagem. */
  const ordenadas = useMemo(() => {
    const peso = { divergente: 0, novo: 1, igual: 2 } as const;
    return [...secao.diferencas].sort((a, b) => peso[a.situacao] - peso[b.situacao]);
  }, [secao.diferencas]);

  if (ordenadas.length === 0) return null;

  return (
    <section className="mb-4">
      <h2 className="mb-2 font-display text-sm font-semibold text-primary">
        {secao.titulo}
      </h2>
      <Bloco className="divide-y divide-border/60">
        {ordenadas.map((d) => (
          <LinhaDiferenca
            key={d.chave}
            d={d}
            marcada={!!escolhas[d.chave]}
            aoAlternar={() => aoAlternar(d.chave)}
          />
        ))}
      </Bloco>
    </section>
  );
}

/** Cada situação tem palavra, ícone e posição — nunca só cor. Verde e vermelho
    sozinhos deixam a tela ilegível para quem não distingue os dois, que é
    justamente parte do público que mexe em planilha. */
const SITUACAO = {
  novo: { rotulo: "Novo", Icone: Plus, tom: "previsto" as const },
  divergente: { rotulo: "Diferente", Icone: CircleAlert, tom: "aviso" as const },
  igual: { rotulo: "Igual", Icone: Equal, tom: "neutro" as const },
};

function LinhaDiferenca({
  d,
  marcada,
  aoAlternar,
}: {
  d: Diferenca;
  marcada: boolean;
  aoAlternar: () => void;
}) {
  const s = SITUACAO[d.situacao];
  const idDescricao = `ponte-${d.chave.replace(/[^a-z0-9]/gi, "-")}`;

  return (
    <div className="flex flex-wrap items-start gap-3 p-3.5 sm:flex-nowrap sm:items-center">
      {/* 44px de alvo mesmo com a caixa de 18px: a área de toque é o rótulo
          inteiro, e não o quadradinho. */}
      <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={marcada}
          onChange={aoAlternar}
          disabled={d.situacao === "igual"}
          aria-describedby={idDescricao}
          className="h-[18px] w-[18px] cursor-pointer rounded border-border accent-[hsl(16_80%_45%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ciano-forte disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span className="sr-only">
          Levar {d.rotulo} para o Planejamento
          {d.situacao === "divergente"
            ? ` — atenção: isto substitui ${brlExato(d.valorAtual ?? 0)} por ${brlExato(d.valorFincash)}`
            : ""}
        </span>
      </label>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary" id={idDescricao}>
          {d.rotulo}
        </p>
        {d.detalhe && (
          <p className="mt-0.5 truncate text-2xs text-muted-foreground">{d.detalhe}</p>
        )}
      </div>

      {/* O LADO A LADO. No celular as duas colunas empilham, e a seta vira o
          separador — sem ela, "1.200 900" lido de cima para baixo não diz qual
          substitui qual. */}
      <div className="flex shrink-0 items-center gap-2 text-right">
        <div className="min-w-[6.5rem]">
          <p className="text-2xs text-muted-foreground">No Planejamento</p>
          <p className="text-sm font-semibold tabular-nums text-muted-foreground">
            {d.valorAtual === null ? "—" : brlExato(d.valorAtual)}
          </p>
        </div>
        <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-[6.5rem]">
          <p className="text-2xs text-muted-foreground">No FINCASH</p>
          <p className="text-sm font-bold tabular-nums text-primary">
            {brlExato(d.valorFincash)}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <Pastilha tom={s.tom} Icone={s.Icone}>
          {s.rotulo}
        </Pastilha>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────── Sem casa ──────

function SemCasa({
  itens,
}: {
  itens: { nome: string; total: number; motivo: string | null }[];
}) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 font-display text-sm font-semibold text-primary">
        O que não tem lugar no Planejamento
      </h2>
      <Bloco tom="gelo" elevacao="plano" className="p-4">
        <p className="mb-3 max-w-prose text-xs leading-relaxed text-muted-foreground">
          Estas categorias do FINCASH não foram levadas. Elas não somem daqui e
          não foram jogadas em &ldquo;Outros&rdquo;: empurrar o desconhecido
          para o balde faria o retrato fechar bonito e mentir. Se alguma delas
          deveria ir, ajuste a categoria no FINCASH ou lance a despesa direto em
          Meus Dados.
        </p>
        <ul className="space-y-2">
          {itens.map((i) => (
            <li key={i.nome} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-primary">{i.nome}</span>
              <span className="tabular-nums text-muted-foreground">
                {brlExato(i.total)}
              </span>
              {i.motivo && (
                <span className="w-full text-2xs leading-relaxed text-muted-foreground">
                  {i.motivo}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Bloco>
    </section>
  );
}

// ─────────────────────────────────────────────────────────── Resultado ──────

/**
 * O que foi gravado — e o caminho de volta, na mesma tela.
 *
 * O "desfazer" fica AQUI, e não escondido num histórico: o momento em que a
 * pessoa descobre que levou o número errado é o segundo seguinte ao envio. Se
 * a volta custar uma navegação, ela não acontece.
 */
function ResultadoDoEnvio({
  resultado,
  desfazendo,
  aoDesfazer,
}: {
  resultado: ResultadoAplicar;
  desfazendo: boolean;
  aoDesfazer: (loteId: string) => void;
}) {
  if (resultado.erro)
    return (
      <div
        role="status"
        className="mb-4 rounded-2xl border border-destructive/25 bg-white p-4"
      >
        <p className="font-display text-sm font-semibold text-destructive">
          Não deu certo
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {resultado.erro}
        </p>
      </div>
    );

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-white p-4"
    >
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Check aria-hidden className="h-4 w-4 text-success-strong" />
        <span>
          <strong className="text-primary">{resultado.gravadas}</strong> linha(s)
          criada(s) e <strong className="text-primary">{resultado.atualizadas}</strong>{" "}
          atualizada(s) no Planejamento.
        </span>
      </p>
      {resultado.loteId && (
        <BotaoAcao
          variante="contorno"
          Icone={Undo2}
          desabilitado={desfazendo}
          onClick={() => aoDesfazer(resultado.loteId as string)}
        >
          {desfazendo ? "Desfazendo…" : "Desfazer este envio"}
        </BotaoAcao>
      )}
    </div>
  );
}
