import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, LogIn, MessageCircle, UserPlus } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { NOVARECASH_NOME } from "@/lib/novarecash/config";
import { CONTATO, falarNoWhatsApp } from "@/lib/contato";
import { sair } from "@/lib/acoes-sessao";

export const metadata = {
  title: `Bem-vindo ao ${NOVARECASH_NOME}`,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * /novarecash/bem-vindo — DEPOIS DA COMPRA (06/11/2026).
 *
 * É o link de ENTREGA cadastrado na Kiwify e o botão do e-mail "NovareCash
 * liberado". Serve a quem acabou de pagar, tenha conta ou não: a chave do
 * acesso é o E-MAIL DA COMPRA, e o erro mais comum é entrar com outro.
 *
 * Já logado e com acesso → o botão é "Abrir o NovareCash". Logado SEM acesso
 * → avisa que o e-mail da conta não é o da compra (ou que a liberação ainda
 * não chegou). Sem login → criar conta / entrar / esqueci a senha.
 */
const APP = "/novarecash/app";
const proximo = encodeURIComponent(APP);

export default async function BemVindoNovareCash() {
  const perfil = await getPerfil();
  const temAcesso = perfil ? await temAcessoNovareCash() : false;
  const ajuda = falarNoWhatsApp(`Olá! Comprei o ${NOVARECASH_NOME} e preciso de ajuda para acessar.`);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Link href="/" className="mb-8">
        <Image src="/marca/logo-novare.png" alt="Novare" width={126} height={35} priority style={{ height: 35, width: "auto" }} />
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-semibold text-primary sm:text-3xl">
            {temAcesso ? `Seu ${NOVARECASH_NOME} está liberado` : `Bem-vindo ao ${NOVARECASH_NOME}`}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {temAcesso
              ? "Está tudo certo com a sua assinatura. É só abrir."
              : "Pagamento feito? Falta só um passo: entrar com o MESMO e-mail que você usou na compra."}
          </p>
        </div>

        <div className="card-novare mt-6 p-6">
          {temAcesso ? (
            <Link href={APP} className="btn-cp w-full">
              Abrir o {NOVARECASH_NOME}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : perfil ? (
            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              <p>
                Você está logado como <strong className="break-all">{perfil.email}</strong>, mas esse e-mail ainda não tem o{" "}
                {NOVARECASH_NOME}.
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>Se a compra foi com <strong>outro e-mail</strong>, saia e entre (ou crie a conta) com ele.</li>
                <li>Pix e cartão liberam em até 2 minutos. Boleto, depois da compensação (até 3 dias úteis).</li>
              </ul>
              <Link href={APP} className="btn-cp w-full">
                Tentar abrir de novo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <form action={sair}>
                <button type="submit" className="btn-petroleo w-full">
                  <LogIn className="h-4 w-4" />
                  Sair e entrar com outro e-mail
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href={`/login?modo=criar&proximo=${proximo}`} className="btn-cp w-full">
                <UserPlus className="h-4 w-4" />
                Criar minha conta
              </Link>
              <Link href={`/login?proximo=${proximo}`} className="btn-petroleo w-full">
                <LogIn className="h-4 w-4" />
                Já tenho conta · Entrar
              </Link>
              <Link
                href={`/login?modo=recuperar&proximo=${proximo}`}
                className="flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-accent-strong underline-offset-4 hover:underline"
              >
                <KeyRound className="h-4 w-4" />
                Esqueci a senha
              </Link>
              <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                Use o <strong className="text-foreground">mesmo e-mail da compra</strong> — é ele que libera o acesso. Pix e cartão
                liberam em até 2 minutos; boleto, depois da compensação.
              </p>
            </div>
          )}
        </div>

        <a
          href={ajuda}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex min-h-11 items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          Precisa de ajuda? WhatsApp {CONTATO.telefone}
        </a>
      </div>
    </div>
  );
}
