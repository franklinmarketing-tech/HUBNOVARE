import { Camera, Mic, Type } from "lucide-react";

import { Cartao } from "../pecas";

/**
 * O que mandar para o assistente. Curto e honesto: só o que ele entende hoje.
 * A lista completa ele mesmo manda, quando a pessoa escreve "ajuda".
 */
const TEXTO = [
  { frase: "Uber 35", efeito: "Gasto de R$ 35 hoje, em Transporte." },
  { frase: "mercado 280 ontem", efeito: "Gasto com a data de ontem." },
  { frase: "recebi 5000 de salário", efeito: "Entrada, não gasto." },
  { frase: "resumo", efeito: "Entrou, saiu e o que sobrou no mês." },
  { frase: "desfazer", efeito: "Apaga o último lançamento que ele criou." },
];

export function Exemplos() {
  return (
    <section aria-labelledby="titulo-exemplos" className="space-y-3">
      <h2 id="titulo-exemplos" className="font-display text-base font-semibold text-white">
        O que mandar
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Cartao className="p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Type className="h-4 w-4 text-ouro" /> Texto
          </p>
          <ul className="mt-2 space-y-2">
            {TEXTO.map((e) => (
              <li key={e.frase} className="text-xs leading-relaxed">
                <span className="inline-block rounded-lg bg-[hsl(152_55%_41%/0.15)] px-2 py-0.5 font-semibold text-[var(--ncash-verde)]">
                  {e.frase}
                </span>
                <span className="mt-0.5 block text-white/65">{e.efeito}</span>
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao className="p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mic className="h-4 w-4 text-ouro" /> Áudio
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            Fale &ldquo;mercado 280&rdquo; e ele registra. A resposta mostra o que ele entendeu;
            se ouviu errado, mande &ldquo;desfazer&rdquo;.
          </p>
        </Cartao>
        <Cartao className="p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Camera className="h-4 w-4 text-ouro" /> Foto da nota
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            Ele lê valor, estabelecimento e data e PERGUNTA antes de gravar. Você responde &ldquo;sim&rdquo;. Áudio e foto
            têm um teto mensal; texto é à vontade.
          </p>
        </Cartao>
      </div>
      <p className="text-2xs text-white/55">
        Tudo o que ele registra entra no seu Extrato com o selo WhatsApp, e você pode corrigir lá.
      </p>
    </section>
  );
}
