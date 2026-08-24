import Image from "next/image";

/**
 * Logo oficial da Novare (o mesmo arquivo usado no app em produção).
 * A versão branca é para os blocos navy.
 */
export function Logo({
  claro = false,
  altura = 28,
}: {
  claro?: boolean;
  altura?: number;
}) {
  return (
    <Image
      src={claro ? "/marca/logo-novare-branca.png" : "/marca/logo-novare.png"}
      alt="Novare"
      width={altura * 3.6}
      height={altura}
      priority
      style={{ height: altura, width: "auto" }}
    />
  );
}
