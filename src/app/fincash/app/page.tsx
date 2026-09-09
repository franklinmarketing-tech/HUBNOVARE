"use client";

import { useCallback, useEffect, useState } from "react";
import { faltaTabela } from "@/lib/fincash/erros";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  Plus,
  SlidersHorizontal,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AvisoErro,
  AvisoSQL,
  BarraCategoria,
  BarraComMarca,
  BarrasMes,
  Bloco,
  BotaoAcao,
  brl,
  CartaoAssistente,
  CartaoNumero,
  CartaoPainel,
  CartaoTransacao,
  Esqueleto,
  Medidor,
  NavegadorMes,
  NumeroHeroi,
  Pastilha,
  Vazio,
  type Dica,
  type PontoMes,
} from "./pecas";
import {
  carregarMes,
  carregarSaldos,
  limitesDoMes,
  materializarRecorrencias,
  mesVizinho,
  nomeDoMes,
  porCategoria,
  refDoMes,
  resumirMes,
  semearCategorias,
  ultimoDiaDoMes,
  type Categoria,
  type Lancamento,
  type Mes,
} from "@/lib/fincash/modelo";

/**
 * O painel do FINCASH — a tela de todo dia.
 *
 * A PERGUNTA QUE ELA RESPONDE, e é uma só: "posso gastar?"
 *
 * É por isso que o número grande no topo não é "quanto você gastou" (que é o
 * que quase todo app de finanças mostra) e sim **quanto sobra até o fim do
 * mês**. Saber que gastou R$ 800 em restaurante é informação sobre o passado,
 * e passado não muda comportamento. Quanto ainda dá para gastar, muda.
 *
 * AS DUAS LEITURAS, que é o que o app tem de útil a mais que um extrato:
 * o REALIZADO diz como a pessoa está agora; o PREVISTO diz como o mês termina
 * se nada mudar. A segunda é a que avisa do vermelho enquanto ainda dá tempo
 * de evitar — e é justamente a que os concorrentes não mostram, porque eles só
 * registram o que já aconteceu.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * O QUE MUDOU NESTA REVISÃO (o dono olhou e disse "interface muito simples")
 * ══════════════════════════════════════════════════════════════════════════
 * A tese do número não mudou — continua sendo a SOBRA PREVISTA. O que mudou é
 * ele finalmente PARECER a coisa mais importante da tela: antes tinha o mesmo
 * peso de um rótulo, agora mora sozinho num cartão navy, o único bloco escuro
 * de um app claro. Hierarquia é a diferença entre olhar e procurar.
 *
 * 1. O HERÓI virou cartão navy com o medidor ao lado e, no rodapé, a barra de
 *    RITMO — quanto do previsto já foi gasto contra quanto do mês já correu.
 *    Essa comparação é a leitura que nenhum extrato dá: gastar 70% do mês no
 *    dia 8 é notícia; gastar 70% no dia 25 não é.
 * 2. O FIN, o assistente. Três frases em português sobre os números que já
 *    estão na tela. Não é chat e não chama modelo nenhum — assistente que
 *    inventa saldo destrói a confiança no app inteiro.
 * 3. A HOME VIROU EDITÁVEL. Cada bloco pode subir, descer ou sumir, e a
 *    escolha fica no `localStorage`. É o que o Mobills faz e é o que
 *    transforma um painel genérico no painel DAQUELA pessoa.
 * 4. Nada saiu. Pastilhas de a pagar/a receber/atrasadas, contas, para onde
 *    foi e os seis meses continuam todos aqui — reorganizados, e agora com um
 *    bloco novo de VENCIMENTOS, que o app já sabia calcular e não mostrava.
 *
 * POR QUE `localStorage` E NÃO UMA TABELA: a preferência é de aparência, é de
 * um aparelho só e não vale uma migração. Se um dia o mesmo painel tiver de
 * seguir a pessoa entre o celular e o computador, aí sim vira coluna no perfil.
 */

// ─────────────────────────────────────────────── A home que a pessoa monta ──

type IdBloco = "resumo" | "agenda" | "categorias" | "contas" | "historico";

/**
 * Cada bloco declara se ocupa a linha inteira ou metade dela.
 *
 * No celular é tudo uma coluna e isto não importa. No computador, `meia`
 * permite duas colunas — e como a ordem é a da pessoa, pode acontecer de um
 * bloco `meia` ficar sozinho numa linha. Deixamos acontecer: `grid-flow-dense`
 * resolveria o buraco reordenando visualmente, e aí a ordem que a pessoa
 * escolheu deixaria de ser a ordem que ela vê. Buraco é mais honesto.
 */
