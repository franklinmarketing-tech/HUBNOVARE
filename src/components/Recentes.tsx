"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";
import { gradienteDe, iconeDe, raioDe } from "@/lib/icones";
import type { AppLeve } from "@/lib/navegacao";

/**
 * "Continue de onde parou": a fileira que faz o workspace virar hábito.
 * Lê os recentes gravados pelas próprias ferramentas e some quando o
 * usuário ainda não usou nada (primeira visita não ganha seção vazia).
 */
export function Recentes({ apps }: { apps: AppLeve[] }) {
  const [recentes, setRecentes] = useState<AppLeve[]>([]);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem("novare:recentes");
      if (!bruto) return;
      const lista: Array<{ slug: string }> = JSON.parse(bruto);
      const porSlug = new Map(apps.map((a) => [a.slug, a]));
      setRecentes(
        lista
          .map((r) => porSlug.get(r.slug))
          .filter((a): a is AppLeve => !!a)
          .slice(0, 6),
      );
    } catch {
      // Sem storage, sem seção.
    }
  }, [apps]);

  if (recentes.length === 0) return null;

  return (
    <section aria-label="Usadas recentemente">
      <div className="mb-2.5 flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground">
          Continue de onde parou
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentes.map((app) => {
          const Icone = iconeDe(app.slug);
          return (
            <Link
              key={app.slug}
              href={app.href}
              className="group flex items-center gap-2 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3 transition-all hover:border-primary/30"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center ${raioDe(app.slug)}`}
                style={{ backgroundImage: gradienteDe(app.slug) }}
              >
                <Icone className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
              </span>
              <span className="text-[13px] font-medium text-foreground">
                {app.nome}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
