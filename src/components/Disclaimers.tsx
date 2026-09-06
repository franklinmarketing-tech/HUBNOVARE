import { ShieldCheck } from "lucide-react";

/**
 * Os dois avisos legais da casa.
 *
 * Existiam como UM texto só, repetido no rodapé de toda página — inclusive
 * nas que vendem serviço. E os dois contextos não têm o mesmo risco: uma
 * calculadora devolve estimativa a partir do que a pessoa digitou; uma
 * consultoria é serviço prestado por gente, com contrato e responsabilidade
 * própria. Um aviso que serve para os dois acaba não servindo direito para
 * nenhum.
 *
 * ATENÇÃO — OS TEXTOS ABAIXO SÃO PROVISÓRIOS. A estrutura está pronta e
 * aplicada; falta só substituir o conteúdo dos `<span>` pelo texto jurídico
 * definitivo, que o Franklin vai fornecer. Trocar aqui muda em todas as
 * páginas de uma vez.
 */

/** Casca comum: mesma tipografia e mesmo ícone nos dois avisos. */
function Aviso({
  children,
  tom = "claro",
}: {
  children: React.ReactNode;
  /** `escuro` para rodapé navy; `claro` para dentro de página branca. */
  tom?: "claro" | "escuro";
}) {
  const cor = tom === "escuro" ? "text-white/60" : "text-slate-400";
  return (
    <p className={`flex items-start gap-2 text-[11px] leading-relaxed ${cor}`}>
      <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Para `/ferramentas/*` e qualquer calculadora.
 *
 * O ponto que este aviso precisa cobrir: o número sai do que a pessoa
 * digitou, é estimativa, e não substitui o cálculo oficial do banco, da
 * empresa ou do órgão competente.
 */
export function DisclaimerFerramenta({
  tom = "claro",
}: {
  tom?: "claro" | "escuro";
}) {
  return (
    <Aviso tom={tom}>
      {/* TEXTO PROVISÓRIO — substituir pelo definitivo. */}
      Resultado estimado a partir dos dados que você informou, para fins
      educacionais. Não substitui o cálculo oficial da instituição
      responsável nem constitui recomendação de investimento.
      <br className="hidden sm:block" /> Confira sempre com a fonte oficial
      antes de decidir.
    </Aviso>
  );
}

/**
 * Para `/consultoria/*`, `/planejamento` e `/assinar`.
 *
 * O ponto que este aviso precisa cobrir: é serviço com profissional do
 * outro lado, e o que se contrata é o acompanhamento — não a promessa de
 * um resultado financeiro.
 */
export function DisclaimerServico({
  tom = "claro",
}: {
  tom?: "claro" | "escuro";
}) {
  return (
    <Aviso tom={tom}>
      {/* TEXTO PROVISÓRIO — substituir pelo definitivo. */}
      Serviço de consultoria prestado por profissionais da Novare. Não
      constitui oferta, promessa de rentabilidade ou garantia de resultado.
      <br className="hidden sm:block" /> Rentabilidade passada não garante
      resultados futuros.
    </Aviso>
  );
}
