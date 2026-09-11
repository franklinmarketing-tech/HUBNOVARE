"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

/**
 * Entrada de visitante para o Planejamento Financeiro — SEM link nenhum
 * apontando para cá, em lugar nenhum do site.
 *
 * Por quê: o Planejamento é produto pago hoje (assinatura ativa, com
 * garantia de 7 dias — não mais teste grátis). Um botão público de "entrar
 * sem cadastro" deixaria qualquer pessoa pular a assinatura inteira — o
 * oposto do que a página de vendas existe para fazer. Esta rota serve só para
 * teste interno: quem tem o endereço de cor entra, quem não tem nunca vai
 * encontrar.
 *
 * Como funciona: cria uma conta de verdade no Supabase, com e-mail gerado
 * e senha aleatória (a autenticação anônima está desligada neste projeto —
 * confirmado batendo direto na API antes de escrever isto). A sessão volta
 * confirmada na hora, sem precisar clicar em link de e-mail. A partir daí é
 * uma conta igual a qualquer outra: `garantirTeste()` (src/lib/trial.ts)
 * detecta o primeiro acesso e libera os 7 dias sozinho, do lado de dentro
 * do app — não precisei mexer em nada lá. Esse motor continua ligado de
 * propósito mesmo depois de o teste sair da venda; o porquê está no cabeçalho
 * de `lib/trial.ts`.
 *
 * A credencial fica guardada no navegador para a mesma pessoa voltar à
 * mesma conta depois, em vez de criar uma nova a cada visita.
 */

const CHAVE_VISITANTE = "novare:visitante-teste";

type Acesso = { email: string; senha: string };

const aleatorio = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

function lerAcesso(): Acesso | null {
  try {
    const cru = localStorage.getItem(CHAVE_VISITANTE);
    if (!cru) return null;
    const dados = JSON.parse(cru) as Acesso;
    return dados?.email && dados?.senha ? dados : null;
  } catch {
    return null;
  }
}

export default function EntrarComoVisitante() {
  const [erro, setErro] = useState<string | null>(null);
  const jaComecou = useRef(false);

  useEffect(() => {
    if (jaComecou.current) return;
    jaComecou.current = true;

    (async () => {
      const supabase = createClient();
      const salvo = lerAcesso();

      // Já esteve aqui: entra na mesma conta, para não acumular contas de
      // teste toda vez que alguém abre o link de novo.
      if (salvo) {
        const { error } = await supabase.auth.signInWithPassword({
          email: salvo.email,
          password: salvo.senha,
        });
        if (!error) {
          window.location.href = "/planejamento/app";
          return;
        }
        localStorage.removeItem(CHAVE_VISITANTE);
      }

      const acesso: Acesso = {
        email: `visitante.teste.${aleatorio()}@novareapp.com.br`,
        senha: `Vt-${aleatorio()}`,
      };

      const { data, error } = await supabase.auth.signUp({
        email: acesso.email,
        password: acesso.senha,
        options: { data: { full_name: "Visitante de teste" } },
      });

      if (error || !data.session) {
        setErro(
          error?.message ??
            "A conta foi criada, mas a sessão não veio pronta — pode ser confirmação de e-mail ligada no projeto.",
        );
        return;
      }

      try {
        localStorage.setItem(CHAVE_VISITANTE, JSON.stringify(acesso));
      } catch {
        /* navegador sem storage: a sessão desta visita continua valendo */
      }

      window.location.href = "/planejamento/app";
    })();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Image
        src="/marca/logo-novare.png"
        alt="Novare"
        width={126}
        height={35}
        style={{ height: 32, width: "auto" }}
      />
      {erro ? (
        <>
          <p className="max-w-sm text-sm text-destructive">{erro}</p>
          <p className="text-xs text-muted-foreground">
            Use o cadastro normal em{" "}
            <a href="/planejamento" className="font-semibold text-primary">
              /planejamento
            </a>
            .
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Entrando com conta de teste…
        </p>
      )}
    </div>
  );
}
