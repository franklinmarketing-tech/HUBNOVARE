"use client";

/**
 * As peças da tela de categorias.
 *
 * Moram aqui, e não em `pecas.tsx`, porque só esta tela as usa: o formulário
 * de categoria e o seletor de cor não têm segundo cliente, e peça sem segundo
 * cliente promovida cedo demais vira peso morto no arquivo que todas as telas
 * importam. Se o dia chegar, a mudança é mover o export.
 */

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { BotaoAcao } from "../pecas";
import type { Categoria, GrupoCategoria } from "@/lib/fincash/modelo";

/**
 * A paleta oferecida.
 *
 * FECHADA de propósito. Seletor de cor livre num app financeiro é a via mais
 * rápida para uma lista de categorias em amarelo-limão sobre branco — ilegível
 * e, no gráfico do painel, indistinguível da vizinha. Estas doze são as mesmas
 * do seed, todas com contraste suficiente sobre o branco do card e distintas
 * entre si na barra de categoria.
 */
export const CORES = [
  "#1e3a5f", "#2563eb", "#0891b2", "#0d9488",
  "#059669", "#16a34a", "#7c3aed", "#a855f7",
  "#db2777", "#ec4899", "#e8703a", "#dc2626",
];

export const GRUPOS_50_30_20: {
  chave: GrupoCategoria | "";
  rotulo: string;
  ajuda: string;
}[] = [
  { chave: "necessidades", rotulo: "Necessidades", ajuda: "o que não se corta: moradia, mercado, saúde" },
  { chave: "estilo", rotulo: "Estilo de vida", ajuda: "o que se escolhe: lazer, restaurante, assinaturas" },
  { chave: "futuro", rotulo: "Futuro", ajuda: "o que vira patrimônio: investimento, quitar dívida" },
  { chave: "", rotulo: "Sem grupo", ajuda: "aparece em “Outras categorias” no orçamento" },
];

// ─────────────────────────────────────────────────────────── Seletor de cor ──

export function SeletorCor({
  valor,
  aoEscolher,
}: {
  valor: string;
  aoEscolher: (cor: string) => void;
}) {
  return (
    /* `radiogroup` e não uma fileira de botões soltos: quem navega por teclado
       ou leitor de tela precisa ouvir "cor 3 de 12", não doze botões sem nome
       nenhum e sem relação entre si. */
    <div role="radiogroup" aria-label="Cor da categoria" className="flex flex-wrap gap-1.5">
      {CORES.map((c, i) => {
        const escolhida = c.toLowerCase() === valor.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={escolhida}
            aria-label={`Cor ${i + 1} de ${CORES.length}`}
            onClick={() => aoEscolher(c)}
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn"
          >
            <span
              aria-hidden
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                escolhida ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              style={{ background: c }}
            >
              {/* Nunca só cor: a escolhida leva o visto. Sem ele, quem não
                  distingue as duas cores vizinhas não sabe qual está ativa. */}
              {escolhida && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────── Formulário ─────

export type DadosCategoria = {
  nome: string;
  cor: string;
  grupo: GrupoCategoria | null;
};

/**
 * O formulário de criar e o de renomear são o MESMO.
 *
 * Dois formulários quase iguais é como um deles ganha a validação de nome
 * vazio e o outro não — e aí a pessoa consegue renomear "Mercado" para "" e
 * perde a categoria de vista sem ter apagado nada.
 *
 * A SUBCATEGORIA NÃO ESCOLHE GRUPO: ela herda o do pai. Deixar a filha num
 * grupo diferente do pai a faria aparecer num bloco do orçamento e o pai em
 * outro, com o total de um contendo o gasto do outro. É a incoerência que
 * quebra a soma 50/30/20 inteira.
 */
export function FormCategoria({
  inicial,
  ehSub,
  rotuloAcao,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: Partial<DadosCategoria>;
  ehSub?: boolean;
  rotuloAcao: string;
  aoSalvar: (d: DadosCategoria) => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [cor, setCor] = useState(inicial?.cor ?? CORES[0]);
  const [grupo, setGrupo] = useState<GrupoCategoria | "">(inicial?.grupo ?? "");
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  const valido = nome.trim().length >= 1 && nome.trim().length <= 40;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        aoSalvar({ nome: nome.trim(), cor, grupo: grupo === "" ? null : grupo });
      }}
      className="rounded-xl border border-accent/40 bg-accent-tint/40 p-3 sm:p-4"
    >
      <label className="block text-2xs font-semibold uppercase tracking-wider text-primary">
        {ehSub ? "Nome da subcategoria" : "Nome da categoria"}
        <input
          ref={campo}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          placeholder={ehSub ? "Streaming" : "Alimentação"}
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-btn"
        />
      </label>

      <div className="mt-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary">Cor</p>
        <div className="mt-1">
          <SeletorCor valor={cor} aoEscolher={setCor} />
        </div>
      </div>

      {!ehSub && (
        <fieldset className="mt-3">
          <legend className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Grupo (a regra 50/30/20)
          </legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {GRUPOS_50_30_20.map((g) => {
              const ativo = grupo === g.chave;
              return (
                <button
                  key={g.rotulo}
                  type="button"
                  aria-pressed={ativo}
                  title={g.ajuda}
                  onClick={() => setGrupo(g.chave)}
                  className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn ${
                    ativo
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-primary hover:bg-gelo"
                  }`}
                >
                  {g.rotulo}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
            {GRUPOS_50_30_20.find((g) => g.chave === grupo)?.ajuda}
          </p>
        </fieldset>
      )}

      <div className="mt-4 flex gap-2">
        <BotaoAcao tipo="submit" Icone={Check} desabilitado={!valido} tamanho="sm">
          {rotuloAcao}
        </BotaoAcao>
        <BotaoAcao variante="contorno" tamanho="sm" Icone={X} onClick={aoCancelar}>
          Cancelar
        </BotaoAcao>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────────────────────── Utilidades ────

/** As filhas de um pai, na ordem da pessoa. Uma função só porque a tela pede
    isso em três lugares e três `filter` iguais é um a mais para divergir. */
export const filhasDe = (id: string, todas: Categoria[]) =>
  todas.filter((c) => c.pai_id === id);
