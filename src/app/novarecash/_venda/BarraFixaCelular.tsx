"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const CHAVE_CONSENTIMENTO = "novare:consent";

/**
 * A barra fixa do rodapé, só no celular, com o CTA da página.
 *
 * Aparece depois que a pessoa passa do herói (onde o CTA já está à vista) e
 * some enquanto a seção de planos está na tela: dois botões iguais lado a
 * lado é ruído.
 *
 * ⚠️ ESPERA A VEZ DO AVISO DE COOKIES, como o `InstalarApp`: os dois moram na
 * base da tela, e um por cima do outro esconde justamente o "Entendi".
 */
export function BarraFixaCelular({
  href,
  texto,
  apoio,
}: {
  href: string;
  texto: string;
  /** A linha miúda à esquerda ("a partir de R$ X/mês" no modo venda). */
  apoio: string;
}) {
  const [passouDoHeroi, setPassouDoHeroi] = useState(false);
  const [planosNaTela, setPlanosNaTela] = useState(false);
  const [cookiesResolvidos, setCookiesResolvidos] = useState(false);

  useEffect(() => {
    const conferir = () => {
      try {
        setCookiesResolvidos(Boolean(localStorage.getItem(CHAVE_CONSENTIMENTO)));
      } catch {
        setCookiesResolvidos(false);
      }
    };
    conferir();
    const relogio = window.setInterval(conferir, 1500);

    const aoRolar = () => setPassouDoHeroi(window.scrollY > 560);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });

    const planos = document.getElementById("planos");
    const observador = planos
      ? new IntersectionObserver(([e]) => setPlanosNaTela(e.isIntersecting), { threshold: 0.15 })
      : null;
    if (planos) observador?.observe(planos);

    return () => {
      window.clearInterval(relogio);
      window.removeEventListener("scroll", aoRolar);
      observador?.disconnect();
    };
  }, []);

  const visivel = passouDoHeroi && !planosNaTela && cookiesResolvidos;

  return (
    <div
      aria-hidden={!visivel}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-noite/95 px-4 pt-3 backdrop-blur-md transition-transform duration-300 sm:hidden print:hidden ${
        visivel ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-2xs leading-snug text-white/75">{apoio}</p>
        <a href={href} tabIndex={visivel ? 0 : -1} className="btn-cp shrink-0">
          {texto}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
