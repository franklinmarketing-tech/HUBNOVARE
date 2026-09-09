"use client";

import { useCallback, useEffect, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Building2,
  Layers,
  LineChart,
  Pencil,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  AnelProgresso,
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoGrupo,
  CabecalhoTela,
  CartaoNumero,
  CartaoPainel,
  DiscoIcone,
  Esqueleto,
  NumeroHeroi,
  Pastilha,
  Vazio,
} from "../pecas";
import { DisclaimerFerramenta } from "@/components/Disclaimers";
import {
  consolidarPorClasse,
  consolidarPorInstituicao,
  descricaoDaTaxa,
  independenciaFinanceira,
  mesesDeReserva,
  patrimonio,
  rendimentoDe,
  carregarInvestimentos,
  ROTULO_CLASSE,
  ROTULO_LIQUIDEZ,
  type Fatia,
  type Investimento,
} from "@/lib/fincash/investimentos";
import {
  carregarMes,
  carregarSaldos,
  mesVizinho,
  nomeDoMes,
  refDoMes,
  resumirMes,
  type Conta,
} from "@/lib/fincash/modelo";
import { FormularioInvestimento, ModalValorAtual } from "./FormularioInvestimento";

export type IndicadorNaTela = {
  chave: string;
  rotulo: string;
  /** Já formatado pelo servidor — a tela não decide se leva "% a.a.". */
  valor: string;
  nota: string;
  aoVivo: boolean;
};

/**
 * A idade do dado, em dias, e o que ela significa.
 *
 * O EXTRATO É MENSAL, e é daí que sai o corte: até 30 dias o número é o do
 * último extrato e está certo; entre 31 e 90 já passou de um ciclo e vale
 * conferir; acima de 90 o valor na tela é ficção com cara de fato — e a
 * carteira inteira (patrimônio, rendimento, independência) está sendo calculada
 * em cima dele. Por isso o aviso é da TELA, e não da linha só: quem abre o app
 * precisa saber antes de ler os números grandes.
 */
const DIAS_CONFERIR = 30;
const DIAS_VELHO = 90;

/** "há 3 dias", "há 2 meses" — tempo em palavra, que é como a pessoa pensa. */
function idadeDoDado(dias: number): string {
  if (dias <= 0) return "atualizado hoje";
  if (dias === 1) return "há 1 dia";
  if (dias < 45) return `há ${dias} dias`;
  const meses = Math.round(dias / 30);
  return `há ${meses} meses`;
}