const BLOCOS: { id: IdBloco; titulo: string; largura: "cheia" | "meia" }[] = [
  { id: "resumo", titulo: "Entrou, saiu e o que você tem", largura: "cheia" },
  { id: "agenda", titulo: "O que vence agora", largura: "cheia" },
  { id: "categorias", titulo: "Para onde foi", largura: "meia" },
  { id: "contas", titulo: "Onde o dinheiro está", largura: "meia" },
  { id: "historico", titulo: "Os últimos seis meses", largura: "cheia" },
];

const ORDEM_PADRAO = BLOCOS.map((b) => b.id);

/* A versão no nome da chave não é zelo: se um dia um bloco for renomeado, a
   preferência salva apontaria para um id que não existe mais e o painel
   nasceria capenga. Trocar o `v1` descarta o antigo e a pessoa volta ao
   padrão — que é o pior caso aceitável. */
const CHAVE = "fincash:painel:v1";

type Config = { ordem: IdBloco[]; ocultos: IdBloco[] };

function lerConfig(): Config {
  const vazio: Config = { ordem: ORDEM_PADRAO, ocultos: [] };
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return vazio;
    const salvo = JSON.parse(cru) as Partial<Config>;

    /* Filtra o que não existe mais e ACRESCENTA no fim o que é novo: sem a
       segunda metade, um bloco criado depois ficaria invisível para todo mundo
       que já usou o app — o bug mais silencioso desse tipo de recurso. */
    const conhecidos = (salvo.ordem ?? []).filter((id) =>
      ORDEM_PADRAO.includes(id),
    );
    const novos = ORDEM_PADRAO.filter((id) => !conhecidos.includes(id));

    return {
      ordem: [...conhecidos, ...novos],
      ocultos: (salvo.ocultos ?? []).filter((id) => ORDEM_PADRAO.includes(id)),
    };
  } catch {
    // Navegador com armazenamento bloqueado (aba anônima, política de
    // empresa). O painel não pode morrer por causa de uma preferência.
    return vazio;
  }
}

// ────────────────────────────────────────────────────────────── A tela ──────

