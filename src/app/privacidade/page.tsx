import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Building2,
  UserCog,
  Database,
  Eye,
  Scale,
  Share2,
  Timer,
  KeyRound,
  Cookie,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Novare Consultoria de Investimentos coleta, usa, compartilha e protege os dados pessoais tratados no Workspace Novare, incluindo quem da Novare enxerga os dados financeiros do FINCASH, em conformidade com a LGPD (Lei nº 13.709/2018).",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-dvh">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Workspace
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 mb-4">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Conformidade com a LGPD (Lei nº 13.709/2018)
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: Setembro de 2026 • Novare Consultoria de Investimentos
        </p>

        <p className="mt-6 text-sm leading-relaxed text-slate-700">
          Esta Política de Privacidade explica de forma transparente como
          tratamos os dados pessoais de quem usa o Workspace Novare (o &ldquo;Hub&rdquo;)
          e suas ferramentas. Ela descreve o que coletamos, para quê,
          com quem compartilhamos, por quanto tempo guardamos e como você pode
          exercer seus direitos previstos na Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018 — LGPD).
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          {/* (a) Controlador */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                1. Quem é o controlador dos dados
              </h2>
            </div>
            <p className="mt-3">
              O controlador responsável pelas decisões sobre o tratamento dos
              seus dados pessoais é a <strong>Novare Consultoria de
              Investimentos</strong>, que oferece o Workspace Novare e as
              ferramentas nele disponíveis. É a Novare quem define as finalidades
              e os meios do tratamento descrito nesta política.
            </p>
          </section>

          {/* (b) Encarregado / DPO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserCog className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                2. Encarregado (DPO) e canal de contato
              </h2>
            </div>
            <p className="mt-3">
              Para tratar de qualquer assunto relacionado aos seus dados
              pessoais — dúvidas, solicitações ou reclamações — fale com o nosso
              Encarregado pelo Tratamento de Dados (DPO):
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li>
                E-mail:{" "}
                <a
                  href="mailto:contato@novareapp.com.br"
                  className="font-medium text-primary hover:text-accent-strong transition-colors"
                >
                  contato@novareapp.com.br
                </a>
              </li>
              <li>WhatsApp: disponível pelos canais de atendimento oficiais da Novare.</li>
            </ul>
          </section>

          {/* (c) Dados coletados */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                3. Quais dados coletamos
              </h2>
            </div>
            <p className="mt-3">
              <strong>Dados de cadastro do perfil.</strong> Quando você cria ou
              completa seu perfil no Hub, coletamos: nome, e-mail, telefone, data
              de nascimento, cidade, UF, profissão e objetivo financeiro.
            </p>
            <p className="mt-3">
              <strong>Dados que você digita nas ferramentas.</strong> Ao usar os
              simuladores e assistentes, você pode informar dados financeiros e
              documentos — por exemplo, o conteúdo de um extrato bancário na
              assistente <em>Íris</em>, ou textos de holerite, contracheque e
              cálculos de rescisão nas funções de preenchimento automático e
              dicas. Esse conteúdo é tratado para gerar o resultado que você
              pediu.
            </p>
            <p className="mt-3">
              <strong>Dados financeiros do FINCASH.</strong> Se você usa o
              FINCASH, guardamos na sua conta o que você registra ali: contas e
              respectivos saldos, cartões e faturas, cada lançamento com data,
              valor, categoria e a descrição que você escreveu, recorrências,
              orçamento por categoria, metas e aportes, patrimônio e
              investimentos (valor aplicado e instituição) e dívidas (credor,
              tipo, saldo devedor, taxa de juros, parcelas, situação de atraso e
              pagamentos). Se você vincular o assistente de WhatsApp, guardamos
              também o número de telefone vinculado e um registro das mensagens
              trocadas com o assistente, com o texto exatamente como você
              escreveu.
            </p>
            {/* Áudio e foto entraram no assistente depois da primeira versão
                desta política. A frase é específica de propósito: dizer só
                "tratamos sua mídia" deixaria a pessoa imaginar que o arquivo
                fica guardado, que é justamente o que não acontece. */}
            <p className="mt-3">
              <strong>Áudio e foto enviados ao assistente.</strong> Se você
              mandar um áudio dizendo um gasto, ou a foto de um comprovante, o
              arquivo é processado na memória do servidor e descartado em
              seguida. Ele não é gravado em disco, não vira link e não fica
              guardado. O que permanece é apenas o resultado da leitura: a
              transcrição do áudio, ou o valor, a data e o estabelecimento
              lidos do comprovante. Para fazer essa leitura, o conteúdo é
              enviado a um serviço de processamento de linguagem e de imagem
              contratado pela Novare, que o utiliza para executar a tarefa e
              não para treinar modelos.
            </p>
            <p className="mt-3">
              <strong>Dados técnicos e de uso.</strong> Para operar e proteger o
              serviço, registramos informações técnicas básicas geradas pelo uso
              (por exemplo, dados de sessão e de segurança). Guardamos também
              preferências e o estado das ferramentas no seu navegador e em nossa
              base (ver seções 9 e 10).
            </p>
          </section>

          {/*
            Esta seção existe porque a policy de RLS "fincash: equipe le" dá
            leitura dos dados financeiros a admin e equipe. Enquanto o banco
            fizer isso, o texto precisa dizer isso: o FAQ da landing do FINCASH
            já admite a leitura, e uma política que omitisse viraria contradição
            entre duas páginas do mesmo produto.
          */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Eye className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                4. Quem da Novare lê os seus dados financeiros
              </h2>
            </div>
            <p className="mt-3">
              Esta é a parte que a gente prefere dizer com todas as letras:{" "}
              <strong>
                a equipe da Novare consegue ler os dados que você registra no
                FINCASH
              </strong>
              . Não é um efeito colateral, é como o serviço funciona. A revisão
              do seu plano é escrita por uma pessoa, e ela não tem como escrever
              sobre um dinheiro que não enxerga.
            </p>
            <p className="mt-3">
              <strong>Quem acessa.</strong> Somente os usuários com papel{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">admin</code>{" "}
              ou{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">equipe</code>{" "}
              no Workspace, ou seja, a equipe interna da Novare e os consultores.
              Nenhum outro cliente enxerga a sua conta: a regra do banco de dados
              amarra cada linha ao usuário dono.
            </p>
            <p className="mt-3">
              <strong>O que exatamente.</strong> Lançamento a lançamento, com a
              descrição que você digitou; saldo das contas e fatura dos cartões;
              orçamento e categorias; metas, aportes, patrimônio e investimentos,
              com valor aplicado e instituição; e as suas dívidas, com credor,
              saldo devedor, taxa de juros, prazo e situação de atraso.
            </p>
            <p className="mt-3">
              <strong>Para quê.</strong> Para a revisão do consultor e para o
              suporte que você pedir. Não usamos esses dados para vender produto
              financeiro, e a Novare não recebe comissão de banco, corretora ou
              seguradora. Também não vendemos nem cedemos esses dados para
              publicidade.
            </p>
            <p className="mt-3">
              <strong>O que a equipe não faz.</strong> A permissão é de leitura e
              só. Ninguém da Novare cria, altera ou apaga um lançamento, uma
              meta, um investimento ou uma dívida sua: o banco de dados recusa a
              escrita de quem não é o dono do dado. Quem edita a sua vida
              financeira é você.
            </p>
            <p className="mt-3">
              <strong>A exceção do WhatsApp.</strong> As duas tabelas do
              assistente de WhatsApp ficam de fora dessa leitura, de propósito. O
              registro de mensagens guarda o texto cru do que você escreveu, que
              costuma ir muito além de valor e categoria, e o vínculo do telefone
              guarda o código de confirmação. A equipe não lê nenhum dos dois. O
              que o consultor precisa ver é o lançamento que a mensagem gerou, e
              esse está na sua lista de lançamentos como qualquer outro. Só você
              vê o histórico das suas mensagens no app.
            </p>
            <p className="mt-3">
              Se você não quiser essa leitura, o caminho honesto é não manter os
              dados aqui: fale com o nosso Encarregado (seção 11) e apagamos a
              sua base do FINCASH.
            </p>
          </section>

          {/* (d) Finalidades e bases legais */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scale className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                5. Para que usamos e com qual base legal
              </h2>
            </div>
            <p className="mt-3">
              Tratamos seus dados apenas para finalidades específicas, sempre
              amparados em uma base legal do art. 7º da LGPD:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Execução do serviço</strong> (art. 7º, V) — criar sua
                conta, exibir os apps liberados para o seu perfil e processar o
                que você digita nas ferramentas para entregar o resultado
                solicitado.
              </li>
              <li>
                <strong>Legítimo interesse</strong> (art. 7º, IX) — manter a
                segurança, prevenir fraudes, corrigir erros e melhorar a
                experiência do Workspace, sempre respeitando suas expectativas e
                direitos.
              </li>
              <li>
                <strong>Consentimento</strong> (art. 7º, I) — para tratamentos
                que dependem da sua autorização, como enviar seu conteúdo para
                processamento por inteligência artificial (ver seção 6) e usar
                cookies/armazenamento não essenciais. Você pode revogar o
                consentimento a qualquer momento.
              </li>
              <li>
                <strong>Cumprimento de obrigação legal ou regulatória</strong>{" "}
                (art. 7º, II) — quando a lei exigir a guarda ou a apresentação de
                determinados registros.
              </li>
            </ul>
          </section>

          {/* (e) Compartilhamento e transferência internacional */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Share2 className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                6. Compartilhamento e transferência internacional
              </h2>
            </div>
            <p className="mt-3">
              Não vendemos seus dados. Para operar o serviço, contamos com
              fornecedores que atuam como <strong>operadores</strong> (tratam
              dados em nome da Novare, seguindo nossas instruções):
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Supabase</strong> — hospedagem, autenticação e banco de
                dados. É onde ficam armazenados o seu cadastro e o estado das
                ferramentas.
              </li>
              <li>
                <strong>OpenAI</strong> — processamento por inteligência
                artificial nas funções <em>Íris</em> (resumo/análise de extrato)
                e de preenchimento automático e dicas (holerite, rescisão e
                textos que você cola). Quando você usa essas funções, o conteúdo
                enviado é processado nos servidores da OpenAI. Isso caracteriza{" "}
                <strong>
                  transferência internacional de dados para os Estados Unidos
                </strong>
                , amparada no seu consentimento e nas garantias contratuais
                aplicáveis (art. 33 da LGPD). Se você não quiser essa
                transferência, basta não utilizar essas funções de IA.
              </li>
            </ul>
            <p className="mt-3">
              Também podemos compartilhar dados com autoridades públicas quando
              houver obrigação legal ou ordem judicial.
            </p>
          </section>

          {/* (f) Retenção */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Timer className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                7. Por quanto tempo guardamos
              </h2>
            </div>
            <p className="mt-3">
              Mantemos os dados de cadastro enquanto sua conta estiver ativa e
              pelo tempo necessário para cumprir as finalidades desta política.
              O estado das ferramentas é guardado enquanto for útil para você
              retomar o trabalho. Encerrada a finalidade — ou a pedido seu —
              eliminamos ou anonimizamos os dados, salvo quando a lei exigir
              guarda por prazo maior (por exemplo, obrigações fiscais ou de
              defesa em processos).
            </p>
            {/*
              Não existe rotina de expurgo do log de mensagens no código nem no
              SQL: a única faxina automática é a dos códigos de vínculo vencidos
              (`fin_whatsapp_limpar_pendentes`). Enquanto o dono não definir um
              prazo e alguém não implementar o expurgo, prometer prazo aqui
              seria promessa que o sistema não cumpre.
            */}
            <p className="mt-3">
              <strong>Dados do FINCASH e do assistente de WhatsApp.</strong> Os
              seus lançamentos, metas, investimentos e dívidas ficam guardados
              enquanto a sua conta existir, porque é deles que sai o histórico e
              a revisão do consultor. O registro das mensagens trocadas com o
              assistente de WhatsApp, hoje, também fica guardado por tempo
              indeterminado: ainda não temos prazo fixo nem rotina automática de
              descarte, e preferimos dizer isso a prometer uma limpeza que não
              acontece. Códigos de confirmação de vínculo não usados são
              apagados pouco depois de vencerem. Você pode pedir a exclusão da
              sua base financeira ou do histórico de mensagens a qualquer
              momento pelo canal da seção 11.
            </p>
          </section>

          {/* (g) Direitos do titular */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                8. Seus direitos como titular
              </h2>
            </div>
            <p className="mt-3">
              A LGPD garante a você, a qualquer momento e de forma gratuita, o
              direito de:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li>Confirmar a existência de tratamento e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>
                Solicitar anonimização, bloqueio ou eliminação de dados
                desnecessários ou tratados em desconformidade.
              </li>
              <li>
                Solicitar a portabilidade dos dados a outro fornecedor. No
                FINCASH, você mesmo pode levar os seus dados embora: estamos
                entregando a exportação em arquivo CSV de tudo que você
                registrou, lançamentos, orçamento, metas, patrimônio e dívidas,
                em formato que abre no Excel, no Google Planilhas ou em outro
                aplicativo financeiro. Enquanto o botão não estiver disponível na
                sua tela, peça a exportação pelo canal da seção 11 e nós
                geramos.
              </li>
              <li>
                Obter informação sobre com quem compartilhamos seus dados.
              </li>
              <li>
                Revogar o consentimento e se opor a tratamentos baseados em
                legítimo interesse.
              </li>
            </ul>
          </section>

          {/* (h) Segurança */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                9. Segurança
              </h2>
            </div>
            <p className="mt-3">
              Adotamos medidas técnicas e organizacionais para proteger seus
              dados, como conexões cifradas (HTTPS/TLS) em trânsito, controles de
              autenticação e acesso restrito por perfil de usuário. Nossos
              fornecedores de hospedagem e de IA também mantêm seus próprios
              controles de segurança. Nenhum sistema é 100% imune, mas
              trabalhamos continuamente para reduzir riscos; caso ocorra um
              incidente relevante, seguiremos os deveres de comunicação previstos
              na LGPD.
            </p>
          </section>

          {/* (i) Cookies e armazenamento local */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cookie className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                10. Cookies e armazenamento no navegador
              </h2>
            </div>
            <p className="mt-3">
              Usamos cookies e tecnologias de armazenamento local
              (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code>)
              para manter você autenticado, lembrar preferências e guardar o
              estado das ferramentas — por exemplo, o que você já preencheu em um
              simulador. Alguns desses recursos são essenciais para o serviço
              funcionar; outros dependem do seu consentimento. Você pode limpar
              esses dados a qualquer momento nas configurações do seu navegador,
              lembrando que isso pode apagar o progresso salvo localmente.
            </p>
          </section>

          {/* (j) Como exercer direitos */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                11. Como exercer seus direitos
              </h2>
            </div>
            <p className="mt-3">
              Para exercer qualquer um dos direitos acima, entre em contato com o
              nosso Encarregado pelo e-mail{" "}
              <a
                href="mailto:contato@novareapp.com.br"
                className="font-medium text-primary hover:text-accent-strong transition-colors"
              >
                contato@novareapp.com.br
              </a>{" "}
              ou pelo WhatsApp de atendimento oficial da Novare. Podemos precisar
              confirmar sua identidade antes de atender ao pedido, para proteger
              seus próprios dados. Responderemos dentro dos prazos previstos na
              LGPD. Esta política pode ser atualizada; quando isso acontecer,
              revisaremos a data de &ldquo;última atualização&rdquo; no topo desta página.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Novare Consultoria de Investimentos • Encarregado (DPO):{" "}
          <a
            href="mailto:contato@novareapp.com.br"
            className="font-medium text-primary hover:text-accent-strong transition-colors"
          >
            contato@novareapp.com.br
          </a>
        </div>
      </main>
    </div>
  );
}
