"use client";

import { useEffect, useState } from "react";

/**
 * A fita de progresso da leitura, presa no topo da janela.
 *
 * Numa home que agora tem duas partes, ela responde à pergunta que a barra
 * de rolagem do sistema já não responde bem no Mac (onde ela some): "falta
 * muito?". Só aparece quando existe algo para rolar — numa tela onde tudo
 * cabe, uma fita parada em zero seria só sujeira.
 *
 * Escreve numa variável CSS em vez de mexer no estilo final, para o CSS
 * poder desligá-la inteira em `prefers-reduced-motion`.
 */
export function FitaProgresso() {
  const [rolavel, setRolavel] = useState(false);

  useEffect(() => {
    const barra = document.getElementById("fita-progresso");
    if (!barra) return;

    let pendente = false;

    function medir() {
      pendente = false;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;

      // Menos de meia tela de rolagem não vale uma fita.
      if (total < window.innerHeight * 0.5) {
        setRolavel(false);
        return;
      }
      setRolavel(true);
      barra!.style.setProperty("--lido", String(Math.min(1, window.scrollY / total)));
    }

    function aoRolar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(medir);
    }

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return (
    <div
      id="fita-progresso"
      className="fita-progresso"
      style={{ opacity: rolavel ? 1 : 0 }}
      aria-hidden
    />
  );
}
