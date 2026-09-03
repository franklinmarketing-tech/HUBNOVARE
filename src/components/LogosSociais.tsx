/**
 * Glifos de Instagram, YouTube e LinkedIn.
 *
 * Esta versão do lucide-react não traz ícone de marca nenhum — por isso
 * os três vivem aqui.
 *
 * Antes eram um traço monocromático genérico (retângulo + círculo) a 16px:
 * legível de longe vira mancha borrada nesse tamanho, e não lembra a marca
 * de ninguém. Substituídos pelo traço OFICIAL de cada rede, nas cores
 * oficiais — em ícone pequeno, forma reconhecível pesa mais que upscale:
 * são caminhos vetoriais, nítidos em qualquer tamanho sem processamento.
 */

type Props = { className?: string };

export function InstagramLogo({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig-degrade" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0" stopColor="#FFDC80" />
          <stop offset=".25" stopColor="#FCAF45" />
          <stop offset=".5" stopColor="#E1306C" />
          <stop offset=".75" stopColor="#C13584" />
          <stop offset="1" stopColor="#5851DB" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-degrade)" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="#fff" />
    </svg>
  );
}

export function YoutubeLogo({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1.5" y="4.5" width="21" height="15" rx="5" fill="#FF0000" />
      <path d="M10 8.6v6.8l6-3.4-6-3.4Z" fill="#fff" />
    </svg>
  );
}

export function LinkedinLogo({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#0A66C2" />
      <rect x="5.3" y="9.6" width="2.9" height="9.1" fill="#fff" />
      <circle cx="6.75" cy="6" r="1.75" fill="#fff" />
      <path
        d="M10.9 9.6h2.8v1.25c.4-.75 1.37-1.55 2.82-1.55 3.02 0 3.58 1.87 3.58 4.3v5.1h-2.9v-4.52c0-1.08-.02-2.47-1.5-2.47-1.51 0-1.74 1.18-1.74 2.4v4.6h-2.9V9.6Z"
        fill="#fff"
      />
    </svg>
  );
}
