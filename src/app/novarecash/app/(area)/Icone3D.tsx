import Image from "next/image";

import type { NomeIcone } from "./menu";

/**
 * UM ÍCONE 3D DO NOVARECASH (vidro azul-marinho, ouro e borda turquesa).
 *
 * Sempre decorativo (`alt=""`): quem carrega o nome é o texto ou o `aria-label`
 * do botão/link. Largura e altura fixas reservam o lugar (sem salto de layout).
 *
 * Sem `sizes` DE PROPÓSITO: com tamanho fixo o Next gera o `srcset` por
 * densidade (1x/2x → 32 e 64px a partir do webp de 256px). Com `sizes` ele
 * listaria as 16 larguras da configuração em cada ícone, e o trilho tem 14.
 *
 * O brilho (`.ncash-icone3d`, fim do globals.css) muda com o tema: no escuro um
 * halo turquesa descola o vidro marinho da noite; no claro, uma sombra curta.
 */
export function Icone3D({
  nome,
  tamanho,
  ativo = false,
  className = "",
}: {
  nome: NomeIcone;
  tamanho: number;
  ativo?: boolean;
  className?: string;
}) {
  /* 05/11/2026 ("limpo e leve"): ícones foscos, sem brilho. Há DOIS conjuntos com o
     mesmo desenho — `icones/` (petróleo, para o fundo claro) e `icones-escuro/` (corpo
     claro, para a noite) — e o CSS mostra o do tema (`.ncash-ic-claro`/`.ncash-ic-escuro`).
     São ~6 KB cada; carregar os dois custa menos que um tema com ícone sumindo no fundo. */
  const classe = `ncash-icone3d shrink-0 select-none ${ativo ? "ncash-icone3d-ativo" : ""} ${className}`;
  return (
    <>
      <Image
        src={`/novarecash/icones-escuro/${nome}.webp`}
        alt=""
        aria-hidden
        width={tamanho}
        height={tamanho}
        draggable={false}
        className={`ncash-ic-escuro ${classe}`}
      />
      <Image
        src={`/novarecash/icones/${nome}.webp`}
        alt=""
        aria-hidden
        width={tamanho}
        height={tamanho}
        draggable={false}
        className={`ncash-ic-claro ${classe}`}
      />
    </>
  );
}
