"use client";

import { Target, Wallet } from "lucide-react";
import "../app/fincash.css";
import {
  AnelProgresso,
  BarraCategoria,
  BarraComMarca,
  BarrasComLinha,
  BarrasMes,
  BarrasPercentual,
  BarrasRealizadoPlanejado,
  Bloco,
  FaixaVariacao,
  GraficoArea,
  Medidor,
  NumeroHeroi,
  RoscaComposicao,
  brlExato,
} from "../app/pecas";

/**
 * O laboratório dos gráficos do FINCASH.
 *
 * POR QUE ELE VIVE FORA DE `/app` — e portanto fora do login: o layout de
 * `/fincash/app` exige sessão, e uma peça de desenho não precisa de conta para
 * ser conferida. Aqui a rota abre em qualquer navegador, inclusive no do
 * Playwright, o que é a diferença entre testar o gráfico e testar o login.
 *
 * O QUE ELE É: a bancada dos CASOS DE BORDA, não a vitrine dos casos bonitos.
 * Série vazia, um ponto só, valor negativo, 137% de uma meta, R$ 0,03 ao lado
 * de R$ 12 milhões e um nome de categoria de sessenta caracteres. Um gráfico
 * que só foi visto com dados redondos quebra na primeira conta real — e a
 * conta real de um app de dinheiro é sempre a de alguém.
 *
 * Ele não está no menu e não é linkado de lugar nenhum: é ferramenta de obra.
 */

const brl = brlExato;

const SERIE_ANO = [
  { ref: "2025-10", entrada: 8200, saida: 7400 },
  { ref: "2025-11", entrada: 8200, saida: 9100 },
  { ref: "2025-12", entrada: 14300, saida: 12800 },
  { ref: "2026-01", entrada: 8200, saida: 6900 },
  { ref: "2026-02", entrada: 8600, saida: 7100 },
  { ref: "2026-03", entrada: 8600, saida: 8900 },
  { ref: "2026-04", entrada: 8600, saida: 5400 },
  { ref: "2026-05", entrada: 9100, saida: 8200 },
  { ref: "2026-06", entrada: 9100, saida: 7600 },
];

const NOME_LONGO =
  "Alimentação fora de casa, delivery e cafezinho do escritório todo santo dia";