const pct = (v: number, casas = 1) =>
  `${(v * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;

const FAIXA_TEXTO: Record<string, { rotulo: string; frase: string }> = {
  sem_custo: {
    rotulo: "Sem custo de vida",
    frase: "Falta saber quanto a sua vida custa por mês.",
  },
  comecando: {
    rotulo: "No começo",
    frase: "A renda do patrimônio ainda cobre uma parte pequena do mês.",
  },
  construindo: {
    rotulo: "Construindo",
    frase: "O patrimônio já paga um pedaço reconhecível do mês.",
  },
  quase: {
    rotulo: "Mais da metade",
    frase: "A renda do patrimônio já cobre mais da metade do custo de vida.",
  },
  independente: {
    rotulo: "Cobertura completa",
    frase: "Nesta taxa, a renda do patrimônio cobre o custo de vida inteiro.",
  },
};

/**
 * Investimentos — todo o dinheiro guardado num lugar só.
 *
 * A TELA RESPONDE TRÊS PERGUNTAS, NESTA ORDEM
 * 1. "Quanto eu tenho?" — patrimônio, aplicado × atual, e o rendimento que
 *    apareceu no meio do caminho.
 * 2. "Está concentrado?" — a mesma carteira lida por CLASSE e por INSTITUIÇÃO.
 *    São duas perguntas de risco diferentes e nenhuma responde a outra: dá para
 *    ter renda fixa saudável e, ainda assim, tudo num banco só.
 * 3. "Isso me sustenta?" — meses de reserva e grau de independência.
 *
 * O QUE ELA NÃO FAZ, DE PROPÓSITO
 * Não sugere ativo, não compara produto e não projeta rentabilidade futura. A
 * Novare consolida e informa; recomendação é serviço com gente e contrato do
 * outro lado. Todo número aqui é ou histórico (rendimento realizado) ou
 * aritmética explicitada (renda passiva a uma taxa que a própria tela mostra e
 * deixa trocar).
 *
 * O DADO É MANUAL — E A TELA ADMITE ISSO
 * A carteira não tem cotação ao vivo: cada posição vale o que a pessoa disse
 * que vale, na data em que ela disse. Esconder isso seria o pior defeito
 * possível num app de dinheiro, porque o número continua parecendo certo depois
 * de velho. Daí a idade do dado aparecer em toda linha e virar aviso no topo
 * quando envelhece.
 */
export function TelaInvestimentos({
  indicadores,
  juroRealAnual,
}: {
  indicadores: IndicadorNaTela[];
  /** Juro real de hoje, já calculado no servidor. Nulo se o BCB falhou. */
  juroRealAnual: number | null;
}) {
  const [lista, setLista] = useState<Investimento[] | null>(null);
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [contas, setContas] = useState<Conta[]>([]);
  const [custoVida, setCustoVida] = useState<{ valor: number; ref: string } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);

  const [leitura, setLeitura] = useState<"classe" | "instituicao">("classe");
  const [usarTaxaDeHoje, setUsarTaxaDeHoje] = useState(true);
  const [verArquivados, setVerArquivados] = useState(false);
  const [form, setForm] = useState<Investimento | "novo" | null>(null);
  const [atualizando, setAtualizando] = useState<Investimento | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLista(await carregarInvestimentos());
    } catch (e) {
      const codigo = (e as { code?: string }).code;
      setErro(faltaTabela(e) ? "FALTA_SQL" : (e as Error).message);
      return;
    }

    /* Daqui para baixo é ACESSÓRIO: saldos e custo de vida enriquecem a leitura,
       mas a carteira já está na tela. Se o mês falhar (a pessoa nunca abriu o
       FINCASH, o SQL antigo não rodou), a tela perde a independência
       financeira — não a lista de investimentos. Derrubar tudo por causa de um
       número acessório seria trocar uma tela útil por uma tela vazia. */
    try {
      const ref = refDoMes();
      const anterior = mesVizinho(ref, -1);
      const [mapa, mesAtual, mesPassado] = await Promise.all([
        carregarSaldos(),
        carregarMes(ref),
        carregarMes(anterior),
      ]);

      setSaldos(mapa);
      setContas(mesAtual.contas);

      /* O MAIOR DOS DOIS MESES, e não a média — e isto é uma decisão, não
         preguiça. No dia 3 o mês corrente tem quase nada lançado; usar só ele
         faria "meses de reserva" triplicar justamente na conta que existe para
         não dar falsa tranquilidade. Entre errar para o lado que assusta e
         errar para o lado que acalma, um app de dinheiro erra para o que
         assusta. */
      const agora = resumirMes(mesAtual.lancamentos).saiuPrevisto;
      const passado = resumirMes(mesPassado.lancamentos).saiuPrevisto;
      setCustoVida(
        agora >= passado
          ? { valor: agora, ref }
          : { valor: passado, ref: anterior },
      );
    } catch {
      setCustoVida(null);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro === "FALTA_SQL") {
    return (
      <AvisoSQL
        arquivo="supabase/fincash_v2.sql"
        oQue="A carteira de investimentos"
      />
    );
  }
  if (erro) return <AvisoErro mensagem={erro} />;
  /* "painel": esta tela nasce igual ao painel — herói alto, trio de cartões e
     blocos largos embaixo. É a forma que o esqueleto tem de prometer. */
  if (!lista) return <Esqueleto forma="painel" />;

  const vivos = lista.filter((i) => !i.arquivado);
  const arquivados = lista.filter((i) => i.arquivado);

  const pat = patrimonio(lista, saldos);
  const porClasse = consolidarPorClasse(lista);
  const porInstituicao = consolidarPorInstituicao(lista);
  const fatias = leitura === "classe" ? porClasse : porInstituicao;

  const custo = custoVida?.valor ?? 0;
  /* A taxa real de hoje é a que o mercado paga AGORA; os 4% são a régua
     conservadora de quem não acredita que a Selic de hoje dure trinta anos. A
     tela mostra as duas e deixa a pessoa escolher em vez de decidir por ela —
     esconder a régua otimista seria paternalismo, e esconder a conservadora
     seria vender otimismo. */
  const taxa = usarTaxaDeHoje && juroRealAnual !== null ? juroRealAnual : 4;
  const ind = independenciaFinanceira(pat.total, custo, taxa);
  const reserva = mesesDeReserva(lista, custo, saldos);

  const desatualizados = vivos
    .map((i) => ({ inv: i, r: rendimentoDe(i) }))
    .filter((x) => x.r.desatualizadoDias > DIAS_VELHO)
    .sort((a, b) => b.r.desatualizadoDias - a.r.desatualizadoDias);

  const faixa = FAIXA_TEXTO[ind.faixa];

  return (
    <div className="surgir">
      <CabecalhoTela
        chapeu="O dinheiro que já está guardado"
        titulo="Seus investimentos"
        resumo="Tudo o que você tem aplicado num lugar só: quanto rendeu, onde está concentrado e quanto do seu mês esse dinheiro já paga sozinho."
        acao={
          <BotaoAcao Icone={Plus} onClick={() => setForm("novo")}>
            Nova posição
          </BotaoAcao>
        }
      />

      <FaixaIndicadores indicadores={indicadores} juroReal={juroRealAnual} />

      {desatualizados.length > 0 && (
        <Bloco className="mb-3 border-accent/40 bg-accent-tint p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-strong"
            >
              <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-primary">
                {desatualizados.length === 1
                  ? "1 posição sem conferir há mais de 3 meses"
                  : `${desatualizados.length} posições sem conferir há mais de 3 meses`}
              </p>
              <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
                Os valores abaixo são os que você informou da última vez — e todo
                o resto da tela é calculado em cima deles. Abra o extrato e
                atualize: a mais antiga é{" "}
                <strong className="font-semibold text-foreground">
                  {desatualizados[0].inv.nome}
                </strong>
                , {idadeDoDado(desatualizados[0].r.desatualizadoDias)}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAtualizando(desatualizados[0].inv)}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:text-accent-strong"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Atualizar a mais antiga
            </button>
          </div>
        </Bloco>
      )}

      {vivos.length === 0 ? (
        <>
          <Vazio
            Icone={LineChart}
            titulo="Nenhum investimento cadastrado"
            texto="Cadastre o que você já tem guardado — CDB, tesouro, fundo, ações, cripto. O app não busca cotação: você informa quanto vale hoje, e ele cuida do resto (rendimento, concentração e quanto disso te sustenta)."
            acao={
              <BotaoAcao Icone={Plus} onClick={() => setForm("novo")}>
                Cadastrar a primeira
              </BotaoAcao>
            }
          />

          {/* Carteira vazia não é patrimônio zero: o dinheiro parado na conta
              corrente já banca alguns meses de vida, e essa é justamente a
              conta que a pessoa nunca fez. Esconder a leitura até existir um
              CDB cadastrado seria negar informação que o app já tem. */}
          {pat.emConta > 0 && custo > 0 && (
            <BlocoIndependencia
              ind={ind}
              faixa={faixa}
              reserva={reserva}
              custoVida={custoVida}
              juroRealAnual={juroRealAnual}
              usarTaxaDeHoje={usarTaxaDeHoje}
              aoTrocarTaxa={setUsarTaxaDeHoje}
            />
          )}
        </>
      ) : (
        <>
          <BlocoPatrimonio pat={pat} />

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CartaoNumero
              rotulo="Total aplicado"
              valor={brl(pat.aplicado)}
              detalhe="a soma do que você colocou"
              Icone={Wallet}
            />
            <CartaoNumero
              rotulo="Vale hoje"
              valor={brl(pat.investido)}
              detalhe={`${vivos.length} ${vivos.length === 1 ? "posição" : "posições"} ativas`}
              tom="info"
              Icone={LineChart}
            />
            <CartaoNumero
              rotulo="Rendimento acumulado"
              valor={`${pat.rendimento >= 0 ? "+" : "−"} ${brl(Math.abs(pat.rendimento))}`}
              detalhe={
                pat.aplicado > 0
                  ? `${pct(pat.rendimento / pat.aplicado)} sobre o aplicado`
                  : "desde o primeiro aporte"
              }
              tom={pat.rendimento >= 0 ? "bom" : "ruim"}
            />
          </div>

          <BlocoIndependencia
            ind={ind}
            faixa={faixa}
            reserva={reserva}
            custoVida={custoVida}
            juroRealAnual={juroRealAnual}
            usarTaxaDeHoje={usarTaxaDeHoje}
            aoTrocarTaxa={setUsarTaxaDeHoje}
          />

          <BlocoComposicao
            fatias={fatias}
            leitura={leitura}
            aoTrocar={setLeitura}
          />

          {/* A carteira, agrupada pela mesma leitura de classe do gráfico. Uma
              tabela contínua com faixas coloridas cabe muito mais linha que
              cards soltos — e a cor da faixa é a MESMA do bloco de composição,
              então a leitura se transfere sem legenda nova. */}
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Posição a posição
            </h2>
            <Bloco className="overflow-hidden">
              {porClasse.map((f) => (
                <div key={f.chave}>
                  <CabecalhoGrupo
                    titulo={f.rotulo}
                    total={brl(f.atual)}
                    detalhe={`${Math.round(f.fatia * 100)}% da carteira · ${f.itens} ${
                      f.itens === 1 ? "posição" : "posições"
                    }`}
                    tom="neutro"
                    Icone={Layers}
                  />
                  <ul>
                    {vivos
                      .filter((i) => i.classe === f.chave)
                      .map((i) => (
                        <LinhaPosicao
                          key={i.id}
                          inv={i}
                          aoAtualizar={() => setAtualizando(i)}
                          aoEditar={() => setForm(i)}
                        />
                      ))}
                  </ul>
                </div>
              ))}
            </Bloco>
          </section>
        </>
      )}

      {arquivados.length > 0 && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setVerArquivados((v) => !v)}
            aria-expanded={verArquivados}
            className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <Archive className="h-3.5 w-3.5" />
            {verArquivados ? "Ocultar" : "Ver"} resgatados ({arquivados.length})
          </button>

          {verArquivados && (
            <Bloco className="mt-2 overflow-hidden">
              <ul>
                {arquivados.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-3 border-t border-border/60 px-4 py-3 first:border-t-0 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-muted-foreground line-through">
                        {i.nome}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {i.instituicao} · {ROTULO_CLASSE[i.classe]}
                      </p>
                    </div>
                    <Pastilha tom="neutro">Resgatado</Pastilha>
                    <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {brl(i.valor_atual)}
                    </p>
                  </li>
                ))}
              </ul>
            </Bloco>
          )}
        </section>
      )}

      {/* O aviso legal fecha a tela porque é aqui que ela termina de dizer o que
          é: um consolidador. Nenhum número acima é recomendação, e a linha do
          rodapé é o que deixa isso escrito em vez de subentendido. */}
      <div className="mt-8 border-t border-border/60 pt-4">
        <DisclaimerFerramenta />
      </div>

      {form && (
        <FormularioInvestimento
          inicial={form === "novo" ? undefined : form}
          contas={contas}
          aoFechar={() => setForm(null)}
          aoSalvar={async () => {
            setForm(null);
            await carregar();
          }}
        />
      )}

      {atualizando && (
        <ModalValorAtual
          inv={atualizando}
          aoFechar={() => setAtualizando(null)}
          aoSalvar={async () => {
            setAtualizando(null);
            await carregar();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────── Indicadores ────────

/**
 * Selic, CDI, IPCA e o juro real, num quadro parado.
 *
 * É o que o concorrente vende como "índices atualizados", e o trabalho de
 * verdade não é mostrar o número — é dizer DE QUANDO ele é. Quando a API do
 * Banco Central falha, o `mercado.ts` devolve o último valor conhecido; a
 * célula então diz "último valor conhecido" em texto, e não só apaga um
 * pontinho verde. Cor sozinha não avisa ninguém.
 */
function FaixaIndicadores({
  indicadores,
  juroReal,
}: {
  indicadores: IndicadorNaTela[];
  juroReal: number | null;
}) {
  const celulas = [
    ...indicadores,
    ...(juroReal !== null
      ? [
          {
            chave: "real",
            rotulo: "Juro real",
            valor: `${juroReal.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%`,
            nota: "Selic acima da inflação",
            aoVivo: true,
          },
        ]
      : []),
  ];

  return (
    <section
      aria-label="Indicadores do Banco Central"
      className="mb-3 overflow-hidden rounded-2xl bg-primary"
    >
      <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        {celulas.map((c) => (
          <div key={c.chave} className="bg-primary px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ciano-claro">
              {c.rotulo}
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-white">
              {c.valor}
            </p>
            <p className="text-[11px] leading-snug text-white/50">
              {c.aoVivo ? c.nota : "último valor conhecido"}
            </p>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-1.5 border-t border-white/10 bg-white/[0.06] px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
        Banco Central · séries SGS
      </p>
    </section>
  );
}

// ──────────────────────────────────────────────────────── Patrimônio ────────

/**
 * O total, com a divisão que quase todo app esconde: quanto está APLICADO e
 * quanto está parado em conta.
 *
 * A fita é a mesma ideia da tela de Contas — proporção em vez de dois números
 * empilhados, porque comparar valores de cabeça é justamente o trabalho que o
 * app deveria poupar. E o motor já desconta a conta que hospeda um investimento
 * cadastrado, senão o mesmo dinheiro apareceria dos dois lados da barra.
 */
function BlocoPatrimonio({
  pat,
}: {
  pat: ReturnType<typeof patrimonio>;
}) {
  const base = Math.max(pat.investido + pat.emConta, 1);
  const fatiaInvestida = (pat.investido / base) * 100;

  return (
    <Bloco className="p-5 sm:p-6">
      <p className="text-xs font-medium text-muted-foreground">
        Patrimônio no FINCASH
      </p>
      <p className="mt-1 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums text-primary">
        {brl(pat.total)}
      </p>

      <div
        className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`Composição do patrimônio: ${brl(pat.investido)} investidos e ${brl(pat.emConta)} parados em conta`}
      >
        <span
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${fatiaInvestida}%` }}
        />
        <span
          className="h-full flex-1 rounded-full bg-ciano transition-[width] duration-700 ease-out"
          style={{ width: `${100 - fatiaInvestida}%` }}
        />
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Investido</span>
          <strong className="font-semibold tabular-nums text-foreground">
            {brl(pat.investido)}
          </strong>
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-ciano" />
          <span className="text-muted-foreground">Parado em conta</span>
          <strong className="font-semibold tabular-nums text-foreground">
            {brl(pat.emConta)}
          </strong>
        </li>
      </ul>

      <p className="mt-3 max-w-prose text-2xs leading-relaxed text-muted-foreground">
        Imóveis e outros bens não entram aqui — eles são patrimônio, não reserva,
        e vivem no{" "}
        <Link
          href="/planejamento/app"
          className="font-medium text-ciano-forte underline-offset-2 hover:underline"
        >
          Planejamento
        </Link>
        .
      </p>
    </Bloco>
  );
}

