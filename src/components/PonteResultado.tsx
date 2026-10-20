import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * A ponte entre o número que a calculadora acabou de dar e o próximo passo.
 *
 * O que existia no lugar: TODA ferramenta terminava no mesmo convite de
 * WhatsApp para a consultoria de investimentos. Quem acabou de calcular a
 * própria rescisão — ou seja, quem acabou de ser demitido — recebia uma
 * oferta de consultoria de investimentos. A oferta certa não depende da
 * casa, depende do que a pessoa acabou de descobrir.
 *
 * Por isso o texto é parametrizado por ferramenta e o VALOR entra na frase:
 * "Você tem R$ 8.400 a receber" prende de um jeito que "fale com um
 * especialista" não prende.
 *
 * DESTINO: sempre o diagnóstico gratuito, nunca o checkout. Quem está
 * olhando o próprio número pela primeira vez não está pronto para comprar,
 * está pronto para entender — e o diagnóstico é de graça, então a ponte não
 * cobra nada de quem atravessa.
 */
export function PonteResultado({
  /** A pergunta que o número abre. Sem ponto final: o `?` já fecha. */
  pergunta,
  /** O que a pessoa acabou de descobrir, já formatado ("R$ 8.400"). */
  valor,
  /** O rótulo do valor: "a receber", "por mês", "até o resgate". */
  rotulo,
  /** Texto do botão. O padrão serve para quase toda ferramenta. */
  acao = "Fazer meu diagnóstico gratuito",
  /** Só mude para outra rota interna se a ferramenta pedir. */
  /* ⚠️ ERA "/consultoria/diagnostico", uma rota que NÃO EXISTE (404), e era
     o padrão de todas as ferramentas que usam esta ponte — achado na
     varredura de 20/10/2026. O Exame é o diagnóstico gratuito que existe de
     verdade, e a pessoa faz sozinha. */
  href = "/exame-saude-financeira",
}: {
  pergunta: string;
  valor?: string;
  rotulo?: string;
  acao?: string;
  href?: string;
}) {
  return (
    <section className="mx-auto mt-6 max-w-3xl px-4 print:hidden">
      {/* Noite com as ondas, como as seções escuras da Carteira Pontual. */}
      <div className="secao-noite rounded-[1.75rem] p-6 sm:p-9">
        {/* O número primeiro, grande: é o que a pessoa veio buscar e o que
            dá peso à pergunta logo abaixo. Sem valor (ferramenta que não
            devolve um número único), a pergunta assume o lugar. */}
        {valor && (
          <p className="font-display text-3xl font-medium tracking-[-0.04em] tabular-nums sm:text-[2.75rem]">
            {valor}
            {rotulo && (
              <span className="ml-2 align-middle text-sm font-semibold text-white/70">
                {rotulo}
              </span>
            )}
          </p>
        )}

        <p
          className={`max-w-xl font-display text-xl font-medium leading-snug tracking-[-0.03em] ${valor ? "mt-2" : ""}`}
        >
          {pergunta}
        </p>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
          Faça o Exame de Saúde Financeira e receba a sua nota de 0 a 100. Se
          quiser, um consultor da Novare olha os números com você — é
          opcional, sem custo e sem comissão.
        </p>

        <Link
          href={href}
          className="btn-cp mt-6"
        >
          {acao}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
