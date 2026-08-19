import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo de marque. L'image porte déjà le mot « NOKEN » : le libellé texte à
 * côté ne le répète pas, il complète avec « Declic ».
 */
export function Logo({
  href = "/",
  className,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
    >
      <Image
        src="/noken-logo.png"
        alt=""
        width={32}
        height={32}
        // `priority` : le logo est dans l'en-tête, visible dès le premier écran.
        priority
        className="size-7 shrink-0 object-contain"
      />
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight">
          Noken<span className="text-primary"> Declic</span>
        </span>
      ) : null}
      <span className="sr-only">Noken Declic — accueil</span>
    </Link>
  );
}
