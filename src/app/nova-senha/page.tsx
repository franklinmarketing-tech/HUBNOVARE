import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormNovaSenha } from "./FormNovaSenha";

/**
 * DEFINIR A SENHA DEPOIS DO LINK DE RECUPERAÇÃO.
 *
 * ⚠️ ESTA TELA FALTAVA, E O BURACO ERA SILENCIOSO. O Hub mandava o link de
 * recuperação e não tinha onde receber de volta: a pessoa clicava, voltava
 * para `/login` e não acontecia nada. Ninguém reclamava — quem não consegue
 * entrar não abre chamado, some.
 *
 * ⚠️ EXIGE SESSÃO, e é o `/auth/callback` que a abre, trocando o `?code=`
 * do link por uma sessão de verdade. Chegar aqui sem sessão significa link
 * gasto, expirado ou aberto em outro navegador — e nesse caso o certo é
 * mandar de volta para o login pedir outro, não mostrar um formulário que
 * vai falhar no envio.
 */

export const dynamic = "force-dynamic";

export default async function NovaSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?erro=link-gasto");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Link href="/" className="mb-8">
        <Image
          src="/marca/logo-novare.png"
          alt="Novare"
          width={126}
          height={35}
          priority
          style={{ height: 35, width: "auto" }}
        />
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-2xl font-medium text-primary">
          Criar nova senha
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Você está definindo a senha de{" "}
          <span className="font-semibold text-foreground">{user.email}</span>.
        </p>

        <div className="card-novare mt-6 p-6">
          <FormNovaSenha />
        </div>
      </div>
    </div>
  );
}
