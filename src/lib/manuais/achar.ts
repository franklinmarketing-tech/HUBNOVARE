/**
 * ACHA NA TELA O QUE O MANUAL DESCREVE (25/10/2026) — base do tour guiado e dos "?" nos termos.
 *
 * O manual guarda cada campo pelo nome EXATO da tela (`campos[].nome`). Aqui se procura, dentro
 * do <main>, o rótulo/título/botão cujo texto COMEÇA com esse nome — sem acento e sem maiúscula,
 * para "Saldo inicial" casar com "Saldo inicial (R$)". Nome com "/" ("Valor do imóvel / Valor do
 * veículo") vale qualquer uma das partes. Só elementos visíveis.
 *
 * ⚠️ Não mexe no DOM: devolve os elementos e quem chama desenha por cima (portal). Mexer em nó do
 * React quebra a próxima renderização.
 */
import type { Manual } from "./tipo";

const normal = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/["“”'']/g, "").replace(/\s+/g, " ").trim().toLowerCase();

const SELETOR = "label, legend, dt, h2, h3, h4, th, summary, button, [role=tab], p.text-xs, p.text-sm, span.text-xs";

/** `parte`: a alternativa do nome que bateu, escrita como no manual ("Valor do imóvel"). */
export type Achado = { el: HTMLElement; nome: string; parte: string; explica: string };

/** Os passos do tour: os do `tour` do manual quando houver, senão os campos. */
export function acharPassosDoTour(manual: Manual, limite = 6): Achado[] {
  if (!manual.tour?.length) return acharCampos(manual, limite);
  const titulos = new Map(manual.tour.map((t) => [t.alvo, t.titulo]));
  return acharCampos({ ...manual, campos: manual.tour.map((t) => ({ nome: t.alvo, explica: t.explica })) }, limite).map((a) => ({
    ...a,
    parte: titulos.get(a.nome) ?? a.parte,
  }));
}

export function acharCampos(manual: Manual, limite = 8): Achado[] {
  const main = document.querySelector("main");
  if (!main) return [];
  const candidatos = [...main.querySelectorAll<HTMLElement>(SELETOR)].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.closest("[role=dialog]");
  });
  const usados = new Set<HTMLElement>();
  const achados: Achado[] = [];
  for (const c of manual.campos) {
    const partes = c.nome.split("/").map((p) => p.trim()).filter((p) => normal(p).length >= 3);
    let parte = "";
    const el = candidatos.find((e) => {
      if (usados.has(e)) return false;
      const t = normal(e.innerText || "").slice(0, 120);
      parte = partes.find((p) => t.startsWith(normal(p))) ?? "";
      return !!parte;
    });
    if (el) {
      usados.add(el);
      achados.push({ el, nome: c.nome, parte, explica: c.explica });
    }
    if (achados.length >= limite) break;
  }
  return achados;
}
