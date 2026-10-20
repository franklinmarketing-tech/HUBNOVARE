"use client";

import { CircleCheck, CircleDashed } from "lucide-react";

import { pct } from "@/lib/calculos";
import {
  AnaliseVazia,
  BarraAlvo,
  CascaAnalise,
  CartaoGrafico,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "./kit";

/**
 * A ANÁLISE DO INVENTÁRIO DIGITAL, como um consultor leria a lista.
 *
 * Aqui não há valores em R$: a lista é de contas e acessos. A leitura é de
 * COMPLETUDE (a família saberia o que fazer?) e PROTEÇÃO (a conta tem
 * verificação em duas etapas?). Usa as contagens que a página já faz.
 *
 * O "básico" (e-mail, banco, investimentos) é o mesmo que a própria página
 * pede no texto de boas-vindas. A busca é por palavras no nome do serviço,
 * então o texto avisa que pode não reconhecer um nome diferente.
 */

type Conta = { servico: string; email: string; doisFatores: boolean; temInstrucao: boolean };

// Palavras que indicam cada tipo de conta. Só reconhecimento, não sugestão.
const BASICO: { chave: string; rotulo: string; por: string; re: RegExp }[] = [
  { chave: "email", rotulo: "E-mail principal", por: "é por ele que se recupera o acesso a quase todo o resto",
    re: /e-?mail|gmail|outlook|hotmail|yahoo|icloud|proton/i },
  { chave: "banco", rotulo: "Banco", por: "é onde caem salário, contas e débitos automáticos",
    re: /banco|bank|conta corrente|nubank|ita[uú]|bradesco|santander|caixa|inter\b|c6|sicoob|sicredi|btg/i },
  { chave: "investimentos", rotulo: "Corretora ou investimentos", por: "saldo investido não aparece em certidão nenhuma",
    re: /corretora|invest|xp\b|rico\b|clear\b|tesouro|previd[eê]ncia|cripto|binance/i },
];

const lista = (nomes: string[]) =>
  nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

export function AnaliseInventario({
  contas,
  comDoisFatores,
  pctDoisFatores,
  semInstrucoes,
}: {
  contas: Conta[];
  comDoisFatores: number;
  pctDoisFatores: number;
  semInstrucoes: number;
}) {
  const n = contas.length;
  if (n === 0) {
    return <AnaliseVazia texto="Mapeie pelo menos uma conta (comece pelo e-mail principal) para ver o diagnóstico: o que está protegido, o que a família já saberia fazer e o que falta." />;
  }

  const comInstrucao = n - semInstrucoes;
  const pctInstrucao = (comInstrucao / n) * 100;
  const comLogin = contas.filter((c) => c.email.trim()).length;
  const pctLogin = (comLogin / n) * 100;
  // "Pronta" = a família acharia, entraria com segurança e saberia o que fazer.
  const prontas = contas.filter((c) => c.doisFatores && c.temInstrucao && c.email.trim()).length;
  const basico = BASICO.map((b) => ({ ...b, tem: contas.some((c) => b.re.test(c.servico)) }));
  const faltaBasico = basico.filter((b) => !b.tem);
  const nomes = (filtro: (c: Conta) => boolean) => contas.filter(filtro).map((c) => c.servico).slice(0, 3);

  /* ── O veredito ────────────────────────────────────────────────────── */
  const veredito =
    comInstrucao === 0
      ? { tom: "ruim" as const, titulo: "A família ainda não saberia o que fazer com nenhuma conta",
          texto: `${n === 1 ? "A conta está na lista, mas não tem" : `As ${n} contas estão na lista, mas nenhuma tem`} instrução. Saber que a conta existe é metade; a outra metade é saber o que fazer com ela.` }
      : pctDoisFatores < 50
        ? { tom: "ruim" as const, titulo: "A maioria das contas está pouco protegida",
            texto: `Só ${pct(pctDoisFatores, 0)} têm verificação em duas etapas. Sem ela, quem descobre uma senha entra direto.` }
        : semInstrucoes > 0 || comDoisFatores < n
          ? { tom: "atencao" as const, titulo: "Inventário no caminho, mas incompleto",
              texto: `${prontas} de ${n} contas estão prontas de ponta a ponta: login anotado, duas etapas ligadas e instrução para a família.` }
          : faltaBasico.length > 0
            ? { tom: "atencao" as const, titulo: "Bem protegido, mas pode faltar o básico",
                texto: `Não reconhecemos na lista: ${lista(faltaBasico.map((b) => b.rotulo.toLowerCase()))}. Se já estão lá com outro nome, ignore este aviso.` }
            : { tom: "bom" as const, titulo: "Inventário completo e protegido",
                texto: "Todas as contas têm duas etapas e instrução para a família. Agora é manter a lista atualizada quando abrir ou fechar uma conta." };

  /* ── Recomendações, na ordem ───────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (comDoisFatores < n) {
    const sem = nomes((c) => !c.doisFatores);
    recs.push({ titulo: `Ligar a verificação em duas etapas em ${n - comDoisFatores} ${n - comDoisFatores === 1 ? "conta" : "contas"}`,
      texto: `Comece por ${lista(sem)}. É a proteção que mais barra invasão: além da senha, pede um código no celular.` });
  }
  if (semInstrucoes > 0) {
    const sem = nomes((c) => !c.temInstrucao);
    recs.push({ titulo: `Escrever a instrução de ${semInstrucoes} ${semInstrucoes === 1 ? "conta" : "contas"}`,
      texto: `Falta em ${lista(sem)}. Uma frase basta: quem procurar, onde está o acesso e o que fazer com o saldo.` });
  }
  if (faltaBasico.length > 0) {
    const b = faltaBasico[0];
    recs.push({ titulo: `Mapear: ${b.rotulo.toLowerCase()}`,
      texto: `Não achamos na lista algo com cara de ${b.rotulo.toLowerCase()} — ${b.por}. Se já está lá com outro nome, pule este passo.` });
  }
  recs.push({ titulo: "Somar o que essas contas guardam",
    texto: "Com as contas mapeadas, o passo seguinte é saber quanto há em cada uma e quanto é dívida.",
    href: "/ferramentas/patrimonio", link: "Montar o patrimônio" });
  recs.push({ titulo: "Conferir a proteção da família além das contas",
    texto: "Seguros e apólices também entram no que a família precisa saber que existe.",
    href: "/ferramentas/seguros", link: "Organizar os seguros" });

  return (
    <CascaAnalise aviso="Análise automática a partir do que você registrou. Nunca guarde senhas aqui — só onde cada conta está e como a família chega até ela.">
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Com duas etapas" valor={pct(pctDoisFatores, 0)}
          nota={`${comDoisFatores} de ${n} contas`} ruim={pctDoisFatores < 50} />
        <Indicador rotulo="Com instrução para a família" valor={pct(pctInstrucao, 0)}
          nota={`${comInstrucao} de ${n} contas`} ruim={comInstrucao === 0} />
        <Indicador rotulo="Prontas de ponta a ponta" valor={`${prontas} de ${n}`}
          nota="login, duas etapas e instrução" ruim={prontas === 0} />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Quanto do inventário está completo"
          legenda="Cada barra é um item que toda conta deveria ter. O traço é o alvo: 100% das contas.">
          <div className="space-y-5">
            <BarraAlvo rotulo="Login ou e-mail anotado" valor={pctLogin} alvo={100} maximo={100}
              formato={(v) => pct(v, 0)} bomAcima cor={CORES_ANALISE.navy} />
            <BarraAlvo rotulo="Instrução para a família" valor={pctInstrucao} alvo={100} maximo={100}
              formato={(v) => pct(v, 0)} bomAcima cor={CORES_ANALISE.navy} />
            <BarraAlvo rotulo="Verificação em duas etapas" valor={pctDoisFatores} alvo={100} maximo={100}
              formato={(v) => pct(v, 0)} bomAcima cor={CORES_ANALISE.verde} />
          </div>
        </CartaoGrafico>

        <CartaoGrafico titulo="O básico que a família procura primeiro"
          legenda="Reconhecido pelo nome do serviço. Se usou outro nome, pode aparecer como faltando.">
          <ul className="space-y-3">
            {basico.map((b) => (
              <li key={b.chave} className="flex items-start gap-3">
                {b.tem
                  ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  : <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${b.tem ? "text-slate-900" : "text-slate-500"}`}>{b.rotulo}</p>
                  <p className="text-2xs text-slate-500">{b.tem ? "Está na lista." : `Não encontrado: ${b.por}.`}</p>
                </div>
              </li>
            ))}
          </ul>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={<><b className="text-primary">{prontas} de {n}</b> contas já estão prontas para a família. A meta é todas.</>} />
    </CascaAnalise>
  );
}
