"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A ROLAGEM CINEMATOGRÁFICA — 72 quadros do FINCASH rodando, presos à rolagem.
 *
 * Rolar para baixo avança o percurso pelo app (painel, cartões, dívidas,
 * projeção); rolar para cima volta. Os quadros saem de
 * `scripts/gravar-sequencia-fincash.mjs`, que fotografa o produto DE VERDADE
 * com a conta de demonstração. Nenhuma tela aqui foi desenhada ou gerada: o
 * que a pessoa vê rolando é o que ela encontra depois de assinar.
 *
 * ── AS TRÊS DECISÕES QUE FAZEM ISTO NÃO SER UM PESO MORTO ─────────────────
 *
 * 1. DESKTOP APENAS. Os 72 quadros somam ~3 MB. Num celular em rede móvel isso
 *    é a diferença entre ler a página e desistir dela, e a landing existe para
 *    vender. Abaixo de 1024px e sob `prefers-reduced-motion`, entra UMA imagem
 *    estática (o primeiro quadro) e nada mais é baixado. O `<img>` do fallback
 *    é o mesmo arquivo do quadro inicial, então ele já está em cache quando a
 *    sequência começa no desktop.
 *
 * 2. NADA CARREGA ANTES DA HORA. O carregamento dos quadros só dispara quando
 *    a seção chega perto da tela (`IntersectionObserver` com margem de 200%).
 *    Carregar no `mount` faria a página inteira disputar banda com o herói, que
 *    é a parte que decide se a pessoa fica.
 *
 * 3. O QUADRO É DESENHADO NO `requestAnimationFrame`, e o scroll só ANOTA qual
 *    quadro desenhar. Desenhar dentro do callback do ScrollTrigger repinta o
 *    canvas várias vezes por frame em rolagem rápida; anotar e desenhar uma vez
 *    por frame mantém a coisa em 60fps.
 *
 * ⚠️ GSAP E LENIS SÃO IMPORTADOS DINAMICAMENTE, dentro do `useEffect`. São
 * ~50 kB de JavaScript que só interessam a quem vai ver a animação: import
 * estático no topo colocaria os dois no pacote da rota e o celular baixaria as
 * duas bibliotecas para nunca usá-las.
 */

const TOTAL = 72;
const caminho = (i: number) =>
  `/fincash/sequencia/q${String(i).padStart(3, "0")}.webp`;

export default function SequenciaProduto() {
  const secao = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    const podeAnimar =
      window.matchMedia("(min-width: 1024px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!podeAnimar || !secao.current) return;

    let vivo = true;
    let limpar: (() => void) | undefined;

    /* Só começa quando a seção se aproxima: 200% de margem dá tempo de baixar
       os quadros sem roubar banda do topo da página. */
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0].isIntersecting) return;
        observador.disconnect();
        montar();
      },
      { rootMargin: "200% 0px" },
    );
    observador.observe(secao.current);

    async function montar() {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("lenis"),
        ]);
      if (!vivo || !tela.current || !secao.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      /* Lenis dirige a rolagem, então o ScrollTrigger precisa ser avisado a
         cada quadro dela; sem isto o canvas anda em degraus enquanto a página
         desliza macio. */
      lenis.on("scroll", ScrollTrigger.update);
      const tique = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tique);
      gsap.ticker.lagSmoothing(0);

      const ctx = tela.current.getContext("2d");
      const quadros: HTMLImageElement[] = [];
      /* ⚠️ COMECA EM -1, E NAO EM 0. Com `atual = 0` o pedido inicial do quadro
         zero era descartado por `pedido === atual`, e o canvas ficava em branco
         (300x150, o tamanho padrao) ate a primeira rolagem. Medido no
         navegador: a assinatura de pixels do centro do canvas dava 0 antes de
         rolar. -1 nao e indice valido, entao o primeiro desenho sempre passa. */
      let atual = -1;
      let pedido = 0;
      let pintando = false;

      for (let i = 0; i < TOTAL; i++) {
        const img = new Image();
        img.src = caminho(i);
        quadros.push(img);
      }

      const pintar = () => {
        pintando = false;
        const img = quadros[pedido];
        if (!ctx || !tela.current || !img?.complete || !img.naturalWidth) return;
        if (
          tela.current.width !== img.naturalWidth ||
          tela.current.height !== img.naturalHeight
        ) {
          tela.current.width = img.naturalWidth;
          tela.current.height = img.naturalHeight;
        }
        ctx.drawImage(img, 0, 0);
        atual = pedido;
      };

      const agendar = (i: number) => {
        pedido = Math.max(0, Math.min(TOTAL - 1, i));
        if (pedido === atual || pintando) return;
        pintando = true;
        requestAnimationFrame(pintar);
      };

      quadros[0].decode?.().then(
        () => agendar(0),
        () => agendar(0),
      );
      setRodando(true);

      const gatilho = ScrollTrigger.create({
        trigger: secao.current,
        start: "top top",
        end: "+=" + window.innerHeight * 3,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => agendar(Math.round(self.progress * (TOTAL - 1))),
      });

      /* O canvas guarda o tamanho do quadro, e o quadro não muda de tamanho
         com a janela: o que muda é o CSS. Só o ScrollTrigger precisa recalcular
         as distâncias de pin quando a altura da janela muda. */
      const aoRedimensionar = () => ScrollTrigger.refresh();
      window.addEventListener("resize", aoRedimensionar);

      limpar = () => {
        window.removeEventListener("resize", aoRedimensionar);
        gatilho.kill();
        gsap.ticker.remove(tique);
        lenis.destroy();
      };
    }

    return () => {
      vivo = false;
      observador.disconnect();
      limpar?.();
    };
  }, []);

  return (
    <div id="por-dentro" ref={secao} className="relative isolate overflow-hidden bg-primary">
      <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-14 sm:px-6">
        <div className="w-full max-w-5xl">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent">
            O app, por dentro
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-[1.9rem] font-medium leading-[1.08] tracking-tight text-white sm:text-[2.4rem]">
            Role e percorra{" "}
            <span className="font-semibold text-accent-claro">
              quatro telas do FINCASH
            </span>
            .
          </h2>

          <div className="relative mt-7 overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/10">
            <canvas
              ref={tela}
              className={`block h-auto w-full ${rodando ? "" : "hidden"}`}
              aria-hidden
            />
            {/* O fallback é o primeiro quadro, e ele NÃO é decorativo: no
                celular e sob movimento reduzido, é a única imagem do produto
                que esta seção entrega. Por isso leva `alt` de verdade. */}
            {!rodando && (
              <img
                src={caminho(0)}
                width={1280}
                height={720}
                alt="Painel do FINCASH na conta de demonstração, com o quanto ainda dá para gastar no mês, a renda já comprometida e o aviso de contas vencidas."
                className="block h-auto w-full"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          <p className="mt-3 text-2xs leading-relaxed text-white/60">
            Gravado do app em funcionamento, numa conta de demonstração. Painel,
            cartões, dívidas e projeção, na ordem em que se usa.
          </p>
        </div>
      </div>
    </div>
  );
}
