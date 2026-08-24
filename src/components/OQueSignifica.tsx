import { ChevronDown } from "lucide-react";

/**
 * "O que isso significa?" — o bloco educativo que vem depois do resultado.
 *
 * É a assinatura das calculadoras do Nord Liberta, e existe por um motivo
 * prático: um número sozinho não convence ninguém. Quem entende de onde a
 * conta saiu confia no resultado, fica mais tempo na página e chega na
 * conversa com o consultor já sabendo do que se trata.
 *
 * Usa `<details>` nativo: abre e fecha sem JavaScript nenhum, funciona com
 * teclado e leitor de tela de graça, e não custa um byte de bundle.
 */
export function OQueSignifica({
  titulo = "O que isso significa?",
  itens,
}: {
  titulo?: string;
  itens: { pergunta: string; resposta: React.ReactNode }[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
      <h2 className="font-display text-lg font-bold text-primary">{titulo}</h2>

      <div className="mt-4 divide-y divide-slate-100">
        {itens.map((item) => (
          <details key={item.pergunta} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800 transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
              {item.pergunta}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="pt-2.5 text-sm leading-relaxed text-muted-foreground">
              {item.resposta}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
