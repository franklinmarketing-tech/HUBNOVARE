import { brl, brlCurto } from "@/app/planejamento/app/pecas";

/**
 * Os gráficos do relatório.
 *
 * Tudo é SVG e CSS escritos à mão, sem recharts: o relatório vira PDF pela
 * impressão do navegador, e biblioteca de gráfico costuma medir o
 * contêiner em tempo de execução — na hora de imprimir, o contêiner tem
 * largura zero e o gráfico sai em branco. SVG com viewBox imprime igual ao
 * que se vê na tela.
 *
 * As cores vêm de variáveis da marca, mas com fallback literal: a janela
 * de impressão nem sempre resolve `var()` em atributo SVG.
 */

const AZUL = "#16314f";
const LARANJA = "#e8703a";
const VERDE = "#2f9e6f";
const AMBAR = "#e0a02a";
const VERMELHO = "#c8442f";
const TRILHO = "#e6e9ee";

/* -------------------------------------------------------------- saúde */

/** A cor segue a régua da nota, não o gosto: verde só quando é verde. */
function corDaNota(score: number) {
  if (score >= 70) return VERDE;
  if (score >= 40) return AMBAR;
  return VERMELHO;
}

/**
 * Medidor semicircular da saúde financeira (0–100).
 *
 * Semicírculo em vez de círculo cheio porque a leitura é de "quanto do
 * caminho", não de "fatia de um todo" — e ocupa metade da altura na folha.
 */
export function MedidorSaude({ score, nota }: { score: number; nota: string }) {
  const raio = 70;
  const perimetro = Math.PI * raio; // só a metade de cima
  const preenchido = (Math.max(0, Math.min(100, score)) / 100) * perimetro;
  const cor = corDaNota(score);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 180 100" className="h-[100px] w-[180px] shrink-0">
        {/* Trilho */}
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke={TRILHO}
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Preenchimento */}
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke={cor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${preenchido} ${perimetro}`}
        />
        <text
          x="90"
          y="76"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill={AZUL}
        >
          {score}
        </text>
        <text x="90" y="92" textAnchor="middle" fontSize="11" fill="#64748b">
          de 100
        </text>
      </svg>

      <div>
        <p className="font-display text-2xl font-extrabold" style={{ color: cor }}>
          {nota}
        </p>
        <p className="text-xs text-slate-500">
          {score >= 70
            ? "Base sólida. Dá para pensar em crescer."
            : score >= 40
              ? "Dá para melhorar sem apertar demais."
              : "Há pontos urgentes antes de investir."}
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- pilares da saúde */

export function BarrasPilares({
  pilares,
}: {
  pilares: { key: string; nome: string; score: number }[];
}) {
  return (
    <div className="space-y-2">
      {pilares.map((p) => (
        <div key={p.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs text-slate-600">{p.nome}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e6e9ee]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(2, Math.min(100, p.score))}%`,
                background: corDaNota(p.score),
              }}
            />
          </span>
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700">
            {p.score}
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------- Marco Horizonte */

export function BarraMarco({
  hoje,
  alvo,
  pctAposentadoria,
}: {
  hoje: number;
  alvo: number;
  pctAposentadoria: number;
}) {
  const pct = alvo > 0 ? Math.max(0, Math.min(100, (hoje / alvo) * 100)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-slate-500">
        <span>
          Hoje: <strong className="text-slate-800">{brlCurto(hoje)}</strong>
        </span>
        <span>
          Alvo: <strong className="text-slate-800">{brlCurto(alvo)}</strong>
        </span>
      </div>

      <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-[#e6e9ee]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(pct, 1.5)}%`,
            background: `linear-gradient(90deg, ${LARANJA}, #f59b6b)`,
          }}
        />
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        Você tem{" "}
        <strong className="text-slate-800">
          {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
        </strong>{" "}
        do patrimônio total. O ritmo atual cobre{" "}
        <strong className="text-slate-800">
          {pctAposentadoria.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
        </strong>{" "}
        da aposentadoria.
      </p>
    </div>
  );
}

/* ------------------------------------------------- para onde vai o dinheiro */

/**
 * Barras horizontais das categorias.
 *
 * Barra em vez de pizza porque a pergunta é "qual é a maior?" — e o olho
 * compara comprimento muito melhor do que ângulo. A maior fatia serve de
 * régua: as outras são desenhadas em proporção a ela, senão categorias
 * pequenas viram traços invisíveis.
 */
export function BarrasCategorias({
  itens,
}: {
  itens: { rotulo: string; valor: number; fatia: number }[];
}) {
  if (itens.length === 0) return null;
  const maior = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <div className="space-y-2">
      {itens.map((i, idx) => (
        <div key={i.rotulo} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-slate-600" title={i.rotulo}>
            {i.rotulo}
          </span>
          <span className="h-4 flex-1 overflow-hidden rounded-md bg-[#f1f4f8]">
            <span
              className="block h-full rounded-md"
              style={{
                width: `${Math.max(3, (i.valor / maior) * 100)}%`,
                /* A maior despesa em laranja: é onde mora a economia
                   possível, e o relatório precisa apontar para ela. */
                background: idx === 0 ? LARANJA : "#8fa8c4",
              }}
            />
          </span>
          {/* Valor exato: num relatório financeiro, "R$ 3 mil" no lugar de
              R$ 2.800 passa desleixo — e a coluna cabe. */}
          <span className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-600">
            {brl(i.valor)}
          </span>
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-primary">
            {i.fatia}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------ fluxo do mês */

/**
 * Entra / sai / sobra, em proporção real.
 *
 * Substitui quatro números soltos: ver a barra de despesa ocupando quase
 * toda a da renda diz mais sobre o mês do que a diferença entre dois
 * valores escritos lado a lado.
 */
export function FluxoDoMes({
  renda,
  despesa,
  parcelas,
  sobra,
}: {
  renda: number;
  despesa: number;
  parcelas: number;
  sobra: number;
}) {
  const base = Math.max(renda, despesa + parcelas, 1);
  const larg = (v: number) => `${Math.max(1, (v / base) * 100)}%`;

  return (
    <div className="space-y-2.5">
      <Linha rotulo="Entra" valor={renda} largura={larg(renda)} cor={VERDE} />
      <Linha rotulo="Sai" valor={despesa} largura={larg(despesa)} cor="#8fa8c4" />
      {parcelas > 0 && (
        <Linha rotulo="Parcelas" valor={parcelas} largura={larg(parcelas)} cor={VERMELHO} />
      )}
      <Linha
        rotulo="Sobra"
        valor={sobra}
        largura={larg(Math.abs(sobra))}
        cor={sobra >= 0 ? LARANJA : VERMELHO}
        destaque
      />
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  largura,
  cor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  largura: string;
  cor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-16 shrink-0 text-xs ${destaque ? "font-bold text-primary" : "text-slate-600"}`}
      >
        {rotulo}
      </span>
      <span className="h-4 flex-1 overflow-hidden rounded-md bg-[#f1f4f8]">
        <span className="block h-full rounded-md" style={{ width: largura, background: cor }} />
      </span>
      <span
        className={`w-28 shrink-0 text-right text-xs tabular-nums ${
          destaque ? "font-bold text-primary" : "text-slate-600"
        }`}
      >
        {brl(valor)}
      </span>
    </div>
  );
}
