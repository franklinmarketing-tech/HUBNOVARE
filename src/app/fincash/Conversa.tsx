import { Check, Mic, Paperclip, Plus, Smile } from "lucide-react";
import estilos from "./conversa.module.css";

/**
 * A conversa do assistente, acontecendo dentro de um telefone.
 *
 * ⚠️ ISTO NÃO É UM VÍDEO, E A DIFERENÇA É DE HONESTIDADE, NÃO DE TÉCNICA.
 * A linha oficial do WhatsApp ainda não está ligada: não existe uso real para
 * filmar. Encenar um vídeo e apresentá-lo como o produto funcionando seria
 * prometer o que a página inteira se recusa a prometer. Aqui a conversa é
 * declaradamente uma demonstração, e a ressalva vive na mesma tela.
 *
 * ⚠️ TODA FRASE DO LADO DE CÁ É UMA QUE O INTERPRETADOR JÁ RECONHECE.
 * "Uber 35" e a consulta por categoria estão na lista de capacidades da seção.
 * A última troca é a REGRA DA CASA em ação: número por extenso ele devolve
 * como pergunta em vez de gravar, porque chutar entre 1.200 e 1.000 é o erro
 * que ninguém revisa depois. Ela fecha a conversa de propósito. É o momento em
 * que o assistente se recusa a fazer algo, e é o que separa este de um robô
 * que grava qualquer coisa para parecer esperto.
 *
 * ⚠️ OS NÚMEROS SÃO OS DA CONTA DE DEMONSTRAÇÃO, os mesmos das capturas desta
 * página: Mercado fechou setembro em R$ 862, que são 13% de tudo o que saiu.
 * Quem for editar confere no bloco de categorias da seção do produto, senão a
 * conversa passa a contradizer a tela logo acima dela.
 *
 * SEM `"use client"`: a peça inteira é CSS. Nenhum byte de JavaScript sai
 * daqui para o navegador, e a animação roda na timeline de rolagem do próprio
 * navegador (ver `conversa.module.css`).
 */

type Fala = {
  de: "pessoa" | "app";
  texto: React.ReactNode;
  hora: string;
};

const FALAS: Fala[] = [
  { de: "pessoa", texto: "Uber 35", hora: "09:12" },
  {
    de: "app",
    texto: (
      <>
        Anotado: <strong className="font-semibold">Transporte</strong>, R$ 35,00,
        hoje.
      </>
    ),
    hora: "09:12",
  },
  {
    de: "pessoa",
    texto: "quanto gastei com mercado esse mês?",
    hora: "12:40",
  },
  {
    de: "app",
    texto: (
      <>
        <strong className="font-semibold">R$ 862</strong> em Mercado até agora em
        setembro. É 13% de tudo o que saiu no mês.
      </>
    ),
    hora: "12:40",
  },
  { de: "pessoa", texto: "mil e duzentos", hora: "19:03" },
  {
    de: "app",
    texto: (
      <>
        Você quis dizer <strong className="font-semibold">R$ 1.200,00</strong>?
        Valor por extenso eu confirmo antes de gravar.
      </>
    ),
    hora: "19:03",
  },
];

export default function Conversa() {
  return (
    <div className="relative rounded-[2rem] bg-primary/90 p-2 shadow-[0_24px_60px_-24px_hsl(215_50%_12%_/_0.55)] ring-1 ring-white/10">
      <div className="overflow-hidden rounded-[1.6rem] bg-[#ece5dd]">
        {/* A barra de cima diz o nome e nada mais. Um "online" ali seria a
            forma mais barata de sugerir que o assistente responde hoje. */}
        <div className="flex items-center gap-3 bg-primary px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-2xs font-bold text-white">
            FC
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">FINCASH</p>
            <p className="truncate text-2xs text-white/60">
              assistente financeiro
            </p>
          </div>
        </div>

        <div className="space-y-2.5 px-3.5 py-5">
          {FALAS.map((f, i) => {
            const daPessoa = f.de === "pessoa";
            return (
              <div
                key={i}
                className={`${estilos.balao} ${estilos[`b${i + 1}`] ?? ""} flex ${
                  daPessoa ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[0.8125rem] leading-snug shadow-sm ${
                    daPessoa
                      ? "rounded-br-md bg-[#d9fdd3] text-[#111b21]"
                      : "rounded-bl-md bg-white text-[#111b21]"
                  }`}
                >
                  <p>{f.texto}</p>
                  <p className="mt-1 flex items-center justify-end gap-1 text-[0.625rem] text-[#667781]">
                    {f.hora}
                    {daPessoa && (
                      <Check className="h-3 w-3 text-[#53bdeb]" aria-hidden />
                    )}
                  </p>
                </div>
              </div>
            );
          })}

          {/* O "digitando" fica no fim e não some: a conversa termina com o
              assistente esperando a confirmação do valor, que é exatamente o
              estado em que a regra da casa deixa a pessoa. */}
          <div className={`${estilos.digitando} flex justify-start`}>
            <div
              className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm"
              aria-label="O assistente está digitando"
            >
              <span
                className={`${estilos.ponto} h-1.5 w-1.5 rounded-full bg-[#667781]`}
              />
              <span
                className={`${estilos.ponto} h-1.5 w-1.5 rounded-full bg-[#667781]`}
              />
              <span
                className={`${estilos.ponto} h-1.5 w-1.5 rounded-full bg-[#667781]`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2.5">
          <Plus className="h-4 w-4 shrink-0 text-[#54656f]" aria-hidden />
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2">
            <Smile className="h-4 w-4 shrink-0 text-[#54656f]" aria-hidden />
            <span className="text-xs text-[#8696a0]">Mensagem</span>
            <Paperclip
              className="ml-auto h-4 w-4 shrink-0 text-[#54656f]"
              aria-hidden
            />
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a884]">
            <Mic className="h-4 w-4 text-white" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