// ───────────────────────────────────────────────── Independência ────────────

/**
 * Meses de reserva e grau de independência, lado a lado.
 *
 * DOIS ANÉIS, E NÃO O MEDIDOR DA CASA: o medidor pinta de vermelho o que passa
 * de 85 — a semântica certa para "comprometimento da renda" e exatamente a
 * errada aqui, onde chegar ao fim da escala é a boa notícia. Reaproveitar a
 * peça errada faria a tela dizer "perigo" para quem conquistou a independência.
 *
 * O CUSTO DE VIDA NÃO É UM CAMPO — ele sai das despesas que a pessoa já lança
 * no FINCASH. Criar um campo próprio seria pedir de novo um dado que o app
 * já tem, e ainda abrir espaço para os dois números divergirem: o que a pessoa
 * digitou uma vez e o que ela realmente gasta.
 */
function BlocoIndependencia({
  ind,
  faixa,
  reserva,
  custoVida,
  juroRealAnual,
  usarTaxaDeHoje,
  aoTrocarTaxa,
}: {
  ind: ReturnType<typeof independenciaFinanceira>;
  faixa: { rotulo: string; frase: string };
  reserva: number | null;
  custoVida: { valor: number; ref: string } | null;
  juroRealAnual: number | null;
  usarTaxaDeHoje: boolean;
  aoTrocarTaxa: (v: boolean) => void;
}) {
  const semCusto = ind.custoVidaMensal <= 0;

  /* Seis meses é a referência mais usada para reserva de emergência — e é isso
     que ela é aqui: uma régua, não um conselho. O anel para de encher em 6, o
     número embaixo continua contando. */
  const METAS_RESERVA = 6;

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quanto isso te sustenta
      </h2>

      {semCusto ? (
        <Bloco className="p-5 sm:p-6">
          <p className="font-display text-sm font-semibold text-primary">
            Falta saber quanto o seu mês custa
          </p>
          <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
            Os meses de reserva e o grau de independência saem das despesas que
            você lança no FINCASH — o app não pergunta de novo o que já pode
            calcular. Lance as despesas do mês e estes números aparecem sozinhos.
          </p>
          <Link
            href="/fincash/app/lancamentos"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
          >
            Ir para lançamentos
          </Link>
        </Bloco>
      ) : (
        <Bloco className="p-5 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Reserva */}
            <div className="flex items-center gap-4">
              <AnelProgresso
                valor={
                  reserva === null
                    ? 0
                    : Math.min(reserva / METAS_RESERVA, 1) * 100
                }
                rotulo="Meses de reserva de liquidez diária"
                centro={
                  reserva === null
                    ? "—"
                    : reserva >= 10
                      ? String(Math.round(reserva))
                      : reserva.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        })
                }
                legenda="meses"
                tamanho={112}
                espessura={10}
                tom="ciano"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">
                  Reserva de emergência
                </p>
                <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
                  Só o que dá para sacar hoje: liquidez diária e saldo em conta.
                  O que está preso até o vencimento fica de fora — reserva que
                  não pode ser sacada não é reserva.
                </p>
                <p className="mt-2 text-2xs text-muted-foreground">
                  Régua usual: {METAS_RESERVA} meses.
                </p>
              </div>
            </div>

            {/* Independência */}
            <div className="flex items-center gap-4 sm:border-l sm:border-border/60 sm:pl-6">
              <AnelProgresso
                valor={ind.cobertura * 100}
                rotulo="Grau de independência financeira"
                centro={`${Math.round(ind.cobertura * 100)}%`}
                legenda="do mês"
                tamanho={112}
                espessura={10}
                tom={ind.cobertura >= 1 ? "success" : "primary"}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-primary">
                    Independência
                  </p>
                  <Pastilha tom={ind.cobertura >= 1 ? "pago" : "previsto"}>
                    {faixa.rotulo}
                  </Pastilha>
                </div>
                <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
                  {faixa.frase} Hoje o patrimônio renderia{" "}
                  <strong className="font-semibold text-foreground">
                    {brl(ind.rendaPassivaMensal)}
                  </strong>{" "}
                  por mês.
                </p>
                {Number.isFinite(ind.alvo) && (
                  <p className="mt-2 text-2xs text-muted-foreground">
                    Cobertura total nesta taxa: {brl(ind.alvo)}.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* A régua da conta, exposta. Um número de independência sem a taxa
              que o gerou é um número que não dá para conferir — e é assim que
              painel financeiro vira horóscopo. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4">
            <p className="text-2xs text-muted-foreground">
              Calculado a {ind.taxaRealAnual.toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}
              % ao ano de juro <strong className="font-semibold">real</strong>{" "}
              (acima da inflação):
            </p>
            <div className="flex gap-1.5" role="group" aria-label="Taxa usada no cálculo">
              <button
                type="button"
                onClick={() => aoTrocarTaxa(true)}
                aria-pressed={usarTaxaDeHoje && juroRealAnual !== null}
                disabled={juroRealAnual === null}
                className={`min-h-11 rounded-xl px-3 text-2xs font-semibold transition-colors disabled:opacity-40 ${
                  usarTaxaDeHoje && juroRealAnual !== null
                    ? "bg-primary text-white"
                    : "border border-border text-primary hover:bg-muted"
                }`}
              >
                Juro real de hoje
              </button>
              <button
                type="button"
                onClick={() => aoTrocarTaxa(false)}
                aria-pressed={!usarTaxaDeHoje || juroRealAnual === null}
                className={`min-h-11 rounded-xl px-3 text-2xs font-semibold transition-colors ${
                  !usarTaxaDeHoje || juroRealAnual === null
                    ? "bg-primary text-white"
                    : "border border-border text-primary hover:bg-muted"
                }`}
              >
                4% a.a. (conservador)
              </button>
            </div>
          </div>

          <p className="mt-3 max-w-prose text-2xs leading-relaxed text-muted-foreground">
            {custoVida && (
              <>
                Custo de vida considerado:{" "}
                <strong className="font-semibold text-foreground">
                  {brl(ind.custoVidaMensal)}
                </strong>{" "}
                — as despesas de {nomeDoMes(custoVida.ref)} lançadas por você.{" "}
              </>
            )}
            Sem o patrimônio render nada, o total banca{" "}
            {ind.mesesDeVida !== null
              ? `${Math.round(ind.mesesDeVida)} ${Math.round(ind.mesesDeVida) === 1 ? "mês" : "meses"}`
              : "—"}{" "}
            de vida. A conta não considera imposto, novos aportes nem a inflação
            do seu custo de vida: é uma fotografia de hoje, não uma simulação de
            aposentadoria.
          </p>
        </Bloco>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────── Composição ────────

/**
 * A mesma carteira, duas leituras.
 *
 * POR CLASSE responde "estou concentrado num tipo de risco?". POR INSTITUIÇÃO
 * responde a pergunta que ninguém faz até precisar: quanto do meu dinheiro
 * depende de um banco só. São perguntas diferentes, e um gráfico não responde
 * a outra — daí serem duas leituras da mesma peça, e não dois gráficos
 * disputando a mesma tela.
 */
function BlocoComposicao({
  fatias,
  leitura,
  aoTrocar,
}: {
  fatias: Fatia[];
  leitura: "classe" | "instituicao";
  aoTrocar: (l: "classe" | "instituicao") => void;
}) {
  const abas = [
    { id: "classe" as const, rotulo: "Por classe", Icone: Layers },
    { id: "instituicao" as const, rotulo: "Por instituição", Icone: Building2 },
  ];

  return (
    <section className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Onde está o dinheiro
        </h2>
        <div className="flex gap-1.5" role="group" aria-label="Leitura da carteira">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => aoTrocar(a.id)}
              aria-pressed={leitura === a.id}
              className={`flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-2xs font-semibold transition-colors ${
                leitura === a.id
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-primary hover:bg-muted"
              }`}
            >
              <a.Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
              {a.rotulo}
            </button>
          ))}
        </div>
      </div>

      <Bloco className="p-5 sm:p-6">
        <div
          className="flex h-3 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`Composição ${leitura === "classe" ? "por classe" : "por instituição"}: ${fatias
            .map((f) => `${f.rotulo} ${Math.round(f.fatia * 100)}%`)
            .join(", ")}`}
        >
          {fatias.map((f) => (
            <span
              key={f.chave}
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${f.fatia * 100}%`, background: f.cor }}
            />
          ))}
        </div>

        <ul className="mt-4 divide-y divide-border/60">
          {fatias.map((f) => (
            <li
              key={f.chave}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: f.cor }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {f.rotulo}
              </span>
              <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                {Math.round(f.fatia * 100)}%
              </span>
              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-primary">
                {brl(f.atual)}
              </span>
              <span
                className={`w-20 shrink-0 text-right text-2xs font-semibold tabular-nums ${
                  f.rendimento >= 0 ? "text-success-strong" : "text-destructive"
                }`}
              >
                {f.rendimento >= 0 ? "+" : "−"}
                {pct(Math.abs(f.rendimentoPct))}
              </span>
            </li>
          ))}
        </ul>
      </Bloco>
    </section>
  );
}

