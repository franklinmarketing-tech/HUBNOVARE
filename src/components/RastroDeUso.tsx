"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarUso } from "@/lib/uso";

/**
 * O REGISTRO DE USO, EM UM LUGAR SÓ.
 *
 * ═══ POR QUE NÃO UM COMPONENTE EM CADA PÁGINA ════════════════════════════
 *
 * A primeira tentativa foi pôr um `<RegistrarUso modulo="..." />` dentro de
 * cada tela. Não deu certo, e o motivo vale registrar: as páginas do Hub têm
 * várias funções com `return (` no mesmo arquivo (componentes auxiliares no
 * fim), e qualquer inserção automática erra o alvo — uma delas foi parar no
 * meio dos atributos de uma tag. Edição de JSX em dezenas de arquivos é
 * frágil por natureza.
 *
 * Aqui é o contrário: um componente, montado uma vez no layout raiz, que
 * deduz o módulo a partir da rota. Tela nova passa a ser medida **sozinha**,
 * sem ninguém lembrar de instrumentar — que é justamente o tipo de coisa de
 * que ninguém lembra.
 *
 * ⚠️ DISPARA A CADA MUDANÇA DE ROTA, não a cada render. O `pathname` é a
 * dependência do efeito, e `registrarUso` ainda ignora repetição do mesmo
 * par módulo+ação na mesma visita.
 *
 * ⚠️ O QUE NÃO É MEDIDO, DE PROPÓSITO:
 *   • `/admin` e `/equipe` — é a casa olhando a própria casa; contar isso
 *     polui o ranking com o uso de quem administra.
 *   • rotas de API, arquivos e o que não é página.
 */

/** A rota vira o slug do módulo. Primeiro trecho, com dois casos especiais. */
function moduloDaRota(pathname: string): string | null {
  const p = pathname.split("?")[0].replace(/\/+$/, "");
  if (!p || p === "") return "home";

  const partes = p.split("/").filter(Boolean);
  if (partes.length === 0) return "home";

  const raiz = partes[0];

  /* A casa olhando a si mesma não entra na conta. */
  if (["admin", "equipe", "api", "login", "_next"].includes(raiz)) return null;

  /* As ferramentas são medidas pelo NOME de cada uma, não pelo guarda-chuva:
     saber que "/ferramentas" foi aberto 400 vezes não diz nada; saber que o
     orçamento responde por 300 delas diz tudo. */
  if (raiz === "ferramentas" && partes[1]) return partes[1];

  /* Artigo do News conta como "novare-news": o ranking é de produto, e 24
     slugs de matéria afogariam os apps. */
  if (raiz === "novare-news") return "novare-news";

  return raiz;
}

export function RastroDeUso() {
  const pathname = usePathname();

  useEffect(() => {
    const modulo = moduloDaRota(pathname);
    if (modulo) registrarUso(modulo, "abriu");
  }, [pathname]);

  return null;
}
