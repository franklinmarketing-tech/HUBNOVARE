import { Bloco } from "../pecas";

/**
 * O que o assistente entende — e o que ele NÃO entende.
 *
 * ESTA LISTA NÃO É TEXTO DE MARKETING. Cada frase daqui foi tirada de
 * `src/lib/fincash/whatsapp.ts`, do regex que a reconhece. Prometer uma
 * frase que o interpretador não interpreta é o jeito mais rápido de queimar o
 * assistente: a pessoa manda “parcelei 300 em 3x”, recebe “não entendi”, e não
 * tenta uma terceira vez.
 *
 * Por isso a segunda caixa existe e é tão grande quanto a primeira. Um app de
 * dinheiro que esconde o próprio limite está pedindo para ser descoberto no
 * pior momento — o mês em que a conta não fecha.
 *
 * ⚠️ MEXEU NO INTERPRETADOR, MEXA AQUI. As duas listas andam juntas.
 */

type Exemplo = { frase: string; efeito: string };

const ENTENDE: Exemplo[] = [
  { frase: "Uber 35", efeito: "Gasto de R$ 35 hoje, na categoria de transporte." },
  { frase: "mercado R$ 280 ontem", efeito: "Gasto lançado com a data de ontem." },
  {
    frase: "farmácia 47,90 no NOME_DA_CONTA",
    efeito: "Sai da conta que você nomear — vale para cartão também.",
  },
  { frase: "recebi 5000 de salário", efeito: "Entrada, não gasto. “recebi”, “caiu”, “vendi” e “estorno” também viram entrada." },
  { frase: "quanto gastei com alimentação esse mês?", efeito: "O total da categoria no mês, com o orçamento se você tiver um." },
  { frase: "quanto gastei mês passado?", efeito: "O mesmo, um mês atrás." },
  { frase: "saldo", efeito: "O saldo de cada conta e o total." },
  { frase: "resumo", efeito: "Entrou, saiu, o que sobrou e o que ainda falta pagar no mês." },
  { frase: "desfazer", efeito: "Apaga o último lançamento que ele criou. Só o dele." },
  { frase: "ajuda", efeito: "O menu do assistente, dentro da conversa." },
  {
    frase: "🎤 um áudio",
    efeito:
      "Fale “mercado 280” e ele registra. A resposta mostra o que ele ouviu — quem for transcrito errado corrige na hora, com “desfazer”.",
  },
  {
    frase: "📷 foto do comprovante",
    efeito:
      "Ele lê valor, estabelecimento e data e PERGUNTA antes de gravar. Você responde “sim”. Nota fiscal tem subtotal, desconto e troco na mesma folha — aqui ele nunca grava calado.",
  },
];

const NAO_ENTENDE: Exemplo[] = [
  {
    frase: "mil e duzentos",
    efeito:
      "Número por extenso ele devolve como pergunta, de propósito: chutar entre 1.200 e 1.000 num app de dinheiro é grave demais. (“mil” sozinho vale, esse não tem dois sentidos.)",
  },
  {
    frase: "300 em 3x",
    efeito:
      "Parcelamento se faz na tela de lançamentos, onde dá para conferir as três parcelas antes de gravar.",
  },
  {
    frase: "na terça retrasada",
    efeito:
      "De data ele só entende hoje, ontem, anteontem, “dia 12” e “12/03”. Adivinhar data joga o gasto no mês errado.",
  },
  {
    frase: "vídeo, PDF, planilha",
    efeito:
      "Só áudio e foto. Fatura em PDF ou extrato tem caminho melhor dentro do app: o importador de OFX, que confere tudo antes de gravar.",
  },
  {
    frase: "áudio e foto sem limite",
    efeito:
      "São 60 por mês, somados. Transcrever e ler imagem custam por mensagem — o teto é o que mantém a assinatura de pé. Texto continua ilimitado.",
  },
];

export function Guia({ exemploConta }: { exemploConta?: string | null }) {
  /* O nome da conta DELA no exemplo, e não “Nubank”: o interpretador só casa a
     origem por nome cadastrado, então um exemplo genérico ensinaria a escrever
     uma frase que não funcionaria na conta dela. */
  const conta = exemploConta?.trim() || "nubank";

  return (
    <section className="mt-6">
      <h2 className="font-display text-base font-semibold text-primary">
        O que dá para fazer por lá
      </h2>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
        Basta escrever, do jeito que você escreveria para uma pessoa. Ele responde
        confirmando o que entendeu — e como desfazer.
      </p>

      <Bloco className="mt-3 p-5">
        <dl className="space-y-3">
          {ENTENDE.map((e) => (
            <div key={e.frase} className="sm:flex sm:gap-4">
              <dt className="sm:w-56 sm:shrink-0">
                <span className="inline-block rounded-xl bg-ciano-tint px-2.5 py-1 text-2xs font-semibold text-ciano-forte">
                  {e.frase.replace("NOME_DA_CONTA", conta)}
                </span>
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-1.5">
                {e.efeito}
              </dd>
            </div>
          ))}
        </dl>
      </Bloco>

      <Bloco className="mt-3 border-dashed bg-white/60 p-5">
        <h3 className="font-display text-sm font-semibold text-primary">
          O que ele ainda não faz
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Nestes casos ele pergunta em vez de gravar. É a regra da casa: registro
          errado custa mais caro do que uma mensagem a mais.
        </p>
        <dl className="mt-3 space-y-3">
          {NAO_ENTENDE.map((e) => (
            <div key={e.frase} className="sm:flex sm:gap-4">
              <dt className="sm:w-56 sm:shrink-0">
                <span className="inline-block rounded-xl bg-muted px-2.5 py-1 text-2xs font-semibold text-muted-foreground line-through decoration-1">
                  {e.frase}
                </span>
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-1.5">
                {e.efeito}
              </dd>
            </div>
          ))}
        </dl>
      </Bloco>
    </section>
  );
}

/**
 * O que fica guardado.
 *
 * Aparece na tela, e não só na política de privacidade, porque é aqui que a
 * pessoa entrega um dado que ela não entregou em nenhuma outra tela do app: o
 * telefone dela, e o texto cru de tudo que ela escrever. Contar isso no momento
 * da decisão é a diferença entre consentimento e letra miúda.
 */
export function Privacidade() {
  return (
    <section className="mt-6">
      <h2 className="font-display text-base font-semibold text-primary">
        O que fica guardado
      </h2>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <li className="flex gap-2">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ciano" />
          <span>
            <strong className="font-semibold text-foreground">O seu número</strong>, para
            saber que a mensagem é sua. Nesta tela ele nunca aparece inteiro — só os
            quatro últimos dígitos, o suficiente para você conferir qual aparelho está
            ligado.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ciano" />
          <span>
            <strong className="font-semibold text-foreground">
              O texto das mensagens
            </strong>
            , como você escreveu, junto do que o assistente entendeu. É o que permite
            descobrir por que ele errou um lançamento meses depois, sem pedir para você
            repetir a mensagem.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ciano" />
          <span>
            <strong className="font-semibold text-foreground">
              O áudio e a foto, não.
            </strong>{" "}
            O arquivo é processado na memória do servidor e descartado — nunca é
            gravado em disco nem vira link. Fica só o que foi lido dele: a transcrição
            do áudio, ou o valor e o estabelecimento do comprovante.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ciano" />
          <span>
            Desligar o assistente apaga o vínculo do número na hora. O histórico de
            mensagens continua ligado à sua conta — e os lançamentos que ele criou
            continuam sendo seus, como qualquer outro.
          </span>
        </li>
      </ul>
    </section>
  );
}
