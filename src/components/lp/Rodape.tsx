import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FundoBlueprint } from "@/components/lp/FundoBlueprint";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { CONTATO } from "@/lib/contato";
import {
  ASSINATURA_NOME,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/lp-precos";
import { N_FERRAMENTAS } from "@/lib/hub-lp";
import { RedesSociais } from "@/components/RedesSociais";

/**
 * O RODAPÉ.
 *
 * O fundo é uma placa de blueprint desenhada em canvas (ver
 * `FundoBlueprint`): grade de 60 px, círculos-guia, e uma rede de nós de luz
 * ligados por veias curvas com partículas correndo por dentro.
 *
 * ┌── POR QUE ESSE DESENHO, E NÃO UM GRADIENTE BONITO ────────────────────┐
 * │ Porque ele diz alguma coisa. A rede É o produto: um centro (o         │
 * │ Workspace) e o que sai dele. O rodapé de uma página que passou a      │
 * │ página inteira explicando que tudo mora num lugar só termina          │
 * │ desenhando exatamente isso.                                            │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O texto nunca disputa com o desenho: um véu escuro fica entre os dois, e
 * é ele que garante o contraste das colunas. O canvas é `aria-hidden` e
 * congela fora da tela.
 */

const LINKS = [
  { href: "#problema", rotulo: "O problema" },
  { href: "#produto", rotulo: "O que é" },
  { href: "#processo", rotulo: "Como começa" },
  { href: "#preco", rotulo: "Preço" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

export function Rodape() {
  return (
    <footer className="nv-painel mb-4 overflow-hidden bg-[#070e19]">
      {/* ------------------------------------------------ a faixa da cena -- */}
      {/*
          A cena ocupa SÓ esta faixa. Espalhá-la pelo rodapé inteiro
          empurraria linha por trás de cada coluna de texto, e um esquema
          atrás de um endereço de e-mail não é cinema, é ruído.
      */}
      <div className="relative h-[26rem] overflow-hidden sm:h-[34rem]">
        <FundoBlueprint className="pointer-events-none absolute inset-0 h-full w-full" />

        {/* o texto do CTA mora na metade de cima; a curva sobe por baixo */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,14,25,0.82) 0%, rgba(7,14,25,0.5) 55%, rgba(7,14,25,0) 100%)",
          }}
        />
        {/* e dissolve no navy liso das colunas */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={{
            background: "linear-gradient(180deg, rgba(7,14,25,0) 0%, #070e19 100%)",
          }}
        />

        <div className="relative">
          {/* ------------------------------------------------ a chamada -- */}
          <div className="nv-caixa pt-20 text-center sm:pt-24">
            <p className="nv-chapeu text-[#6dc6e6]">Tudo num lugar só</p>
            <h2 className="nv-d2 mx-auto mt-6 max-w-[22ch] text-balance !text-white">
              O {ASSINATURA_NOME} inteiro a partir de{" "}
              {ASSINATURA_PRECO_ROTULO} por mês
            </h2>
            <div className="mt-9 flex justify-center">
              <BotaoAssinarPlano
                contexto="workspace"
                tamanho="grande"
                direto
                rotulo="Começar agora"
              />
            </div>
          </div>

        </div>
      </div>

      {/* --------------------------------------------------- as colunas --- */}
      <div className="relative">
          <div className="nv-caixa">
            <div className="flex flex-col gap-12 border-t border-white/10 pt-14 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <Image
                  src="/lp/novare-logo-branca.png"
                  alt="Novare"
                  width={700}
                  height={200}
                  className="h-7 w-auto"
                />
                <p className="mt-6 text-[1.1875rem] leading-relaxed tracking-[-0.008em] text-white/70">
                  O Fin Cash, o FinPlan, a Íris e as {N_FERRAMENTAS}{" "}
                  ferramentas da casa, a partir de {ASSINATURA_PRECO_ROTULO} por
                  mês. Sem comissão de banco, corretora ou seguradora.
                </p>
                <Image
                  src="/lp/nord-logo-branca.png"
                  alt="Nord Research"
                  width={155}
                  height={40}
                  className="mt-7 h-4 w-auto opacity-55"
                />

                {/* ⚠️ A LANDING NÃO TINHA REDE SOCIAL NENHUMA — nem aqui, nem
                    em lugar algum dela. Quem chega por anúncio e quer conferir
                    a casa antes de pagar não tinha por onde: a página pede o
                    cartão e não mostra onde a Novare fala todo dia.

                    ⚠️ ELAS FICAM NO RODAPÉ PORQUE ESTA PÁGINA NÃO TEM TOPO. O
                    `NavLP`, que seria a barra com logo e links, existe no
                    repositório mas nunca foi plugado — a /assinar começa
                    direto no herói. Se um dia ela ganhar barra fixa, as redes
                    devem subir para lá também. */}
                <div className="mt-8">
                  <p className="text-[0.9375rem] tracking-[-0.012em] text-white/45">
                    A Novare todo dia
                  </p>
                  <RedesSociais className="mt-3 flex gap-4" tamanho="h-5 w-5" />
                </div>
              </div>

              <div className="grid gap-10 sm:grid-cols-3 md:gap-14">
                <div>
                  <p className="nv-chapeu text-[#6dc6e6]">Contato</p>
                  <ul className="mt-5 space-y-3 text-[1.1875rem] tracking-[-0.012em] text-white/70">
                    <li>{CONTATO.telefone}</li>
                    <li>
                      <a
                        href={`mailto:${CONTATO.email}`}
                        className="transition-colors hover:text-white"
                      >
                        {CONTATO.email}
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="nv-chapeu text-[#6dc6e6]">Legal</p>
                  <ul className="mt-5 space-y-3 text-[1.1875rem] tracking-[-0.012em] text-white/70">
                    <li>
                      <Link
                        href="/privacidade"
                        className="inline-flex items-center gap-1 transition-colors hover:text-white"
                      >
                        Política de Privacidade
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/termos"
                        className="inline-flex items-center gap-1 transition-colors hover:text-white"
                      >
                        Termos de Uso
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="nv-chapeu text-[#6dc6e6]">Nesta página</p>
                  <ul className="mt-5 space-y-3 text-[1.1875rem] tracking-[-0.012em] text-white/70">
                    {LINKS.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="transition-colors hover:text-white"
                        >
                          {l.rotulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-12 max-w-3xl text-[1.1875rem] leading-relaxed tracking-[-0.008em] text-white/55">
              Material de caráter informativo. Não constitui oferta,
              recomendação individualizada de investimento nem garantia de
              rentabilidade. A consultoria particular é analisada caso a caso e
              cobrada à parte; a assinatura dá desconto sobre ela.
            </p>

            <p className="mt-6 pb-12 text-[1.1875rem] tracking-[-0.008em] text-white/55">
              © {new Date().getFullYear()} Novare. Todos os direitos reservados.
            </p>
          </div>
      </div>
    </footer>
  );
}
