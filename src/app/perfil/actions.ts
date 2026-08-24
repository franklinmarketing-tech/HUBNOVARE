"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoPerfil = { ok?: string; erro?: string };

const UFS = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);

function texto(v: FormDataEntryValue | null, max = 120): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Salva o cadastro do cliente.
 *
 * `role` e `plano` NÃO entram aqui de propósito: quem muda plano é o
 * fluxo de pagamento, e quem muda papel é o administrador. Deixar esses
 * campos passarem por um formulário do usuário seria dar a ele o poder de
 * se promover.
 */
export async function salvarPerfil(
  _anterior: EstadoPerfil,
  form: FormData,
): Promise<EstadoPerfil> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const nome = texto(form.get("nome"));
  if (!nome) return { erro: "O nome não pode ficar em branco." };

  const uf = texto(form.get("uf"), 2)?.toUpperCase() ?? null;
  if (uf && !UFS.has(uf)) return { erro: "UF inválida." };

  const nascimento = texto(form.get("nascimento"), 10);
  if (nascimento && !/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) {
    return { erro: "Data de nascimento inválida." };
  }

  const dados = {
    nome,
    apelido: texto(form.get("apelido"), 40),
    telefone: texto(form.get("telefone"), 20),
    nascimento,
    cidade: texto(form.get("cidade"), 60),
    uf,
    profissao: texto(form.get("profissao"), 60),
    objetivo: texto(form.get("objetivo"), 400),
    aceita_email: form.get("aceita_email") === "on",
  };

  const { error } = await supabase
    .from("hub_profiles")
    .update(dados)
    .eq("id", user.id);

  if (error) {
    // Coluna que falta significa que a migração ainda não rodou — vale
    // dizer isso em vez de um "erro desconhecido" que não ajuda ninguém.
    const faltaColuna = /column .* does not exist/i.test(error.message);
    return {
      erro: faltaColuna
        ? "O banco ainda não tem os campos novos. Rode supabase/hub_profiles_completo.sql."
        : "Não consegui salvar agora. Tente de novo.",
    };
  }

  // O nome também vive no metadata do auth: é o que aparece na saudação.
  await supabase.auth.updateUser({ data: { nome } });

  revalidatePath("/perfil");
  revalidatePath("/");
  return { ok: "Cadastro salvo." };
}

/** Troca de senha. O Supabase exige sessão ativa, então não pede a atual. */
export async function trocarSenha(
  _anterior: EstadoPerfil,
  form: FormData,
): Promise<EstadoPerfil> {
  const nova = String(form.get("senha") ?? "");
  const repetida = String(form.get("senha2") ?? "");

  if (nova.length < 8) return { erro: "A senha precisa de pelo menos 8 caracteres." };
  if (nova !== repetida) return { erro: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: nova });

  if (error) return { erro: "Não consegui trocar a senha agora." };
  return { ok: "Senha trocada." };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
