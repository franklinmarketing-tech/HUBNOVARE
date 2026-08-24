import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Building2,
  UserCog,
  Database,
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
    "Como a Novare Consultoria de Investimentos coleta, usa, compartilha e protege os dados pessoais tratados no Workspace Novare, em conformidade com a LGPD (Lei nº 13.709/2018).",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Cabecalho
        direita={
          <Link
            href="/hub"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Hub
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
          Última atualização: Agosto de 2026 • Novare Consultoria de Investimentos
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
              <strong>Dados técnicos e de uso.</strong> Para operar e proteger o
              serviço, registramos informações técnicas básicas geradas pelo uso
              (por exemplo, dados de sessão e de segurança). Guardamos também
              preferências e o estado das ferramentas no seu navegador e em nossa
              base (ver seções 8 e 9).
            </p>
          </section>

          {/* (d) Finalidades e bases legais */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scale className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                4. Para que usamos e com qual base legal
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
                processamento por inteligência artificial (ver seção 5) e usar
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
                5. Compartilhamento e transferência internacional
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
                6. Por quanto tempo guardamos
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
          </section>

          {/* (g) Direitos do titular */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                7. Seus direitos como titular
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
              <li>Solicitar a portabilidade dos dados a outro fornecedor.</li>
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
                8. Segurança
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
                9. Cookies e armazenamento no navegador
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
                10. Como exercer seus direitos
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
