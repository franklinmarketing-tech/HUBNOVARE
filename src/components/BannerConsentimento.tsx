"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Banner de consentimento LGPD.
 *
 * Discreto, fixo na base da tela. Informa o uso de cookies/armazenamento e o
 * tratamento de dados, com link para a política. O botão "Entendi" grava o
 * aceite em localStorage (chave 'novare:consent') e o banner some — não volta
 * a aparecer depois de aceito.
 *
 * Só decide se aparece DEPOIS de montar no cliente (localStorage não existe no
 * servidor), evitando piscar ou divergência de hidratação.
 */
const CHAVE_CONSENTIMENTO = "novare:consent";

export function BannerConsentimento() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHAVE_CONSENTIMENTO)) {
        setVisivel(true);
      }
    } catch {
      // localStorage indisponível (modo privado/bloqueado): mostra mesmo assim.
      setVisivel(true);
    }
  }, []);

  function aceitar() {
    try {
      localStorage.setItem(CHAVE_CONSENTIMENTO, new Date().toISOString());
    } catch {
      // Sem armazenamento, ao menos some nesta sessão.
    }
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de privacidade e cookies"
      className="fixed inset-x-0 bottom-0 z-50 print:hidden"
    >
      <div className="mx-auto mb-3 w-[min(100%-1.5rem,42rem)]">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 text-foreground shadow-elevated backdrop-blur-md sm:flex-row sm:items-center sm:gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Usamos cookies e armazenamento no seu navegador para manter você
            conectado, lembrar preferências e operar as ferramentas, além de
            tratar dados conforme a LGPD. Saiba mais na nossa{" "}
            <Link
              href="/privacidade"
              className="font-medium text-primary underline underline-offset-2 hover:text-accent-strong transition-colors"
            >
              Política de Privacidade
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={aceitar}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
