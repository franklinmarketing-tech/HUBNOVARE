"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import {
  AlertTriangle,
  Archive,
  CalendarOff,
  Check,
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  AnelProgresso,
  AvisoErro,
  AvisoSQL,
  BarrasMes,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoTela,
  CartaoNumero,
  CartaoPainel,
  DiscoIcone,
  Esqueleto,
  Medidor,
  NumeroHeroi,
  Pastilha,
  Vazio,
  type PontoMes,
} from "../pecas";
import {
  DetalheMeta,
  FormularioAporte,
  FormularioMeta,
  dataCurta,
  iconeDaMeta,
  mesAno,
  ROTULO_STATUS,
  tomDaPrioridade,
} from "./pecas-metas";
import {
  aportesPorMes,
  carregarMetas,
  comprometimentoDeMetas,
  progressoDasMetas,
  ROTULO_PRIORIDADE,
  type Aporte,
  type Meta,
  type ProgressoMeta,
} from "@/lib/fincash/metas";
import {
  carregarMes,
  mesVizinho,
  mesesEntre,
  refDaData,
  refDoMes,
  resumirMes,
  type Conta,
} from "@/lib/fincash/modelo";
import {
  carregarInvestimentos,
  type Investimento,
} from "@/lib/fincash/investimentos";

/**
 * Metas — onde a tese do produto vira número.
 *
 * A TESE: separe o dinheiro dos seus objetivos primeiro, o resto se encaixa. E
 * a única forma de isso sair do discurso é a tela responder, para cada meta,
 * QUANTO SEPARAR POR MÊS — e depois somar esses quanto e dizer se eles cabem na
 * renda. Barra de progresso bonita sem esses dois números é decoração: a pessoa
 * olha, acha bonito, e não guarda nada.
 *
 * AS DUAS COISAS QUE ESTA TELA SE RECUSA A FAZER
 *
 * 1. **Consolar.** Meta atrasada é dita com todas as letras, com a previsão
 *    real no ritmo atual ("nesse ritmo você chega em mar/2028, sete meses
 *    depois do prazo"). App que suaviza o atraso vira aplicativo de
 *    autoajuda — a pessoa se sente bem, não muda nada, e descobre no prazo.
 *
 * 2. **Fingir que meta sem prazo é meta.** Sem data não existe "quanto por
 *    mês", e o motor devolve `null` em vez de inventar. A tela diz o que isso
 *    significa (é um desejo) e oferece o conserto (definir a data), em vez de
 *    mostrar um campo vazio que a pessoa lê como bug.
 *
 * O ALARME QUE FALTA EM TODO CONCORRENTE é o medidor do topo. Cada meta,
 * sozinha, parece razoável; cinco metas razoáveis somam 60% da renda e nenhuma
 * acontece. Ver a soma ANTES permite escolher qual esperar — que é uma decisão
 * possível. Descobrir depois, não.
 */
