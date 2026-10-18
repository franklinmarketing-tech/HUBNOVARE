"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * O formulário que grava a senha nova.
 *
 * ⚠️ NÃO PEDE A SENHA ATUAL, e isso está certo: quem chega aqui provou ser
 * dono do e-mail ao abrir o link, e pedir a senha atual a quem acabou de
 * dizer que a esqueceu seria um beco sem saída. É o mesmo que `trocarSenha`
 * faz em `/perfil` — o Supabase só exige sessão ativa.
 *
 * ⚠️ MANDA PARA `/` DEPOIS, não para o login: a sessão já está aberta
 * quando a senha é trocada, e devolver para a tela de login faria a pessoa
 * digitar a senha que acabou de criar, parecendo que não funcionou.
 */
export function FormNovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 8) return setErro("A senha precisa de pelo menos 8 caracteres.");
    if (senha !== repetida) return setErro("As duas senhas não são iguais.");

    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) return setErro(error.message);

    setPronto(true);
    router.push("/");
    router.refresh();
  }

  const campo =
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";
  const rotulo = "mb-1.5 block text-xs font-semibold text-muted-foreground";

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label htmlFor="senha" className={rotulo}>
          Nova senha
        </label>
        <input
          id="senha"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Pelo menos 8 caracteres"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="senha2" className={rotulo}>
          Repita a senha
        </label>
        <input
          id="senha2"
          type="password"
          required
          autoComplete="new-password"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          className={campo}
        />
      </div>

      {erro && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={salvando || pronto}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {salvando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando…
          </>
        ) : pronto ? (
          <>
            <Check className="h-4 w-4" />
            Senha criada
          </>
        ) : (
          "Salvar e entrar"
        )}
      </button>
    </form>
  );
}
