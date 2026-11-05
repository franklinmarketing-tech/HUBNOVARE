import type { AcaoUso } from "@/lib/uso";
import type { ModuloQuiz } from "@/lib/quiz-comeco";

/**
 * MEDIR A VENDA E A CAPTAÇÃO (05/11/2026) — impressão, clique e fechamento.
 *
 * Até aqui a casa sabia quantas vezes cada TELA abria (`RastroDeUso`,
 * `RegistrarVisita`), mas não sabia nada do que acontece dentro da venda:
 * quantas pessoas viram o pop-up da Black, quantas clicaram, quantas fecharam,
 * e qual botão do `/novarecash` leva gente ao checkout. Sem isso, toda mudança
 * de texto ou de lugar é palpite.
 *
 * Vai para a MESMA tabela (`hub_eventos`, via `/api/uso`): só o nome do bloco
 * e a ação. ⚠️ NADA DE DADO PESSOAL NO EVENTO: nem e-mail, nem texto digitado,
 * nem preço, nem URL com parâmetro. O `usuario_id` de quem está logado é posto
 * pela rota, a partir da sessão (como em todo `hub_eventos`), e é ele que deixa
 * o gatilho `hub_eventos_barra_equipe` descartar o clique da própria equipe.
 *
 * AS REGRAS
 * 1. Nunca bloqueia a navegação: `sendBeacon` (feito para isso: o navegador
 *    entrega mesmo com a página indo embora, no clique que leva ao checkout) e,
 *    sem ele, `fetch` com `keepalive`. Nada de `await`.
 * 2. ⚠️ SÓ DEPOIS DO ACEITE DOS COOKIES (`novare:consent`), a mesma régua do
 *    Clarity. O evento é próprio e anônimo, mas medir antes do aceite é medir
 *    sem avisar — e isso a LGPD da casa não faz.
 * 3. Falha em silêncio. É estatística nossa, não dado do cliente.
 * 4. Fora do localhost e de navegador automatizado: o localhost grava no banco
 *    de PRODUÇÃO, e teste não é visita (a mesma regra de `registrarUso`).
 *
 * OS NOMES SÃO FECHADOS (`MODULOS_MEDIDOS`): bloco novo entra na lista, nunca
 * como texto solto. Nome que varia ("popup", "popupBlack", "pop-up-black") é
 * evento que ninguém consegue somar depois.
 */

export const MODULOS_MEDIDOS = [
  // As janelas que abrem sozinhas.
  "popup-black",
  "convite-saida",
  "balao-ola",
  // Os botões de venda do /novarecash.
  "venda:faixa",
  "venda:heroi",
  "venda:plano",
  "venda:barra-fixa",
  "venda:whatsapp",
  "venda:fecho",
  "venda:fazer-parte",
] as const;

/**
 * Mais os nomes do quiz "Por onde eu começo?" (05/11/2026) — também FECHADOS, só que gerados
 * pelos tipos de `lib/quiz-comeco.ts` (origem × as 36 combinações de resposta, e as portas
 * sugeridas). São dezenas: listá-los à mão aqui seria o jeito certo de um sair diferente.
 * Import só de TIPO: nada do quiz vem junto para quem usa este arquivo.
 */
export type ModuloMedido = (typeof MODULOS_MEDIDOS)[number] | ModuloQuiz;

/** Só três ações aqui: a janela apareceu (impressão), clicou no convite, fechou. */
export type AcaoMedida = Extract<AcaoUso, "abriu" | "clicou" | "fechou">;

/* Os nomes do quiz são gerados (origem × respostas), então entram pelo prefixo `quiz-comeco:`. */
export const ehModuloMedido = (m: string): m is ModuloMedido =>
  (MODULOS_MEDIDOS as readonly string[]).includes(m) || m.startsWith("quiz-comeco:");

/**
 * Marca um botão para o `MedirCliques` contar o clique — serve em componente
 * de SERVIDOR, que não tem `onClick`: `<a {...medirClique("venda:heroi")}>`.
 */
export const medirClique = (modulo: ModuloMedido) => ({ "data-medir": modulo });

const CHAVE_CONSENTIMENTO = "novare:consent";

export function medir(modulo: ModuloMedido, acao: AcaoMedida): void {
  if (typeof window === "undefined") return;
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;
  if (navigator.webdriver) return;
  try {
    if (!localStorage.getItem(CHAVE_CONSENTIMENTO)) return;
  } catch {
    return; // sem storage não há como saber do aceite: não mede
  }

  const corpo = JSON.stringify({ modulo, acao });
  try {
    /* `text/plain` de propósito: é o tipo que o `sendBeacon` manda sem
       pré-checagem em todo navegador. A rota lê o corpo como JSON igual. */
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/uso", new Blob([corpo], { type: "text/plain;charset=UTF-8" }))) {
      return;
    }
  } catch {
    /* cai no fetch */
  }
  try {
    void fetch("/api/uso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: corpo,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Silêncio de propósito: ver a regra 3. */
  }
}