export default function PainelFincash() {
  const hoje = refDoMes();
  const [ref, setRef] = useState(hoje);
  const [dados, setDados] = useState<Mes | null>(null);
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [historico, setHistorico] = useState<PontoMes[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [config, setConfig] = useState<Config>({
    ordem: ORDEM_PADRAO,
    ocultos: [],
  });
  const [organizando, setOrganizando] = useState(false);

  /* A leitura acontece depois da primeira pintura de propósito: `localStorage`
     não existe no servidor, e ler no corpo do componente faria o HTML do
     servidor divergir do primeiro render do cliente. */
  useEffect(() => setConfig(lerConfig()), []);

  const salvar = useCallback((c: Config) => {
    setConfig(c);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(c));
    } catch {
      // Preferência é conforto, não dado. Se não deu para guardar, a sessão
      // continua com a escolha e o resto segue igual.
    }
  }, []);

  const mover = (id: IdBloco, passo: -1 | 1) => {
    const i = config.ordem.indexOf(id);
    const j = i + passo;
    if (i < 0 || j < 0 || j >= config.ordem.length) return;
    const ordem = [...config.ordem];
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    salvar({ ...config, ordem });
  };

  const alternarVisivel = (id: IdBloco) =>
    salvar({
      ...config,
      ocultos: config.ocultos.includes(id)
        ? config.ocultos.filter((x) => x !== id)
        : [...config.ocultos, id],
    });

  const carregar = useCallback(async () => {
    setDados(null);
    try {
      let [m, s] = await Promise.all([carregarMes(ref), carregarSaldos()]);

      /* As contas de todo mês aparecem sozinhas ao abrir o mês. É idempotente,
         então abrir duas vezes não duplica — e é o que faz a pessoa não ter de
         digitar aluguel e salário de novo em fevereiro. */
      if (m.recorrencias.length > 0) {
        const criados = await materializarRecorrencias(ref, m.recorrencias, m.lancamentos);
        if (criados > 0) m = await carregarMes(ref);
      }
      // Primeira visita: sem categoria nenhuma a tela de lançamento não
      // funciona, e é exatamente ali que a pessoa desiste.
      if (m.categorias.length === 0) {
        await semearCategorias();
        setDados(await carregarMes(ref));
      } else {
        setDados(m);
      }
      setSaldos(s);
      setErro(null);

      /* O histórico vem depois e sem `await` no caminho crítico: ele é o
         gráfico do rodapé, não pode atrasar o número que a pessoa abriu o app
         para ver. Se falhar, o painel continua inteiro sem ele. */
      carregarHistorico(ref)
        .then(setHistorico)
        .catch(() => setHistorico([]));
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setErro(
        faltaTabela(err)
          ? "FALTA_SQL"
          : err.message ?? "Não consegui carregar.",
      );
    }
  }, [ref]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro === "FALTA_SQL") return <AvisoSQL arquivo="supabase/fincash.sql" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  if (!dados) return <Esqueleto />;

  const r = resumirMes(dados.lancamentos);
  const categorias = porCategoria(dados.lancamentos, dados.categorias);
  const totalContas = dados.contas.reduce(
    (s, c) => s + (saldos[c.id] ?? c.saldo_inicial),
    0,
  );
  const semNada = dados.contas.length === 0 && dados.lancamentos.length === 0;

  /* Quanto do que entra já foi comprometido. É o número que responde
     "posso gastar?" melhor que qualquer gráfico. */
  const usado =
    r.entrouPrevisto > 0 ? (r.saiuPrevisto / r.entrouPrevisto) * 100 : 0;

  /* Vencidas e não pagas. O app já sabia disso e não dizia — e conta atrasada
     escondida numa lista de sessenta linhas é exatamente o que gera juros. */
  const hojeISO = new Date().toISOString().slice(0, 10);
  const atrasadas = dados.lancamentos.filter(
    (l) => !l.pago && l.tipo === "despesa" && l.data < hojeISO,
  );
  const totalAtrasado = atrasadas.reduce((s, l) => s + l.valor, 0);

  /* A agenda: o que está vencido primeiro (do mais velho, que é o que já está
     rendendo juros), depois o que vence em seguida. Cinco linhas — a sexta
     conta a vencer não muda a decisão de ninguém hoje. */
  const aVencer = dados.lancamentos
    .filter((l) => !l.pago && l.data >= hojeISO)
    .sort((a, b) => a.data.localeCompare(b.data));
  const agenda = [
    ...[...atrasadas].sort((a, b) => a.data.localeCompare(b.data)),
    ...aVencer,
  ].slice(0, 5);

  const comHistorico = historico.filter((m) => m.realizado > 0).length >= 2;

  /* O RITMO. Comparar o gasto com o calendário é a leitura que separa este app
     de um extrato: 70% gastos no dia 8 é alarme, 70% no dia 25 é normal.
     Só faz sentido no mês corrente ou nos passados — num mês futuro o
     "quanto do mês já correu" é sempre zero e a barra viraria um susto. */
  const ritmo = ritmoDoMes(ref, hoje, r.saiuRealizado, r.saiuPrevisto);

  const dicas = lerOsNumeros({
    ref,
    hoje,
    sobraPrevista: r.sobraPrevista,
    usado,
    atrasadas: atrasadas.length,
    totalAtrasado,
    maiorCategoria: categorias[0],
    totalSaida: r.saiuRealizado + r.aPagar,
    contas: dados.contas.length,
    ritmo,
  });

  const catPorId = new Map(dados.categorias.map((c) => [c.id, c]));

  /** O desenho de cada bloco. Devolve `null` quando não há o que mostrar —
      bloco vazio ocupando espaço é o que faz um painel parecer inacabado. */
  const desenhar = (id: IdBloco): React.ReactNode => {
    switch (id) {
      case "resumo":
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            <CartaoNumero
              rotulo="Entrou"
              valor={brl(r.entrouRealizado)}
              detalhe={r.aReceber > 0 ? `+ ${brl(r.aReceber)} previsto` : undefined}
              tom="bom"
              Icone={ArrowUpRight}
            />
            <CartaoNumero
              rotulo="Saiu"
              valor={brl(r.saiuRealizado)}
              detalhe={r.aPagar > 0 ? `+ ${brl(r.aPagar)} previsto` : undefined}
              tom="atencao"
              Icone={ArrowDownRight}
            />
            <CartaoNumero
              rotulo="Você tem hoje"
              valor={brl(totalContas)}
              detalhe={
                dados.contas.length === 1
                  ? "em 1 conta"
                  : `em ${dados.contas.length} contas`
              }
              tom="info"
              Icone={Wallet}
              href="/fincash/app/contas"
            />
          </div>
        );

      case "agenda":
        if (agenda.length === 0) return null;
        return (
          <CartaoPainel
            titulo="O que vence agora"
            Icone={CalendarClock}
            tom={atrasadas.length > 0 ? "ruim" : "info"}
            detalhe={
              atrasadas.length > 0
                ? `${atrasadas.length} em atraso · ${brl(totalAtrasado)}`
                : "as próximas contas do mês"
            }
            href="/fincash/app/lancamentos"
            corpoSemPadding
          >
            <ul className="divide-y divide-border/50">
              {agenda.map((l) => (
                <li key={l.id}>
                  <CartaoTransacao
                    descricao={l.descricao}
                    valor={l.valor}
                    sinal={l.tipo === "receita" ? "entrada" : "saida"}
                    quando={quandoLegivel(l.data, hojeISO)}
                    categoria={nomeDaCategoria(l, catPorId)}
                    cor={catPorId.get(l.categoria_id ?? "")?.cor}
                    Icone={l.tipo === "receita" ? ArrowUpRight : ArrowDownRight}
                    /* Receita vencida não é "atrasada" — é dinheiro que
                       deveria ter caído e não caiu. Chamar as duas coisas de
                       atraso, em vermelho, é gastar o alarme com o salário do
                       dia 5 que o banco liberou no dia 6. */
                    estado={estadoDoVencimento(l, hojeISO)}
                    href="/fincash/app/lancamentos"
                  />
                </li>
              ))}
            </ul>
          </CartaoPainel>
        );

      case "categorias":
        if (categorias.length === 0) return null;
        return (
          <CartaoPainel
            titulo="Para onde foi"
            Icone={TrendingDown}
            tom="atencao"
            total={brl(r.saiuRealizado + r.aPagar)}
            detalhe="as 5 maiores do mês"
            href="/fincash/app/orcamento"
            rotuloAcao="Orçamento"
          >
            <ul className="space-y-3">
              {categorias.slice(0, 5).map((c) => (
                <BarraCategoria
                  key={c.id}
                  nome={c.nome}
                  valor={brl(c.total)}
                  pct={(c.total / categorias[0].total) * 100}
                  cor={c.cor}
                />
              ))}
            </ul>
          </CartaoPainel>
        );

      case "contas":
        return (
          <CartaoPainel
            titulo="Onde o dinheiro está"
            Icone={Wallet}
            tom="neutro"
            total={brl(totalContas)}
            href="/fincash/app/contas"
            corpoSemPadding
          >
            {dados.contas.length === 0 ? (
              <p className="p-4 text-xs leading-relaxed text-muted-foreground sm:p-5">
                Nenhuma conta cadastrada ainda.{" "}
                <Link
                  href="/fincash/app/contas"
                  className="font-semibold text-accent-strong underline underline-offset-2"
                >
                  Cadastrar a primeira
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {dados.contas.map((c) => (
                  <li
                    key={c.id}
                    className="flex min-h-12 items-center gap-3 px-4 py-2.5 sm:px-5"
                  >
                    <span
                      aria-hidden
                      className="h-6 w-1.5 shrink-0 rounded-full"
                      style={{ background: c.cor }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {c.nome}
                    </span>
                    <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-primary">
                      {brl(saldos[c.id] ?? c.saldo_inicial)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CartaoPainel>
        );

      case "historico":
        /* Um mês sozinho não diz se a vida está melhorando; seis dizem. Só
           aparece quando existe história de verdade — dois meses com
           movimento —, senão seria uma coluna solta fingindo série. */
        if (!comHistorico) return null;
        return (
          <CartaoPainel
            titulo="Os últimos seis meses"
            Icone={BarChart3}
            tom="info"
            detalhe="gasto × orçamento"
            href="/fincash/app/projecao"
            rotuloAcao="Projeção"
          >
            <BarrasMes
              meses={historico}
              formatar={brl}
              rotuloRealizado="Gasto"
              rotuloPlanejado="Orçamento"
              destaque={ref}
            />
          </CartaoPainel>
        );
    }
  };

  return (
    <div className="surgir">
      <NavegadorMes
        mes={ref}
        hoje={hoje}
        nome={nomeDoMes(ref)}
        aoMudar={setRef}
        acao={
          <BotaoAcao href="/fincash/app/lancamentos?novo=1" Icone={Plus}>
            Lançar
          </BotaoAcao>
        }
      />

      {semNada ? (
        <PrimeiroUso />
      ) : (
        <div className="space-y-3">
          {/* O HERÓI. Um bloco escuro num app claro, e só um: é o que faz o
              olho pousar aqui antes de qualquer outra coisa. */}
          <NumeroHeroi
            rotulo={
              r.sobraPrevista >= 0
                ? "Se nada mudar, você fecha o mês com"
                : "Se nada mudar, o mês fecha faltando"
            }
            valor={brl(Math.abs(r.sobraPrevista))}
            sinal={r.sobraPrevista >= 0 ? "positivo" : "negativo"}
            explicacao={
              r.sobraPrevista >= 0
                ? "É o que resta depois de tudo o que já saiu e do que ainda está previsto sair."
                : "O previsto do mês já passa do que entra. Dá tempo de ajustar enquanto o mês corre."
            }
            lateral={
              <Medidor
                valor={usado}
                rotulo="Da sua renda já comprometida"
                sobre="escuro"
                compacto
              />
            }
            rodape={
              ritmo && (
                <BarraComMarca
                  sobre="escuro"
                  valor={ritmo.gastoPct}
                  marca={ritmo.mesPct}
                  rotulo={`Já saíram ${brl(r.saiuRealizado)} dos ${brl(r.saiuPrevisto)} previstos`}
                  rotuloMarca={`o mês está em ${Math.round(ritmo.mesPct)}%`}
                  legenda={
                    ritmo.adiantado
                      ? "Você está gastando mais rápido do que o mês corre — o que sobra tem de durar mais dias."
                      : "O gasto está acompanhando o calendário."
                  }
                />
              )
            }
          >
            {r.aPagar > 0 && (
              <Pastilha tom="previsto" Icone={CalendarClock} sobre="escuro">
                {brl(r.aPagar)} a pagar
              </Pastilha>
            )}
            {r.aReceber > 0 && (
              <Pastilha tom="pago" sobre="escuro">
                {brl(r.aReceber)} a receber
              </Pastilha>
            )}
            {atrasadas.length > 0 && (
              <Link href="/fincash/app/lancamentos" className="rounded-full">
                <Pastilha tom="atrasado" sobre="escuro" tamanho="toque">
                  {atrasadas.length === 1
                    ? "1 conta atrasada"
                    : `${atrasadas.length} contas atrasadas`}
                </Pastilha>
              </Link>
            )}
          </NumeroHeroi>

          {/* O FIN. Vem logo depois do número porque é a explicação dele — se
              viesse no fim da página, seria conselho para quem já rolou tudo,
              que é justamente quem menos precisa. */}
          <CartaoAssistente
            saudacao={`li o seu ${nomeDoMes(ref).split(" de ")[0]}`}
            dicas={dicas}
          />

          <BarraOrganizar
            organizando={organizando}
            aoAlternar={() => setOrganizando((v) => !v)}
            aoRestaurar={() => salvar({ ordem: ORDEM_PADRAO, ocultos: [] })}
            escondidos={config.ocultos.length}
          />

          {/* A grade da home. `items-start` para um bloco alto não esticar o
              vizinho baixo até a mesma altura — duas colunas com fundos
              brancos de alturas diferentes é o que dá vida à página. */}
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {config.ordem.map((id, i) => {
              const meta = BLOCOS.find((b) => b.id === id);
              if (!meta) return null;

              const oculto = config.ocultos.includes(id);
              if (oculto && !organizando) return null;

              const conteudo = desenhar(id);
              // No modo organizar, o bloco sem dados AINDA aparece (vazio):
              // senão a pessoa não teria como reativar o que escondeu.
              if (!conteudo && !organizando) return null;

              return (
                <section
                  key={id}
                  style={{ "--fin-i": i } as React.CSSProperties}
                  className={`fin-entra ${meta.largura === "cheia" ? "lg:col-span-2" : ""}`}
                >
                  {organizando && (
                    <ControlesBloco
                      titulo={meta.titulo}
                      oculto={oculto}
                      primeiro={i === 0}
                      ultimo={i === config.ordem.length - 1}
                      aoSubir={() => mover(id, -1)}
                      aoDescer={() => mover(id, 1)}
                      aoAlternar={() => alternarVisivel(id)}
                    />
                  )}

                  {/* Escondido, o bloco continua desenhado mas apagado e sem
                      foco: é a pré-visualização do que volta se a pessoa tocar
                      no olho. `inert` tira do teclado o que está fora de uso. */}
                  <div
                    className={oculto ? "pointer-events-none opacity-40" : ""}
                    inert={oculto}
                  >
                    {conteudo ?? (
                      <Bloco className="p-5">
                        <p className="text-xs text-muted-foreground">
                          Sem dados para mostrar neste mês.
                        </p>
                      </Bloco>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────── Organizar o painel ────

/**
 * A entrada do modo organizar.
 *
 * Um botão discreto, e não um ícone de engrenagem solto: engrenagem sem
 * palavra é a coisa que ninguém acha e depois todo mundo jura que o app não
 * tem. Aqui está escrito o que faz.
 */
function BarraOrganizar({
  organizando,
  aoAlternar,
  aoRestaurar,
  escondidos,
}: {
  organizando: boolean;
  aoAlternar: () => void;
  aoRestaurar: () => void;
  escondidos: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-2xs text-muted-foreground">
        {organizando
          ? "Use as setas para mudar a ordem e o olho para esconder um bloco."
          : escondidos > 0
            ? `${escondidos} ${escondidos === 1 ? "bloco escondido" : "blocos escondidos"} neste painel.`
            : ""}
      </p>

      <div className="flex items-center gap-2">
        {organizando && (
          <BotaoAcao variante="fantasma" tamanho="sm" onClick={aoRestaurar}>
            Voltar ao padrão
          </BotaoAcao>
        )}
        <BotaoAcao
          variante={organizando ? "solido" : "contorno"}
          tamanho="sm"
          Icone={organizando ? Check : SlidersHorizontal}
          onClick={aoAlternar}
        >
          {organizando ? "Pronto" : "Organizar painel"}
        </BotaoAcao>
      </div>
    </div>
  );
}

/**
 * As setas de cada bloco.
 *
 * SUBIR E DESCER, E NÃO ARRASTAR. Arrastar é o gesto elegante da demonstração
 * e o gesto errado no aparelho: numa página que rola, o toque longo disputa
 * com a própria rolagem, e quem usa leitor de tela ou só o teclado fica sem
 * caminho nenhum. Dois botões resolvem os três casos e não precisam de
 * biblioteca.
 */
function ControlesBloco({
  titulo,
  oculto,
  primeiro,
  ultimo,
  aoSubir,
  aoDescer,
  aoAlternar,
}: {
  titulo: string;
  oculto: boolean;
  primeiro: boolean;
  ultimo: boolean;
  aoSubir: () => void;
  aoDescer: () => void;
  aoAlternar: () => void;
}) {
  const botao =
    "flex h-11 w-11 items-center justify-center rounded-xl text-primary transition-colors hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="mb-2 flex items-center gap-1 rounded-xl border border-dashed border-ciano/40 bg-ciano-tint/60 px-2 py-1">
      <LayoutGrid className="ml-1 h-4 w-4 shrink-0 text-ciano-forte" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-2xs font-semibold text-ciano-forte">
        {titulo}
        {oculto && <span className="ml-1.5 font-normal">(escondido)</span>}
      </p>

      <button
        type="button"
        onClick={aoSubir}
        disabled={primeiro}
        aria-label={`Subir o bloco ${titulo}`}
        className={botao}
      >
        <span aria-hidden className="text-base leading-none">↑</span>
      </button>
      <button
        type="button"
        onClick={aoDescer}
        disabled={ultimo}
        aria-label={`Descer o bloco ${titulo}`}
        className={botao}
      >
        <span aria-hidden className="text-base leading-none">↓</span>
      </button>
      <button
        type="button"
        onClick={aoAlternar}
        aria-pressed={oculto}
        aria-label={`${oculto ? "Mostrar" : "Esconder"} o bloco ${titulo}`}
        className={botao}
      >
        {oculto ? (
          <EyeOff className="h-4 w-4" strokeWidth={2.25} />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────── Cálculos ─────

/**
 * O ritmo do mês: quanto do gasto previsto já saiu contra quanto do mês passou.
 *
 * A comparação é entre DUAS FRAÇÕES DA MESMA COISA — o mês. Comparar gasto com
 * renda já é o medidor lá em cima; aqui a pergunta é outra: o dinheiro está
 * saindo na velocidade do calendário?
 *
 * Devolve `null` quando a pergunta não faz sentido: mês futuro (o calendário
 * ainda não começou) ou sem nada previsto para sair (não há o que medir).
 */
function ritmoDoMes(
  ref: string,
  hoje: string,
  saiuRealizado: number,
  saiuPrevisto: number,
) {
  if (saiuPrevisto <= 0) return null;
  /* SÓ NO MÊS CORRENTE. Num mês futuro o calendário ainda não começou, e num
     mês passado ele já acabou: a marca ficaria colada em 0% ou em 100% e a
     barra diria sempre a mesma coisa. Comparação que nunca muda não é
     comparação, é enfeite — e enfeite com cara de alerta é pior que nada. */
  if (ref !== hoje) return null;

  const mesPct = (new Date().getDate() / ultimoDiaDoMes(ref)) * 100;
  const gastoPct = (saiuRealizado / saiuPrevisto) * 100;

  /* A folga de 5 pontos existe porque ninguém gasta em fatias diárias exatas:
     o mercado do mês inteiro cai num dia só. Alarme que dispara no dia 3 é
     alarme que se aprende a ignorar. */
  return { mesPct, gastoPct, adiantado: gastoPct > mesPct + 5 };
}

/**
 * O que o Fin tem a dizer.
 *
 * REGRAS, NÃO MODELO. Toda frase daqui sai de uma conta que a própria tela já
 * fez — nada é gerado, nada é adivinhado. Num app de dinheiro, uma única frase
 * inventada custa a confiança em todos os números da página, inclusive os
 * certos.
 *
 * A ORDEM É DE URGÊNCIA e o corte é em três. Assistente que fala demais vira
 * parede de texto e a pessoa passa o olho por cima — que é o mesmo que não
 * falar nada, só que ocupando mais espaço.
 */
function lerOsNumeros(e: {
  ref: string;
  hoje: string;
  sobraPrevista: number;
  usado: number;
  atrasadas: number;
  totalAtrasado: number;
  maiorCategoria?: { nome: string; total: number };
  totalSaida: number;
  contas: number;
  ritmo: { mesPct: number; gastoPct: number; adiantado: boolean } | null;
}): Dica[] {
  const d: Dica[] = [];

  if (e.atrasadas > 0) {
    d.push({
      id: "atraso",
      tom: "ruim",
      texto:
        e.atrasadas === 1
          ? `Tem 1 conta vencida e não paga, de ${brl(e.totalAtrasado)}. Juros de atraso costumam custar mais que o valor original.`
          : `São ${e.atrasadas} contas vencidas e não pagas, somando ${brl(e.totalAtrasado)}.`,
      href: "/fincash/app/lancamentos",
      rotuloAcao: "Resolver",
    });
  }

  if (e.sobraPrevista < 0) {
    d.push({
      id: "vermelho",
      tom: "ruim",
      texto: `Do jeito que está, o mês fecha faltando ${brl(Math.abs(e.sobraPrevista))}. O que ainda não saiu é onde dá para mexer.`,
      href: "/fincash/app/orcamento",
      rotuloAcao: "Ver o orçamento",
    });
  } else if (e.usado >= 85) {
    d.push({
      id: "apertado",
      tom: "atencao",
      texto: `Você já comprometeu ${Math.round(e.usado)}% do que entra. Sobra pouca folga para imprevisto neste mês.`,
    });
  }

  if (e.ritmo?.adiantado && d.length < 3) {
    d.push({
      id: "ritmo",
      tom: "atencao",
      texto: `O mês está em ${Math.round(e.ritmo.mesPct)}% e você já gastou ${Math.round(e.ritmo.gastoPct)}% do previsto. O que sobrou precisa durar mais dias do que o normal.`,
    });
  }

  if (
    d.length < 3 &&
    e.maiorCategoria &&
    e.totalSaida > 0 &&
    e.maiorCategoria.total / e.totalSaida >= 0.3
  ) {
    d.push({
      id: "concentracao",
      tom: "info",
      texto: `${e.maiorCategoria.nome} levou ${Math.round((e.maiorCategoria.total / e.totalSaida) * 100)}% de tudo o que saiu — é onde uma mudança pequena rende mais.`,
      href: "/fincash/app/orcamento",
      rotuloAcao: "Definir um limite",
    });
  }

  if (e.contas === 0 && d.length < 3) {
    d.push({
      id: "sem-conta",
      tom: "info",
      texto:
        "Você ainda não disse onde o seu dinheiro está. Sem uma conta cadastrada, o app anota os gastos mas não sabe o seu saldo.",
      href: "/fincash/app/contas",
      rotuloAcao: "Cadastrar",
    });
  }

  /* A boa notícia só entra quando não há nenhuma má. Elogio ao lado de alerta
     é ruído: a pessoa lê o alerta e o resto vira enfeite. */
  if (d.length === 0 && e.sobraPrevista > 0) {
    d.push({
      id: "azul",
      tom: "bom",
      texto: `Mês tranquilo até aqui: a previsão é fechar com ${brl(e.sobraPrevista)} de sobra. Guardar uma parte agora é o que evita o aperto do mês que vem.`,
      href: "/fincash/app/metas",
      rotuloAcao: "Criar uma meta",
    });
  }

  return d.slice(0, 3);
}

/**
 * "hoje", "ontem", "há 4 dias", "12/03" — a data como se fala.
 *
 * NEUTRA de propósito: a mesma lista mostra conta a pagar e salário a receber,
 * e "vence em 3 dias" aplicado ao salário é o tipo de texto que faz a pessoa
 * ler duas vezes para entender o que já sabia. Quem diz o que é a coisa é a
 * pastilha de estado ao lado, que sabe o tipo do lançamento.
 */
function quandoLegivel(data: string, hojeISO: string) {
  if (data === hojeISO) return "hoje";

  const dias = Math.round(
    (Date.parse(data) - Date.parse(hojeISO)) / 86_400_000,
  );

  if (dias === -1) return "ontem";
  if (dias < 0) return `há ${Math.abs(dias)} dias`;
  if (dias === 1) return "amanhã";
  if (dias <= 7) return `em ${dias} dias`;

  const [, m, dia] = data.split("-");
  return `dia ${dia}/${m}`;
}

/** A pastilha de cada linha da agenda. Ver o comentário na chamada. */
function estadoDoVencimento(l: Lancamento, hojeISO: string) {
  if (l.data >= hojeISO) return { tom: "previsto" as const, texto: "prevista" };
  return l.tipo === "receita"
    ? { tom: "aviso" as const, texto: "não caiu" }
    : { tom: "atrasado" as const, texto: "atrasada" };
}

const nomeDaCategoria = (l: Lancamento, mapa: Map<string, Categoria>) =>
  (l.categoria_id && mapa.get(l.categoria_id)?.nome) || undefined;

/**
 * Os seis meses de trás, para o gráfico do rodapé.
 *
 * Consulta feita aqui e não no `modelo.ts` de propósito: é dado de UMA tela, e
 * o modelo é a camada que as cinco compartilham. Se um dia o Orçamento pedir o
 * mesmo recorte, aí sim vale promover.
 *
 * O orçamento é opcional na conta: `fin_orcamentos` vem de um SQL separado que
 * pode não ter sido rodado ainda. Sem ele o gráfico mostra só o gasto — que já
 * responde metade da pergunta.
 */
async function carregarHistorico(ate: string): Promise<PontoMes[]> {
  const supabase = createClient();
  const refs = Array.from({ length: 6 }, (_, i) => mesVizinho(ate, i - 5));
  const inicio = limitesDoMes(refs[0]).inicio;
  const fim = limitesDoMes(refs[refs.length - 1]).fim;

  const [lanc, orc] = await Promise.all([
    supabase
      .from("fin_lancamentos")
      .select("data, valor, tipo")
      .gte("data", inicio)
      .lte("data", fim),
    supabase.from("fin_orcamentos").select("mes_ref, valor").in("mes_ref", refs),
  ]);
  if (lanc.error) throw lanc.error;

  const saiu = new Map<string, number>();
  for (const l of lanc.data ?? []) {
    if (l.tipo !== "despesa") continue;
    const ref = String(l.data).slice(0, 7);
    saiu.set(ref, (saiu.get(ref) ?? 0) + Number(l.valor));
  }

  const plano = new Map<string, number>();
  if (!orc.error) {
    for (const o of orc.data ?? []) {
      plano.set(o.mes_ref, (plano.get(o.mes_ref) ?? 0) + Number(o.valor));
    }
  }

  return refs.map((ref) => ({
    ref,
    realizado: saiu.get(ref) ?? 0,
    planejado: plano.get(ref) ?? 0,
  }));
}

/**
 * A primeira vez.
 *
 * Painel vazio com zeros é o que faz a pessoa fechar e não voltar. Aqui ela
 * recebe uma instrução só, com o primeiro passo pronto para clicar — e os três
 * passos seguintes à vista, porque saber que são três e não trinta é o que
 * convence alguém a começar.
 */
function PrimeiroUso() {
  return (
    <Vazio
      Icone={Wallet}
      titulo="Vamos começar pelo começo"
      texto="Cadastre onde o seu dinheiro está — a conta do banco, a carteira. Sem isso o app até anota os gastos, mas não consegue te dizer quanto você tem."
      passos={[
        "Cadastre suas contas com o saldo de hoje.",
        "Lance o que já entrou e o que já saiu neste mês.",
        "Deixe as contas fixas cadastradas uma vez — elas voltam sozinhas todo mês.",
      ]}
      acao={
        <BotaoAcao href="/fincash/app/contas" Icone={Plus}>
          Cadastrar minha primeira conta
        </BotaoAcao>
      }
    />
  );
}