// ───────────────────────────────────────────────────── Linha da posição ─────

/**
 * Uma posição na lista.
 *
 * O RENDIMENTO VEM COM A IDADE DO DADO COLADA NELE, sempre. "+R$ 800 (6,4%)"
 * é um fato quando o extrato foi conferido ontem e é chute quando ninguém olha
 * há sete meses — e visualmente os dois são idênticos. A pastilha de tempo é o
 * que separa um do outro, e por isso ela carrega a palavra, não só a cor.
 */
function LinhaPosicao({
  inv,
  aoAtualizar,
  aoEditar,
}: {
  inv: Investimento;
  aoAtualizar: () => void;
  aoEditar: () => void;
}) {
  const r = rendimentoDe(inv);
  const taxa = descricaoDaTaxa(inv);
  const velho = r.desatualizadoDias > DIAS_VELHO;
  const conferir = !velho && r.desatualizadoDias > DIAS_CONFERIR;

  return (
    <li className="border-t border-border/60 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:px-5">
        <div className="min-w-[9rem] flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {inv.nome}
          </p>
          <p className="mt-0.5 truncate text-2xs text-muted-foreground">
            {inv.instituicao}
            {taxa !== "—" && <> · {taxa}</>} · {ROTULO_LIQUIDEZ[inv.liquidez]}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-sm font-semibold tabular-nums text-primary">
            {brl(inv.valor_atual)}
          </p>
          <p
            className={`text-2xs font-semibold tabular-nums ${
              r.bruto >= 0 ? "text-success-strong" : "text-destructive"
            }`}
          >
            {r.bruto >= 0 ? "+" : "−"}
            {brl(Math.abs(r.bruto))} ({pct(Math.abs(r.percentual))})
            {r.aoAno !== null && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {r.aoAno.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                a.a. no período
              </span>
            )}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {velho ? (
            <Pastilha tom="atrasado" Icone={AlertTriangle}>
              Desatualizado · {idadeDoDado(r.desatualizadoDias)}
            </Pastilha>
          ) : conferir ? (
            <Pastilha tom="neutro">Conferido {idadeDoDado(r.desatualizadoDias)}</Pastilha>
          ) : (
            <Pastilha tom="previsto">{idadeDoDado(r.desatualizadoDias)}</Pastilha>
          )}

          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={aoAtualizar}
              className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-2xs font-semibold text-primary transition-colors hover:border-accent-soft hover:text-accent-strong"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={aoEditar}
              aria-label={`Editar ${inv.nome}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent-soft hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
