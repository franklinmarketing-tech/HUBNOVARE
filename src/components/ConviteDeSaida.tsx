"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import {
  ASSINATURA_NOME,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import { ROTULO_DESCONTO } from "@/lib/consultoria";

/**
 * O convite que aparece quando a pessoa está indo embora.
 *
 * COMO ELE DECIDE APARECER
 * No desktop, quando o cursor sai pela BORDA DE CIMA da janela — o gesto de
 * quem vai fechar a aba ou trocar de site. No celular não existe esse gesto,
 * então o gatilho é rolar de volta para o topo depois de já ter descido a
 * página: o mesmo sinal de "terminei aqui".
 *
 * O QUE ELE NÃO FAZ
 * Não tem contagem regressiva, não diz "últimas vagas" e não inventa oferta
 * que expira. Escassez fabricada converte no primeiro clique e destrói a
 * confiança no segundo — e a Novare vende justamente confiança. O que ele
 * mostra é a oferta real, que é boa o suficiente: 7 dias grátis, sem cartão.
 *
 * REGRAS DE EDUCAÇÃO
 * Aparece uma vez por pessoa (guardado no navegador), nunca antes de 12
 * segundos na página, e nunca em quem já está logado ou já está na página de
 * assinatura — quem já decidiu não precisa ser convencido de novo.
 */

const CHAVE = "novare:convite-saida";
const ESPERA_MS = 12_000;

/**
 * Onde ele nunca aparece.
 *
 * Quem já está na página de venda está convencido; quem está logado no app já
 * é cliente; quem está no login está no meio de um formulário. Interromper
 * qualquer um dos três é atrapalhar, não converter.
 */
// "/assinar" cobre as duas landings: a do Diagnóstico Patrimonial e a da
// assinatura, em "/assinar/workspace" (a checagem abaixo casa o prefixo).
const MUDO_EM = ["/assinar", "/login", "/hub", "/admin", "/perfil", "/planejamento/app"];

export function ConviteDeSaida() {
  const caminho = usePathname();
  const desativado = MUDO_EM.some(
    (rota) => caminho === rota || caminho.startsWith(`${rota}/`),
  );
  const [aberto, setAberto] = useState(false);

  const marcarVisto = useCallback(() => {
    try {
      localStorage.setItem(CHAVE, String(Date.now()));
    } catch {
      // Navegador em modo privado ou com storage bloqueado: tudo bem, o
      // convite simplesmente poderá aparecer de novo numa próxima visita.
    }
  }, []);

  const fechar = useCallback(() => {
    setAberto(false);
    marcarVisto();
  }, [marcarVisto]);

  useEffect(() => {
    if (desativado) return;

    try {
      if (localStorage.getItem(CHAVE)) return;
    } catch {
      // Sem storage não dá para saber se já viu; segue e mostra uma vez.
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Navegador automatizado não tem intenção de sair: o cursor cruzando a
    // borda é um comando de script, não um gesto humano. Além de evitar um
    // pop-up sem sentido para robôs e crawlers, isso tira da suíte de testes
    // uma fonte de intermitência — o convite abria por cima da tela que outro
    // teste estava conferindo.
    if (navigator.webdriver) return;

    let liberado = false;
    let desceu = false;

    const carencia = window.setTimeout(() => {
      liberado = true;
    }, ESPERA_MS);

    const abrir = () => {
      if (!liberado) return;
      // Nunca por cima de outra coisa: se já existe um diálogo aberto (a
      // paleta de comandos, o pop-up de assinatura, o banner de consentimento),
      // interromper é atrapalhar quem está no meio de uma ação.
      if (document.querySelector('[role="dialog"]')) return;
      setAberto(true);
      marcarVisto();
      limpar();
    };

    // Desktop: o cursor cruzando a borda de cima.
    const aoSair = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) abrir();
    };

    // Celular: desceu a página e voltou ao topo.
    const aoRolar = () => {
      const y = window.scrollY;
      if (y > 700) desceu = true;
      else if (desceu && y < 120) abrir();
    };

    function limpar() {
      window.clearTimeout(carencia);
      document.removeEventListener("mouseout", aoSair);
      window.removeEventListener("scroll", aoRolar);
    }

    document.addEventListener("mouseout", aoSair);
    window.addEventListener("scroll", aoRolar, { passive: true });

    return limpar;
  }, [desativado, marcarVisto]);

  // Esc fecha e o fundo não rola.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = antes;
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/55 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={fechar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-convite-saida"
        onClick={(e) => e.stopPropagation()}
        className="palco-vivo relative flex max-h-[92dvh] w-full max-w-[27rem] flex-col overflow-hidden rounded-t-3xl text-white shadow-elevated sm:rounded-3xl"
        style={{
          background:
            "linear-gradient(157deg, hsl(215 52% 21%) 0%, hsl(216 58% 11%) 100%)",
        }}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-3.5 top-3.5 z-10 rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-8 sm:px-7">
          <span className="selo-pulsa inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-3 py-1.5 text-2xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-accent-claro" />
            {ASSINATURA_TRIAL_DIAS} dias grátis, sem cartão
          </span>

          <h2
            id="titulo-convite-saida"
            className="mt-4 font-display text-2xl font-black leading-tight tracking-tight sm:text-[1.75rem]"
          >
            Antes de ir: seu plano
            <br />
            <span className="text-accent-claro">leva dez minutos.</span>
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Você preenche o retrato financeiro uma vez e o {ASSINATURA_NOME}{" "}
            devolve diagnóstico, plano de ação e acompanhamento — sem esperar
            ninguém liberar nada.
          </p>

          <ul className="mt-5 space-y-2">
            {[
              "Planejamento Financeiro completo",
              "A Íris, a IA que lê seu extrato",
              `${ROTULO_DESCONTO} na consultoria particular`,
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-claro" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/assinar/workspace"
            onClick={fechar}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5"
          >
            Ver o que entra na assinatura
            <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="mt-3 text-center text-2xs text-white/55">
            Depois {ASSINATURA_PRECO_ROTULO}/mês. Cancele quando quiser.
          </p>

          <button
            type="button"
            onClick={fechar}
            className="mt-3 w-full text-center text-2xs font-semibold text-white/45 underline-offset-4 transition-colors hover:text-white/75 hover:underline"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}