export default function MetasPage() {
  const [progressos, setProgressos] = useState<ProgressoMeta[] | null>(null);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  /** A receita prevista do mês corrente — a base do comprometimento. */
  const [renda, setRenda] = useState(0);
  const [contas, setContas] = useState<Conta[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Meta | null>(null);
  const [aportando, setAportando] = useState<Meta | null>(null);
  /* O detalhe guarda o ID, e não a meta: assim ele continua apontando para o
     dado recém-recarregado depois de um aporte, em vez de exibir a foto velha
     que estava na memória quando abriu. */
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      /* A renda vem do mês corrente e viaja JUNTO das metas, não depois: sem
         ela o medidor de comprometimento não existe, e ele é metade do que esta
         tela tem a dizer. O `catch` local é para o mês não derrubar a lista de
         metas — sem renda a tela ainda serve, sem metas não. */
      const [dados, mes] = await Promise.all([
        carregarMetas(),
        carregarMes(refDoMes()).catch(() => null),
      ]);

      setProgressos(progressoDasMetas(dados.metas, dados.aportes));
      setAportes(dados.aportes);
      setErro(null);

      if (mes) {
        /* PREVISTO, e não realizado: no dia 3 do mês o realizado é quase zero e
           o comprometimento apareceria como 400% da renda. O previsto é a renda
           do mês como ela vai fechar — que é contra o que a meta compete. */
        setRenda(resumirMes(mes.lancamentos).entrouPrevisto);
        setContas(mes.contas);
      }

      // Só serve para o vínculo no formulário: se a tabela não existir ainda,
      // a tela inteira não pode cair por causa de um `select` opcional.
      carregarInvestimentos()
        .then(setInvestimentos)
        .catch(() => setInvestimentos([]));
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setErro(
        faltaTabela(err) ? "FALTA_SQL" : (err.message ?? "Não consegui carregar."),
      );
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const porMes = useMemo(() => aportesPorMes(aportes), [aportes]);

  if (erro === "FALTA_SQL")
    return <AvisoSQL arquivo="supabase/fincash_v2.sql" oQue="As metas" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  /* "cartoes": a tela nasce como uma grade de metas, não como o painel. O
     esqueleto com a forma errada promete um layout e entrega outro — e aí a
     página pula na chegada do dado, que é justamente o que ele evita. */
  if (!progressos) return <Esqueleto forma="cartoes" linhas={4} />;

  /* A ordem vem do motor (prioridade, depois prazo mais apertado, encerradas no
     fim) e é respeitada: reordenar aqui seria discordar da tela em silêncio. */
  const vivas = progressos.filter(
    (p) => p.meta.status === "ativa" || p.meta.status === "pausada",
  );
  const encerradas = progressos.filter(
    (p) => p.meta.status === "concluida" || p.meta.status === "cancelada",
  );

  const comprometimento = comprometimentoDeMetas(progressos, renda);
  const guardado = vivas.reduce((s, p) => s + p.acumulado, 0);
  const falta = vivas.reduce((s, p) => s + p.falta, 0);
  /* Quanto do caminho já foi andado, somando todas as metas vivas. Serve só
     para o filete dos dois cartões abaixo — o progresso de CADA meta continua
     vindo do motor, meta a meta, no anel do cartão dela. */
  const fatiaGuardada =
    guardado + falta > 0 ? (guardado / (guardado + falta)) * 100 : 0;

  const detalhe = detalheId
    ? (progressos.find((p) => p.meta.id === detalheId) ?? null)
    : null;

  const seisMeses: PontoMes[] = Array.from({ length: 6 }, (_, i) => {
    const ref = mesVizinho(refDoMes(), i - 5);
    const realizado = Math.max(0, porMes[ref] ?? 0);
    /* Mesmo cuidado do detalhe: o teto acompanha o realizado quando ele passa
       do plano, porque a peça pinta o excedente de vermelho — e guardar mais do
       que o combinado não é um alarme. */
    return {
      ref,
      realizado,
      planejado: Math.max(comprometimento.necessarioMensal, realizado),
    };
  });

  return (
    <div className="surgir">
      <CabecalhoTela
        chapeu="Pague seus sonhos primeiro"
        titulo="Metas"
        resumo="Separe o dinheiro dos seus objetivos antes do resto. Aqui isso vira um número por mês — e a gente diz se ele cabe na sua renda."
        acao={
          <BotaoAcao Icone={Plus} onClick={() => setCriando(true)}>
            Nova meta
          </BotaoAcao>
        }
      />

      {progressos.length === 0 ? (
        <Vazio
          Icone={Target}
          titulo="Nenhuma meta ainda"
          texto="Entrada do apartamento, viagem, reserva de emergência. Com valor e prazo, o app te diz quanto separar por mês — que é o que faz a meta sair do papel."
          acao={
            <BotaoAcao Icone={Plus} onClick={() => setCriando(true)}>
              Criar a primeira meta
            </BotaoAcao>
          }
        />
      ) : (
        <>
          {/* Só quando existe meta ATIVA: com tudo pausado não há nada a
              comprometer, e um medidor em zero afirmaria uma folga que a
              pessoa não conquistou — ela só adiou. */}
          <Sintese
            comprometimento={comprometimento}
            temMetaAtiva={progressos.some((p) => p.meta.status === "ativa")}
          />

          {/* A mesma barra nos dois cartões, sobre a MESMA base (guardado +
              falta): é o que faz os dois filetes serem lidos como as duas
              metades de um todo em vez de duas medidas soltas. */}
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <CartaoNumero
              rotulo="Já guardado nas metas em andamento"
              valor={brl(guardado)}
              tom="bom"
              Icone={PiggyBank}
              barra={{ pct: fatiaGuardada, cor: "var(--color-success)" }}
              detalhe="Valor inicial mais aportes, menos resgates — recalculado a cada visita."
            />
            <CartaoNumero
              rotulo="Ainda falta"
              valor={brl(falta)}
              tom="info"
              Icone={TrendingUp}
              barra={{ pct: 100 - fatiaGuardada }}
              detalhe={
                vivas.length === 1
                  ? "para a sua meta"
                  : `para as suas ${vivas.length} metas em andamento`
              }
            />
          </div>

          {aportes.length > 0 && (
            <CartaoPainel
              titulo="O que você guardou"
              Icone={PiggyBank}
              tom="bom"
              total={brl(guardado)}
              detalhe="todas as metas somadas, mês a mês"
              className="mb-3"
            >
              <p className="mb-4 max-w-prose text-xs leading-relaxed text-muted-foreground">
                {comprometimento.necessarioMensal > 0
                  ? `A parte clara é o que faltou para cumprir o plano de hoje (${brl(comprometimento.necessarioMensal)} por mês).`
                  : "Sem meta com prazo, não há plano para comparar — o que se vê é só o que você guardou."}
              </p>
              <BarrasMes
                meses={seisMeses}
                formatar={brl}
                rotuloRealizado="Guardado"
                rotuloPlanejado="Plano de hoje"
                destaque={refDoMes()}
              />
            </CartaoPainel>
          )}

          {vivas.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-2">
              {vivas.map((p) => (
                <CartaoMeta
                  key={p.meta.id}
                  p={p}
                  aoAportar={() => setAportando(p.meta)}
                  aoAbrir={() => setDetalheId(p.meta.id)}
                  aoDefinirPrazo={() => setEditando(p.meta)}
                />
              ))}
            </div>
          )}

          {/* Cabeçalho LEVE, e não a faixa colorida: a faixa é para tabela
              longa, onde ela orienta o olho que rola. Aqui são duas ou três
              linhas embaixo de uma grade de cartões — uma faixa navy a mais
              disputaria com o herói lá em cima, e num app claro dois blocos
              escuros já são uma listra. */}
          {encerradas.length > 0 && (
            <CartaoPainel
              titulo="Encerradas"
              Icone={Archive}
              tom="neutro"
              detalhe={
                encerradas.length === 1 ? "1 meta" : `${encerradas.length} metas`
              }
              className="mt-3"
              corpoSemPadding
            >
              <ul className="divide-y divide-border/50">
                {encerradas.map((p) => (
                  <li
                    key={p.meta.id}
                    className="flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5"
                  >
                    <DiscoIcone
                      Icone={iconeDaMeta(p.meta.icone)}
                      cor={p.meta.cor}
                      tamanho="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{p.meta.nome}</p>
                      <p className="mt-0.5 text-2xs tabular-nums text-muted-foreground">
                        {brl(p.acumulado)} de {brl(p.meta.valor_alvo)}
                      </p>
                    </div>
                    <Pastilha tom={p.meta.status === "concluida" ? "pago" : "neutro"}>
                      {ROTULO_STATUS[p.meta.status]}
                    </Pastilha>
                    <BotaoAcao
                      variante="fantasma"
                      tamanho="sm"
                      onClick={() => setDetalheId(p.meta.id)}
                      rotuloAcessivel={`Ver o histórico da meta ${p.meta.nome}`}
                    >
                      Ver
                    </BotaoAcao>
                  </li>
                ))}
              </ul>
            </CartaoPainel>
          )}
        </>
      )}

      {criando && (
        <FormularioMeta
          contas={contas}
          investimentos={investimentos}
          aoFechar={() => setCriando(false)}
          aoSalvar={async () => {
            setCriando(false);
            await carregar();
          }}
        />
      )}

      {editando && (
        <FormularioMeta
          meta={editando}
          contas={contas}
          investimentos={investimentos}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            setEditando(null);
            await carregar();
          }}
        />
      )}

      {aportando && (
        <FormularioAporte
          meta={aportando}
          aoFechar={() => setAportando(null)}
          aoSalvar={async () => {
            setAportando(null);
            await carregar();
          }}
        />
      )}

      {detalhe && (
        <DetalheMeta
          p={detalhe}
          aportes={aportes.filter((a) => a.meta_id === detalhe.meta.id)}
          contas={contas}
          investimentos={investimentos}
          aoFechar={() => setDetalheId(null)}
          aoMudar={carregar}
          aoEditar={() => {
            setDetalheId(null);
            setEditando(detalhe.meta);
          }}
          aoAportar={() => {
            setDetalheId(null);
            setAportando(detalhe.meta);
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────── O alarme de "não cabe" ──────

const FAIXA = {
  folgado: {
    frase:
      "Cabe com folga. A referência da casa é 20% da renda para o futuro — e nela ainda tem de caber a aposentadoria.",
  },
  apertado: {
    frase:
      "Já disputa com as necessidades. Dá, mas sem margem para imprevisto: um mês ruim derruba o plano.",
  },
  irreal: {
    frase:
      "Acima de 30% o plano costuma ser abandonado no segundo mês — e junto com ele vão todas as metas, não só a mais cara. Pause a menos urgente em vez de falhar em todas.",
  },
  sem_renda: { frase: "" },
} as const;

/**
 * O bloco do topo: o número da tese, e se ele cabe.
 *
 * O NÚMERO GRANDE É A SOMA DOS APORTES NECESSÁRIOS, não o total das metas.
 * "Você quer R$ 180 mil" não cabe na cabeça de ninguém e não dá o que fazer
 * hoje; "separe R$ 1.240 por mês" cabe, e é uma decisão de amanhã de manhã.
 *
 * Metas PAUSADAS não entram — é o motor que decide isso, e de propósito:
 * pausar é a saída de quem viu este número alto demais, e ela precisa fazer o
 * número cair na hora.
 */
function Sintese({
  comprometimento: c,
  temMetaAtiva,
}: {
  comprometimento: ReturnType<typeof comprometimentoDeMetas>;
  temMetaAtiva: boolean;
}) {
  const pct = c.fracao * 100;
  const sobra = c.renda - c.necessarioMensal;
  /* Nenhuma meta ativa com prazo: o motor devolve zero, e "separe R$ 0 por
     mês" seria uma resposta com cara de conta feita. O bloco troca de assunto
     e diz o que está faltando para o número existir. */
  const semNumero = c.necessarioMensal <= 0;

  if (!temMetaAtiva) return null;

  if (semNumero)
    return (
      <Bloco className="mb-3 p-5 sm:p-6">
        <p className="font-display text-base font-semibold text-primary">
          Ainda não há um quanto-por-mês
        </p>
        <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
          Nenhuma das suas metas ativas tem prazo — e é o prazo que transforma o
          valor do sonho num número de mês. Defina uma data em pelo menos uma
          delas e este bloco passa a dizer quanto separar, e se isso cabe na sua
          renda.
        </p>
      </Bloco>
    );

  return (
    <div className="mb-3">
      <NumeroHeroi
        rotulo="Para todas as suas metas ativas acontecerem, separe por mês"
        valor={brl(c.necessarioMensal)}
        /* Neutro, e nunca "negativo": este número não é uma perda, é o preço
           do plano. Quem julga se ele cabe são as pastilhas e a frase da
           faixa — vermelho aqui chamaria de erro uma meta ambiciosa. */
        sinal="neutro"
        explicacao={
          c.faixa === "sem_renda"
            ? "Ainda não sei quanto você recebe neste mês, então não dá para dizer se isso cabe. Lance o salário (ou cadastre-o em Contas fixas) e este bloco passa a te avisar quando você planejar mais do que a renda aguenta."
            : FAIXA[c.faixa].frase
        }
        /* Sem renda não há medidor: ponteiro sobre uma divisão por zero é um
           desenho que afirma alguma coisa sem saber de nada. */
        lateral={
          c.renda > 0 && (
            <Medidor
              valor={pct}
              rotulo="da sua renda comprometida com metas"
              sobre="escuro"
              compacto
            />
          )
        }
        /* Quem pesa mais, no pé do cartão. Só aparece quando há mais de uma
           meta disputando — com uma só, a lista repetiria o número grande. */
        rodape={
          c.porMeta.length > 1 && c.renda > 0 ? (
            <ul className="space-y-1.5">
              {[...c.porMeta]
                .sort((a, b) => b.necessario - a.necessario)
                .slice(0, 4)
                .map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-2xs">
                    <span className="min-w-0 flex-1 truncate text-white/65">
                      {m.nome}
                    </span>
                    <span className="shrink-0 tabular-nums text-white">
                      {brl(m.necessario)}/mês
                    </span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-white/55">
                      {Math.round(m.fracao * 100)}% da renda
                    </span>
                  </li>
                ))}
            </ul>
          ) : undefined
        }
      >
        {c.faixa !== "sem_renda" && (
          <>
            <Pastilha tom="previsto" sobre="escuro">
              renda prevista {brl(c.renda)}
            </Pastilha>
            {sobra >= 0 ? (
              <Pastilha tom="pago" sobre="escuro">
                sobram {brl(sobra)} para o mês
              </Pastilha>
            ) : (
              <Pastilha tom="atrasado" sobre="escuro" Icone={AlertTriangle}>
                faltam {brl(-sobra)}
              </Pastilha>
            )}
            {/* A faixa "irreal" perdeu o texto vermelho ao subir para o navy —
                então ela vira PALAVRA numa pastilha. Cor nunca foi o recado
                aqui, e num fundo escuro ela seria menos ainda. */}
            {c.faixa === "irreal" && (
              <Pastilha tom="aviso" sobre="escuro" Icone={AlertTriangle}>
                {Math.round(pct)}% da renda — plano de risco
              </Pastilha>
            )}
          </>
        )}
      </NumeroHeroi>

      {c.faixa !== "sem_renda" && (
        <p className="mt-2 max-w-prose px-1 text-2xs leading-relaxed text-muted-foreground">
          As faixas são opinião nossa, vindas da leitura 50/30/20 que o
          Orçamento usa: até 15% é confortável, até 30% aperta.
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────── Cartão da meta ────

/**
 * O diagnóstico de uma meta, em uma pastilha e uma frase.
 *
 * A REGRA É NÃO CONSOLAR E NÃO INVENTAR CONFIANÇA. Média de aporte com um mês
 * de histórico não é média, é um número solto — então, abaixo de dois meses, a
 * tela diz que ainda não sabe, em vez de anunciar "no ritmo" com base num
 * depósito único. É a mesma regra que o Orçamento aplica à média por categoria:
 * preferir o silêncio à falsa precisão.
 */
function diagnostico(p: ProgressoMeta): {
  tom: "pago" | "previsto" | "saida" | "atrasado" | "neutro";
  rotulo: string;
  frase: string;
} {
  const { meta } = p;

  if (p.atingida)
    return {
      tom: "pago",
      rotulo: "alvo atingido",
      frase:
        "Você chegou. Marque como concluída para ela sair da conta do seu mês.",
    };

  if (meta.prazo === null)
    return {
      tom: "previsto",
      rotulo: "sem prazo",
      frase:
        "Sem data, isto é um desejo — não uma meta. Sem prazo não existe quanto separar por mês, e é esse número que faz a coisa acontecer.",
    };

  if (p.atrasada)
    return {
      tom: "atrasado",
      rotulo: "atrasada",
      frase:
        `O prazo era ${dataCurta(meta.prazo)} e ainda faltam ${brl(p.falta)}. ` +
        (p.previsaoNoRitmo
          ? `No ritmo de ${brl(p.aporteMedio)} por mês, você chega em ${mesAno(p.previsaoNoRitmo)}.`
          : "Sem nenhum aporte registrado, não há ritmo que leve a lugar nenhum."),
    };

  if (p.mesesComAporte === 0)
    return {
      tom: "neutro",
      rotulo: "sem aporte ainda",
      frase:
        "Nenhum aporte registrado. Enquanto o primeiro não entrar, isto é um plano — e plano não rende.",
    };

  if (p.mesesComAporte < 2)
    return {
      tom: "neutro",
      rotulo: "ritmo indefinido",
      frase:
        "Um mês de histórico ainda não é um ritmo. Volto a comparar quando houver o segundo — antes disso, qualquer previsão seria chute com cara de conta.",
    };

  if (p.noRitmo)
    return {
      tom: "pago",
      rotulo: "no ritmo",
      frase: `Você tem separado ${brl(p.aporteMedio)} por mês — acima do que ela pede. Mantendo assim, chega antes do prazo.`,
    };

  const atraso = p.previsaoNoRitmo
    ? mesesEntre(refDaData(meta.prazo), p.previsaoNoRitmo)
    : 0;

  return {
    tom: "saida",
    rotulo: "abaixo do ritmo",
    frase:
      `Você tem separado ${brl(p.aporteMedio)} por mês. ` +
      (p.previsaoNoRitmo
        ? `Nesse ritmo você chega em ${mesAno(p.previsaoNoRitmo)}${
            atraso > 0 ? `, ${atraso} ${atraso === 1 ? "mês" : "meses"} depois do prazo` : ""
          }.`
        : "Nesse ritmo ela não acontece."),
  };
}

/**
 * O cartão de uma meta.
 *
 * O ANEL mostra o quanto já está dentro (recipiente, não régua) e leva a COR da
 * própria meta: com quatro cartões na tela, é a cor que faz achar a certa sem
 * ler o nome. O número que fica ao lado dele é o do mês, não o do sonho —
 * porque é o do mês que se pode fazer alguma coisa a respeito hoje.
 */
function CartaoMeta({
  p,
  aoAportar,
  aoAbrir,
  aoDefinirPrazo,
}: {
  p: ProgressoMeta;
  aoAportar: () => void;
  aoAbrir: () => void;
  aoDefinirPrazo: () => void;
}) {
  const { meta } = p;
  const d = diagnostico(p);
  const Icone = iconeDaMeta(meta.icone);
  const pausada = meta.status === "pausada";

  return (
    <Bloco className={`flex flex-col p-4 sm:p-5 ${pausada ? "opacity-75" : ""}`}>
      <div className="flex items-start gap-3">
        {/* O disco da casa, com a cor da meta: o mesmo desenho que a linha de
            lançamento usa. Antes era a cor chapada com ícone branco — vinte
            por cento mais forte que qualquer outro disco do app, e é assim
            que uma tela deixa de parecer parte do mesmo produto. */}
        <DiscoIcone Icone={Icone} cor={meta.cor} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-semibold text-primary">
            {meta.nome}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pastilha tom={d.tom}>{d.rotulo}</Pastilha>
            <Pastilha tom={tomDaPrioridade(meta.prioridade)}>
              {ROTULO_PRIORIDADE[meta.prioridade].toLowerCase()}
            </Pastilha>
            {pausada && <Pastilha tom="neutro">pausada</Pastilha>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <AnelProgresso
          valor={p.progresso * 100}
          rotulo={`guardado de ${brl(meta.valor_alvo)}`}
          centro={brl(p.acumulado)}
          cor={meta.cor}
          tamanho={112}
          espessura={10}
        />

        <div className="min-w-0 flex-1">
          {/* A ordem dos casos importa: meta atingida vem ANTES da meta sem
              prazo. Invertido, a reserva de emergência que já encheu diria
              "faltam R$ 0,00 e não há data" — verdade formal, notícia errada. */}
          {p.atingida ? (
            <>
              <p className="flex items-center gap-1.5 text-xs font-medium text-success-strong">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Alvo de {brl(meta.valor_alvo)} alcançado
              </p>
              <p className="mt-1 font-display text-2xl font-semibold leading-tight tabular-nums text-success-strong">
                {brl(p.acumulado)}
              </p>
            </>
          ) : p.aporteNecessario === null ? (
            /* Sem prazo o motor não tem número para dar — e a tela não inventa
               um. Mostra o conserto: definir a data. */
            <div className="rounded-xl border border-dashed border-accent/40 bg-accent-tint p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-strong">
                <CalendarOff className="h-3.5 w-3.5" />
                Meta sem prazo
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
                Faltam {brl(p.falta)} e não há data — então não há quanto por
                mês.
              </p>
              <div className="mt-2">
                <BotaoAcao
                  variante="contorno"
                  tamanho="sm"
                  larguraTotal
                  onClick={aoDefinirPrazo}
                  rotuloAcessivel={`Definir um prazo para a meta ${meta.nome}`}
                >
                  Definir um prazo
                </BotaoAcao>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground">
                {p.mesesRestantes === 0
                  ? "O prazo passou. Para fechar agora, falta"
                  : `Separe por mês até ${mesAno(refDaData(meta.prazo!))}`}
              </p>
              <p className="mt-0.5 font-display text-2xl font-semibold leading-tight tracking-tight tabular-nums text-primary">
                {brl(p.aporteNecessario)}
              </p>
              <p className="mt-1 text-2xs tabular-nums text-muted-foreground">
                faltam {brl(p.falta)}
                {p.mesesRestantes && p.mesesRestantes > 0 ? (
                  <>
                    {" "}
                    · {p.mesesRestantes}{" "}
                    {p.mesesRestantes === 1 ? "mês" : "meses"}
                  </>
                ) : null}
              </p>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-2xs leading-relaxed text-muted-foreground">{d.frase}</p>

      {/* Nenhum sólido aqui, e não é timidez: o laranja cheio da casa é do
          "Nova meta" no alto da tela. Quatro cartões com um botão laranja cada
          seriam quatro CTAs disputando — e o mesmo laranja repetido oito vezes
          deixa de significar "o que fazer agora". A ação da linha é de
          contorno, como o "Atualizar" da carteira de investimentos. */}
      <div className="mt-4 flex gap-2">
        <BotaoAcao
          variante="contorno"
          Icone={Plus}
          onClick={aoAportar}
          className="flex-1"
          rotuloAcessivel={`Registrar um aporte na meta ${meta.nome}`}
        >
          Guardei
        </BotaoAcao>
        <BotaoAcao
          variante="fantasma"
          onClick={aoAbrir}
          rotuloAcessivel={`Ver o histórico da meta ${meta.nome}`}
        >
          Histórico
        </BotaoAcao>
      </div>
    </Bloco>
  );
}