function Secao({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">
        {titulo}
      </h2>
      {nota && (
        <p className="mt-1 max-w-prose text-2xs leading-relaxed text-muted-foreground">
          {nota}
        </p>
      )}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

/** Cada caso de borda leva o nome do problema que ele testa. */
function Caso({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <Bloco className="p-4 sm:p-5">
      <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ciano-forte">
        {nome}
      </p>
      {children}
    </Bloco>
  );
}

export default function LabGraficos() {
  return (
    <main className="aurora-clara min-h-dvh px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ciano-forte">
            FINCASH · obra
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-primary">
            Laboratório de gráficos
          </h1>
          <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
            Todas as peças de desenho com dados de exemplo e com os casos que
            costumam quebrar: série vazia, um ponto só, negativo, acima de 100%,
            número gigante, número minúsculo e rótulo comprido. Fora do login de
            propósito.
          </p>
        </header>

        {/* ── Área ─────────────────────────────────────────────────────── */}
        <Secao
          titulo="Gráfico de área"
          nota="Receita × despesa. A despesa é tracejada para a distinção não morar só na cor."
        >
          <Caso nome="Nove meses, com destaque no mês corrente">
            <GraficoArea serie={SERIE_ANO} formatar={brl} destaque="2026-06" />
          </Caso>
          <Caso nome="Um ponto só (não vira linha)">
            <GraficoArea
              serie={[{ ref: "2026-06", entrada: 9100, saida: 7600 }]}
              formatar={brl}
            />
          </Caso>
          <Caso nome="Série vazia">
            <GraficoArea serie={[]} formatar={brl} />
          </Caso>
          <Caso nome="Número gigante ao lado de minúsculo">
            <GraficoArea
              serie={[
                { ref: "2026-04", entrada: 12_400_000, saida: 0.03 },
                { ref: "2026-05", entrada: 0.07, saida: 3_200_000 },
                { ref: "2026-06", entrada: 5_000_000, saida: 4_999_999.5 },
              ]}
              formatar={brl}
            />
          </Caso>
        </Secao>

        {/* ── Realizado × planejado ────────────────────────────────────── */}
        <Secao
          titulo="Realizado × planejado"
          nota="Barras deitadas com o risco do plano e o excedente listrado."
        >
          <Caso nome="Mistura de dentro, estourado e sem plano">
            <BarrasRealizadoPlanejado
              formatar={brl}
              linhas={[
                { id: "1", nome: "Moradia", realizado: 2400, planejado: 2400 },
                { id: "2", nome: NOME_LONGO, realizado: 1830, planejado: 900 },
                { id: "3", nome: "Transporte", realizado: 410, planejado: 800 },
                { id: "4", nome: "Saúde", realizado: 260, planejado: 0 },
                { id: "5", nome: "Centavo", realizado: 0.02, planejado: 0.01 },
                {
                  id: "6",
                  nome: "Reforma",
                  realizado: 9_800_000,
                  planejado: 4_000_000,
                  cor: "#7c3aed",
                },
              ]}
            />
          </Caso>
          <Caso nome="Lista vazia">
            <BarrasRealizadoPlanejado linhas={[]} formatar={brl} />
          </Caso>
        </Secao>

        {/* ── Rosca ────────────────────────────────────────────────────── */}
        <Secao
          titulo="Rosca de composição"
          nota="Legenda numerada: o número é o contrato que substitui a cor."
        >
          <Caso nome="Onze instituições (as últimas viram Outros)">
            <RoscaComposicao
              formatar={brl}
              legendaCentro="investido"
              fatias={Array.from({ length: 11 }, (_, i) => ({
                id: String(i),
                nome:
                  i === 2
                    ? "Corretora com um nome institucional bem comprido S.A."
                    : `Instituição ${i + 1}`,
                valor: 12_000 / (i + 1),
              }))}
            />
          </Caso>
          <Caso nome="Uma fatia só, e valores zerados/negativos ignorados">
            <RoscaComposicao
              formatar={brl}
              fatias={[
                { id: "a", nome: "Conta corrente", valor: 1_250_000.55 },
                { id: "b", nome: "Zerada", valor: 0 },
                { id: "c", nome: "Negativa (cheque especial)", valor: -300 },
              ]}
            />
          </Caso>
          <Caso nome="Tudo zero">
            <RoscaComposicao fatias={[{ id: "a", nome: "Nada", valor: 0 }]} formatar={brl} />
          </Caso>
        </Secao>

        {/* ── Percentual sobre a receita ───────────────────────────────── */}
        <Secao
          titulo="Percentual sobre a receita"
          nota="Escala presa em 100% (ou mais), com linha de referência tracejada."
        >
          <Caso nome="Uma categoria acima de 100% da renda">
            <BarrasPercentual
              referencia={30}
              itens={[
                { id: "a", nome: "Moradia", pct: 34 },
                { id: "b", nome: "Mercado", pct: 22 },
                { id: "c", nome: NOME_LONGO, pct: 118 },
                { id: "d", nome: "Lazer", pct: 4 },
                { id: "e", nome: "Zero", pct: 0 },
              ]}
            />
          </Caso>
          <Caso nome="Vazio">
            <BarrasPercentual itens={[]} />
          </Caso>
        </Secao>

        {/* ── Barras + linha ───────────────────────────────────────────── */}
        <Secao
          titulo="Barras + linha"
          nota="Mesmo eixo, sempre. No celular deita, como o gráfico da projeção."
        >
          <Caso nome="Sobra mensal (com meses negativos) e patrimônio acumulado">
            <BarrasComLinha
              formatar={brl}
              rotuloBarra="Sobrou no mês"
              rotuloLinha="Acumulado"
              pontos={[
                { ref: "2026-01", barra: 1300, linha: 1300 },
                { ref: "2026-02", barra: 1500, linha: 2800 },
                { ref: "2026-03", barra: -300, linha: 2500 },
                { ref: "2026-04", barra: 3200, linha: 5700 },
                { ref: "2026-05", barra: 900, linha: 6600 },
                { ref: "2026-06", barra: -1800, linha: 4800 },
              ]}
            />
          </Caso>
          <Caso nome="Um mês só">
            <BarrasComLinha
              pontos={[{ ref: "2026-06", barra: 250, linha: 250 }]}
              formatar={brl}
            />
          </Caso>
          <Caso nome="Vazio">
            <BarrasComLinha pontos={[]} formatar={brl} />
          </Caso>
        </Secao>

        {/* ── Faixa de variação ────────────────────────────────────────── */}
        <Secao
          titulo="Faixa de variação"
          nota="Mínimo, média e máximo — e o aviso quando a base é curta demais."
        >
          <Caso nome="Base boa, mês dentro da faixa">
            <FaixaVariacao
              rotulo="Mercado"
              minimo={620}
              media={803}
              maximo={1010}
              atual={880}
              amostras={9}
              formatar={brl}
            />
          </Caso>
          <Caso nome="Base curta e mês FORA da faixa">
            <FaixaVariacao
              rotulo={NOME_LONGO}
              minimo={200}
              media={240}
              maximo={280}
              atual={1900}
              amostras={2}
              formatar={brl}
            />
          </Caso>
          <Caso nome="Sem variação nenhuma (um valor só)">
            <FaixaVariacao
              rotulo="Aluguel"
              minimo={2400}
              media={2400}
              maximo={2400}
              atual={2400}
              amostras={1}
              formatar={brl}
            />
          </Caso>
          <Caso nome="Números gigantes">
            <FaixaVariacao
              rotulo="Obra"
              minimo={0.01}
              media={4_100_000}
              maximo={12_400_000}
              atual={12_400_000}
              amostras={7}
              formatar={brl}
            />
          </Caso>
        </Secao>

        {/* ── Peças antigas, revisadas ─────────────────────────────────── */}
        <Secao
          titulo="Anel e medidor"
          nota="Anel com risco de ritmo e fio interno para o que passa de 100%; medidor com entalhes em 85% e 100%."
        >
          <Caso nome="0%, 62% com ritmo, 137% e valor inválido">
            <div className="flex flex-wrap items-start justify-center gap-6">
              <AnelProgresso valor={0} rotulo="Recém-criada" />
              <AnelProgresso
                valor={62}
                marca={80}
                rotuloMarca="prazo já corrido"
                rotulo="Viagem"
                centro={brl(6200)}
                legenda="de R$ 10.000"
              />
              <AnelProgresso valor={137} rotulo="Reserva de emergência" tom="success" />
              <AnelProgresso
                valor={Number.NaN}
                rotulo={NOME_LONGO}
                cor="#7c3aed"
                centro={brl(12_400_000)}
              />
            </div>
          </Caso>
          <Caso nome="Medidor: 0, 84, 92 e 148%">
            <div className="grid gap-4 sm:grid-cols-2">
              <Medidor valor={0} rotulo="Nada comprometido" legenda="Mês recém-começado." />
              <Medidor valor={84} rotulo="No limite do confortável" />
              <Medidor valor={92} rotulo="Comprometimento da renda" compacto />
              <Medidor valor={148} rotulo="Estourou" legenda="Passou da renda inteira." />
            </div>
          </Caso>
          <Caso nome="Sobre o navy do herói">
            <NumeroHeroi
              rotulo="Se nada mudar, você fecha o mês com"
              valor={brl(1284.9)}
              sinal="positivo"
              lateral={<Medidor valor={92} rotulo="Da renda comprometida" sobre="escuro" compacto />}
              rodape={
                <BarraComMarca
                  valor={70}
                  marca={30}
                  rotulo="Você já gastou 70% do planejado"
                  rotuloMarca="o mês correu 30%"
                  legenda="Nesse ritmo o mês fecha antes do dia 20."
                  sobre="escuro"
                />
              }
            />
          </Caso>
        </Secao>

        <Secao titulo="Barras do mês e barras de categoria">
          <Caso nome="Seis meses, um estourado, um zerado">
            <BarrasMes
              destaque="2026-06"
              formatar={brl}
              meses={[
                { ref: "2026-01", planejado: 5000, realizado: 4200 },
                { ref: "2026-02", planejado: 5000, realizado: 5000 },
                { ref: "2026-03", planejado: 5000, realizado: 7400 },
                { ref: "2026-04", planejado: 0, realizado: 3100 },
                { ref: "2026-05", planejado: 5000, realizado: 0 },
                { ref: "2026-06", planejado: 5000, realizado: 4800 },
              ]}
            />
          </Caso>
          <Caso nome="Categorias com marca do plano e uma estourada">
            <ul className="space-y-3">
              <BarraCategoria
                nome="Moradia"
                valor={brl(2400)}
                pct={100}
                pctMarca={100}
                detalhe="34% da sua receita"
              />
              <BarraCategoria
                nome={NOME_LONGO}
                valor={brl(1830)}
                pct={76}
                pctMarca={38}
                excedeu
                detalhe="Dobrou o combinado."
              />
              <BarraCategoria
                nome="Centavos"
                valor={brl(0.03)}
                pct={0.1}
                cor="#7c3aed"
              />
            </ul>
          </Caso>
          <Caso nome="Barra com marca, no claro">
            <div className="space-y-4">
              <BarraComMarca
                valor={70}
                marca={30}
                rotulo="70% do planejado"
                rotuloMarca="mês em 30%"
              />
              <BarraComMarca
                valor={12}
                marca={90}
                rotulo="12% do planejado"
                rotuloMarca="mês em 90%"
                legenda="Sobrando muito: ou o plano está inflado, ou faltou lançar."
              />
              <BarraComMarca valor={150} marca={-20} rotulo="Fora da faixa" rotuloMarca="marca negativa" />
            </div>
          </Caso>
        </Secao>

        <p className="mt-10 flex items-center gap-2 text-2xs text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          Rota de obra do FINCASH.
          <Target className="h-3.5 w-3.5" aria-hidden />
          Não linkada em lugar nenhum.
        </p>
      </div>
    </main>
  );
}
