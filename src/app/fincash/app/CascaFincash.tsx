"use client";

import { useEffect, useState } from "react";

import { BarraLateralFincash, NavFincashCelular } from "./NavFincash";
import { SEM_AVISOS, type AvisosDoMenu } from "./avisos";

const CHAVE = "fincash:menu-recolhido";

/**
 * A moldura do app: trilho lateral + a área onde a tela respira.
 *
 * POR QUE ISTO EXISTE, se o layout já é um componente
 * O layout é servidor (precisa ser: é lá que a sessão é lida). O recolher do
 * menu é estado de navegador, e o `padding-left` do conteúdo TEM de mudar
 * junto com a largura do trilho — os dois precisam do mesmo booleano. Passar
 * esse estado por contexto para dois filhos distantes seria cerimônia para um
 * `useState`; então o pedaço que depende dele vira um cliente só, e o layout
 * segue servidor.
 *
 * A ESCOLHA É LEMBRADA, mas lida DEPOIS da hidratação, nunca no `useState`
 * inicial: o servidor não tem `localStorage`, e um HTML que não bate com o
 * primeiro render do cliente é erro de hidratação. O preço é um piscar
 * possível de quem deixou recolhido — e é por isso que a largura muda SEM
 * transição: animar essa restauração transformaria o piscar em um deslize
 * indesejado toda vez que o app abre. Recolher continua sendo instantâneo,
 * que também é a resposta certa para `prefers-reduced-motion`.
 */
export function CascaFincash({
  nome,
  avisos = SEM_AVISOS,
  sair,
  children,
}: {
  nome?: string;
  /* Os contadores atravessam daqui, e não são buscados em cada barra: o dado
     é o mesmo nas duas, e duas barras pedindo a mesma coisa ao banco é o jeito
     clássico de fazer um número aparecer diferente em cada lugar. */
  avisos?: AvisosDoMenu;
  sair: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    try {
      setRecolhida(window.localStorage.getItem(CHAVE) === "1");
    } catch {
      /* Navegador com armazenamento bloqueado: o menu abre expandido, que é o
         padrão. Preferência perdida não pode derrubar a navegação. */
    }
  }, []);

  function alternar() {
    setRecolhida((v) => {
      const novo = !v;
      try {
        window.localStorage.setItem(CHAVE, novo ? "1" : "0");
      } catch {}
      return novo;
    });
  }

  return (
    <>
      <BarraLateralFincash
        nome={nome}
        avisos={avisos}
        recolhida={recolhida}
        aoAlternar={alternar}
        sair={sair}
      />

      {/* O vão à esquerda espelha a largura do trilho — ele é `fixed` e não
          empurra nada sozinho. O conteúdo segue com o mesmo `max-w-5xl` de
          antes e CENTRALIZADO no que sobra: assim as tabelas largas de Faturas
          e Projeção continuam com a largura que sempre tiveram, e no monitor
          grande o trilho não "puxa" a página para a direita.

          O respiro de baixo é maior no celular por causa da barra do polegar:
          sem ele, o último cartão fica escondido atrás do menu. */}
      <div
        className={`md:pl-[76px] ${recolhida ? "" : "lg:pl-64"}`}
      >
        <main className="mx-auto max-w-5xl px-5 pb-28 pt-6 md:pb-12 md:pt-8">
          {children}
        </main>
      </div>

      <NavFincashCelular avisos={avisos} />
    </>
  );
}
