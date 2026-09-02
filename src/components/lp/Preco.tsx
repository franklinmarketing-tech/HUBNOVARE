import { Check, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import {
  ASSINATURA_NOME,
  ASSINATURA_PRECO,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import { INCLUI } from "@/lib/hub-lp";

/**
 * A seção de preço, reconstruída das duas referências de oferta.
 *
 * A composição é a do cartão escuro de duas colunas: à esquerda o argumento e
 * a lista do que entra; à direita, dentro de um cartão branco que flutua
 * sobre o escuro, o preço em corpo gigante, os selos e o botão.
 *
 * TRÊS COISAS QUE ESTA SEÇÃO NÃO FAZ, DE PROPÓSITO
 *
 * 1. **Não tem preço "de/por".** Não existe preço cheio de referência: riscar
 *    um número inventado ao lado do real é a mentira mais barata de uma
 *    página de vendas, e a mais fácil de conferir.
 * 2. **Não tem contador regressivo.** A assinatura é recorrente e não tem
 *    vaga limitada. Escassez fabricada converte no primeiro clique e destrói
 *    a confiança no segundo.
 * 3. **Não esconde o preço atrás de um formulário.** O valor aparece antes de
 *    qualquer pedido de dado — é o que separa oferta de armadilha.
 *
 * O herói do bloco não é o preço: é a linha "sem cartão". O medo de quem
 * chega aqui não é gastar R$ 19,90, é ser cobrado por engano depois.
 */
export function Preco() {
  const porDia = (ASSINATURA_PRECO / 30).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] backdrop-blur-sm lg:grid-cols-[1.04fr_0.96fr]">
      {/* ---------------------------------------------------- o argumento -- */}
      <div className="p-8 text-white sm:p-11 lg:p-14">
        <span className="revelar nv-pill nv-pill-escura nv-chapeu">
          <span className="nv-ponto" />
          A assinatura
        </span>

        <h2 className="revelar nv-h2 mt-7 max-w-[16ch] text-white">
          Menos que um café por dia.{" "}
          <span className="text-[#6dc6e6]">Para o resto da sua vida financeira.</span>
        </h2>

        <p className="revelar nv-lead mt-6 max-w-md text-white/72">
          Uma assinatura só, sem plano básico e sem produto vendido à parte.
          Tudo o que a Novare construiu fica liberado no primeiro dia — e os{" "}
          {ASSINATURA_TRIAL_DIAS} primeiros dias não custam nada.
        </p>

        <ul className="revelar-escada mt-10 space-y-3.5 border-t border-white/12 pt-9">
          {INCLUI.map((l) => (
            <li key={l} className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#2596be] text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-[0.9375rem] leading-snug tracking-[-0.022em] text-white/82">
                {l}
              </span>
            </li>
          ))}
        </ul>

        {/* O bloco de redução de risco: número grande à esquerda, promessa à
            direita. Aqui o número é zero, que é a coisa mais tranquilizadora
            que a página pode dizer a quem tem medo de cobrança indevida. */}
        <div className="revelar mt-10 flex items-center gap-5 rounded-[22px] border border-white/12 bg-white/[0.05] p-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[18px] bg-[#2596be]/18 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#6dc6e6]">
            0
          </span>
          <div>
            <p className="text-[0.9375rem] font-semibold tracking-[-0.03em] text-white">
              Zero cartão para testar
            </p>
            <p className="mt-1 text-[0.8125rem] leading-snug tracking-[-0.015em] text-white/58">
              Se você não quiser continuar depois dos {ASSINATURA_TRIAL_DIAS}{" "}
              dias, não precisa cancelar nada. Simplesmente não vira assinatura.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- o cartão ------ */}
      <div className="p-4 sm:p-6 lg:py-14 lg:pl-4 lg:pr-14">
        <div className="revelar overflow-hidden rounded-[26px] bg-white p-7 text-center shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] sm:p-9">
          <span className="nv-pill nv-chapeu mx-auto">
            <Sparkles className="h-3.5 w-3.5" />
            {ASSINATURA_NOME}
          </span>

          <p className="mt-7 text-[0.875rem] font-medium tracking-[-0.02em] text-[#5b6d81]">
            Depois do teste, a assinatura fica
          </p>

          {/* O preço em corpo gigante, com centavos e sufixo menores: é o que
              faz o número parecer o que ele é — pequeno. */}
          <p className="mt-1 flex items-start justify-center gap-1 text-[#0f1b2b]">
            <span className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em]">
              R$
            </span>
            <span className="text-[4.5rem] font-semibold leading-none tracking-[-0.055em] sm:text-[5rem]">
              {Math.floor(ASSINATURA_PRECO)}
            </span>
            <span className="mt-3 flex flex-col items-start leading-none">
              <span className="text-[1.5rem] font-semibold tracking-[-0.03em]">
                ,{String(Math.round((ASSINATURA_PRECO % 1) * 100)).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[0.8125rem] font-medium text-[#5b6d81]">
                / mês
              </span>
            </span>
          </p>

          <p className="mt-3 text-[0.8125rem] tracking-[-0.02em] text-[#5b6d81]">
            Dá {porDia} por dia. Menos que o cafezinho que você nem lembra de
            ter tomado.
          </p>

          <div className="my-7 h-px bg-[#eaf0f6]" />

          <ul className="space-y-3 text-left">
            {[
              `${ASSINATURA_TRIAL_DIAS} dias grátis, sem pedir cartão`,
              "Tudo liberado desde o primeiro dia",
              "Cancele quando quiser, sem multa",
              "Sem comissão de banco ou corretora",
            ].map((l) => (
              <li key={l} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#e6f6ec] text-[#1f7a4d]">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-[0.875rem] font-medium tracking-[-0.022em] text-[#0f1b2b]">
                  {l}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <BotaoAssinarPlano
              contexto="workspace"
              tamanho="grande"
              destaque
              direto
              rotulo={`Começar meus ${ASSINATURA_TRIAL_DIAS} dias grátis`}
            />
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.75rem] tracking-[-0.01em] text-[#5b6d81]">
            <Lock className="h-3.5 w-3.5" />
            Você só informa e-mail e senha para começar.
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-[0.75rem] tracking-[-0.01em] text-white/58">
          <ShieldCheck className="h-3.5 w-3.5" />
          {ASSINATURA_PRECO_ROTULO}/mês depois do teste. Sem fidelidade.
        </p>
      </div>
    </div>
  );
}
