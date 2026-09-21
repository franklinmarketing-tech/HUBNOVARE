import { CONTA } from "@/lib/hub-lp";

/**
 * A CONTA QUE FALTA — o exemplo trabalhado, desenhado como uma placa.
 *
 * ┌── POR QUE ESTA SEÇÃO É A MAIS IMPORTANTE DA PÁGINA ───────────────────┐
 * │ O ICP daqui está consciente do PROBLEMA, e para esse estágio o        │
 * │ Richard é literal sobre qual prova converte: "números, antes e        │
 * │ depois, cálculo". Não é selo, não é depoimento, não é adjetivo.       │
 * │                                                                        │
 * │ São quatro números e uma subtração que a pessoa refaz de cabeça:      │
 * │ 2.392 na conta, +600 que ainda entram, −1.926 que já têm dono, 1.066  │
 * │ de sobra. Todos vêm de `CONTA`, em `hub-lp.ts`, e são os mesmos da    │
 * │ conta de demonstração do app.                                          │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌── A FORMA: PLACA E CHIP ──────────────────────────────────────────────┐
 * │ A referência é a seção "Local AI" do Shotbase: uma placa técnica com  │
 * │ grade fina, moldura hachurada de canto cortado, parafusos nos cantos  │
 * │ e, no meio, o chip aceso.                                             │
 * │                                                                        │
 * │ Lá a placa é azul-escura. Aqui ela é CLARA, e isso não é detalhe de   │
 * │ gosto: esta seção vem logo depois do bento de problemas em creme e    │
 * │ logo antes dos módulos. Escurecê-la criaria a terceira faixa preta da │
 * │ página em três seções seguidas, e o contraste pararia de significar   │
 * │ alguma coisa. O brilho do chip faz o trabalho que lá é feito pelo     │
 * │ fundo escuro.                                                          │
 * │                                                                        │
 * │ A metáfora também cai certo: três entradas correndo por trilhas até   │
 * │ um processador que devolve UM número. É literalmente o que o app faz. │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * As trilhas e a grade são `aria-hidden` — ornamento. Os números, não: eles
 * são o argumento, e quem usa leitor de tela recebe a conta inteira na
 * ordem em que ela é lida.
 */

/** Os parafusos dos quatro cantos da moldura hachurada. */
function Parafusos() {
  return (
    <span aria-hidden>
      {[
        "left-2.5 top-2.5",
        "right-2.5 top-2.5",
        "left-2.5 bottom-2.5",
        "right-2.5 bottom-2.5",
      ].map((pos) => (
        <span
          key={pos}
          className={`absolute ${pos} h-1.5 w-1.5 rounded-full bg-[#0a1521]/35`}
        />
      ))}
    </span>
  );
}

