import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";

/**
 * Export dos leads em CSV.
 *
 * ⚠️ A GUARDA É OBRIGATÓRIA AQUI, e não herdada do layout. `/admin/layout.tsx`
 * protege as PÁGINAS debaixo de `/admin`; esta rota vive em `/api` e não passa
 * por ele. Sem o check abaixo, a lista comercial inteira da casa sairia por
 * uma URL que qualquer pessoa logada poderia abrir.
 *
 * ⚠️ E O FILTRO É REAPLICADO NO SERVIDOR. Os parâmetros vêm da URL, então
 * confiar neles para decidir O QUE SAI seria aceitar que o cliente escolha o
 * recorte — o que aqui é inofensivo (ele já teria acesso ao conjunto), mas
 * vira hábito ruim na próxima rota.
 */
export async function GET(req: Request) {
  const perfil = await getPerfil();
  if (!perfil || (perfil.role !== "admin" && perfil.role !== "equipe")) {
    /* 404, não 403 — mesma razão das páginas: um 403 confirma que a rota
       existe e que há algo protegido nela. */
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(req.url);
  const busca = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const tipo = (url.searchParams.get("tipo") ?? "").trim();

  const supabase = await createClient();
  const { data } = await supabase
    .from("hub_leads")
    /* A situação e a anotação entram no CSV: quem exporta a lista para
       trabalhar fora precisa saber com quem já se falou, senão a planilha
       nasce desatualizada em relação ao painel no mesmo instante. */
    .select("email, nome, telefone, origem, tipo, criado_em, situacao, anotacao")
    .order("criado_em", { ascending: false })
    .limit(5000);

  type L = Record<string, string | null>;
  const linhas = ((data as L[]) ?? []).filter((l) => {
    if (tipo && l.tipo !== tipo) return false;
    if (!busca) return true;
    return [l.email, l.nome, l.telefone, l.origem]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(busca));
  });

  /**
   * Escapa um campo para CSV.
   *
   * ⚠️ O PREFIXO CONTRA FÓRMULA NÃO É PARANOIA. Excel e Google Sheets
   * executam célula que começa com `=`, `+`, `-` ou `@` — e os nomes aqui vêm
   * de formulário público. Um lead chamado `=HYPERLINK(...)` viraria código
   * rodando na planilha de quem abrir. O apóstrofo na frente neutraliza.
   */
  const esc = (v: string | null) => {
    let s = (v ?? "").replace(/\r?\n/g, " ");
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const csv = [
    ["email", "nome", "telefone", "origem", "tipo", "criado_em", "situacao", "anotacao"].join(","),
    ...linhas.map((l) =>
      [l.email, l.nome, l.telefone, l.origem, l.tipo, l.criado_em, l.situacao, l.anotacao]
        .map(esc)
        .join(","),
    ),
  ].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);

  return new NextResponse(
    /* BOM na frente: sem ele o Excel no Windows abre "José" como "JosÃ©". */
    "﻿" + csv,
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-novare-${hoje}.csv"`,
        /* Lista de clientes não se guarda em cache de CDN nem de navegador. */
        "Cache-Control": "no-store",
      },
    },
  );
}