export function Conta() {
  return (
    <section className="mt-4 py-20 sm:py-28">
      <div className="nv-caixa">
        {/* ------------------------------------------------- a promessa -- */}
        <div className="text-center">
          <span className="revelar nv-pill nv-pill-ciano nv-chapeu">
            {CONTA.chapeu}
          </span>
          <h2 className="revelar nv-d2 mx-auto mt-7 max-w-[18ch] text-balance">
            {CONTA.titulo}
          </h2>
          <p className="revelar nv-lead mx-auto mt-6 max-w-xl">{CONTA.lead}</p>
        </div>

        {/* ----------------------------------------------------- a placa -- */}
        <div className="revelar relative mt-14 overflow-hidden rounded-[34px] border border-[#e3e0d8] bg-[#fbfaf7]">
          {/* a grade de 60px, como papel de engenharia */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(10,21,33,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(10,21,33,0.055) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* o halo do chip: é ele que faz a peça acender sem escurecer o fundo */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-[14%] top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 translate-x-1/3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(37,150,190,0.22) 0%, rgba(37,150,190,0.09) 42%, transparent 68%)",
            }}
          />

          <div className="relative grid items-center gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_7rem_1fr] lg:gap-0 lg:px-14">
            {/* ═════════════════════════════════════════ as três entradas ══ */}
            <ul className="grid gap-3">
              <li className="rounded-[20px] border border-[#e8e4dc] bg-white/90 px-6 py-5 backdrop-blur-sm">
                <p className="nv-chapeu text-[#5b6d81]">
                  {CONTA.extrato.titulo}
                </p>
                <p className="nv-numero mt-3 text-[2.5rem] leading-none text-[#0a1521]">
                  {CONTA.extrato.valor}
                </p>
                <p className="mt-2 text-[1.1875rem] font-semibold tracking-[-0.015em] text-[#46586e]">
                  {CONTA.extrato.rotulo}
                </p>
                <p className="mt-1 text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#5b6d81]">
                  {CONTA.extrato.nota}
                </p>
              </li>

              {CONTA.linhas.map((l) => (
                <li
                  key={l.rotulo}
                  /* No celular o número vai POR CIMA do texto: lado a lado
                     numa tela de 390px, "contas e faturas que ainda vencem no
                     mês" vira uma coluna de quatro linhas de duas palavras. */
                  className={`flex flex-col gap-1 rounded-[20px] px-6 py-4 sm:flex-row sm:items-baseline sm:gap-4 ${
                    l.tom === "verde"
                      ? "bg-[#e7f4ec] text-[#1f7a4d]"
                      : "bg-[#fdf0e9] text-[#a53a12]"
                  }`}
                >
                  <p className="nv-numero shrink-0 text-[1.75rem] leading-none">
                    {l.sinal} {l.valor}
                  </p>
                  <p className="min-w-0 text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#46586e]">
                    <span className="font-semibold text-[#0a1521]">
                      {l.rotulo}
                    </span>
                    , {l.nota}
                  </p>
                </li>
              ))}
            </ul>

            {/* ═══════════════════════════════════════════════ a trilha ══ */}
            {/*
                Um colchete: a barra vertical abraça as três entradas e uma
                única trilha sai dela para dentro do chip. É a leitura certa
                da conta — três coisas entram, UM número sai.

                A primeira versão desenhava uma trilha por entrada, em
                percentuais fixos da altura. Como os três cartões têm
                alturas diferentes, nenhuma das três encostava no cartão a
                que pertencia, e o conjunto parecia defeito. O colchete se
                estica com a coluna (`self-stretch`) e não tem como
                desalinhar.

                No celular ele some: numa coluna de 390px a ligação é a
                própria ordem de leitura.
            */}
            <div aria-hidden className="relative hidden self-stretch lg:block">
              <span className="absolute bottom-[14%] left-6 top-[14%] w-px bg-[rgba(10,21,33,0.18)]" />
              <span className="absolute left-6 top-1/2 h-[2px] w-[calc(100%-1.5rem)] bg-gradient-to-r from-[rgba(10,21,33,0.18)] to-[#2596be]" />
              <span className="absolute left-6 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2596be]" />
              {/* os dois nós onde o colchete encosta nas pontas */}
              <span className="absolute left-6 top-[14%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(10,21,33,0.28)]" />
              <span className="absolute bottom-[14%] left-6 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-[rgba(10,21,33,0.28)]" />
            </div>

            {/* ══════════════════════════════════════════════════ o chip ══ */}
            {/* `lg:mx-0`: no desktop o chip encosta na borda esquerda da sua
                coluna, que é exatamente onde a trilha termina. Centrado, ele
                deixava um vão entre a linha e a peça, e a ligação sumia. */}
            <div
              className="relative mx-auto w-full max-w-[26rem] p-3 lg:mx-0"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(10,21,33,0.07) 0 2px, transparent 2px 9px)",
                clipPath:
                  "polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)",
              }}
            >
              <Parafusos />

              <div
                className="relative overflow-hidden bg-[#0b1626] px-7 py-8 text-white sm:px-9 sm:py-10"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)",
                }}
              >
                {/* o brilho de dentro do chip */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(90% 70% at 70% 0%, rgba(37,150,190,0.55) 0%, transparent 62%)",
                  }}
                />

                <div className="relative">
                  <p className="nv-chapeu text-[#6dc6e6]">
                    {CONTA.resultado.titulo}
                  </p>
                  <p className="nv-numero mt-4 text-[2.75rem] leading-none sm:text-[4rem]">
                    {CONTA.resultado.valor}
                  </p>
                  <p className="mt-3 text-[1.1875rem] font-semibold tracking-[-0.015em] text-[#6dc6e6]">
                    {CONTA.resultado.rotulo}
                  </p>
                  <p className="mt-5 border-t border-white/12 pt-5 text-[1.1875rem] leading-snug tracking-[-0.012em] text-white/75">
                    {CONTA.resultado.nota}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="revelar mx-auto mt-8 max-w-2xl text-center text-[1.1875rem] leading-relaxed tracking-[-0.008em] text-[#5b6d81]">
          {CONTA.rodape}
        </p>
      </div>
    </section>
  );
}
