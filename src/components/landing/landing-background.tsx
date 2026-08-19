/**
 * Décor animé de la page d'accueil.
 *
 * Intégralement en CSS : transformations 3D composées par le GPU, aucune
 * dépendance de rendu. C'est ce qui permet une scène dense sans peser sur le
 * bundle — un moteur 3D coûterait à lui seul plusieurs centaines de kilo-octets
 * pour un décor qui ne réagit à rien.
 *
 * Aucun état, aucun gestionnaire d'événement : le composant reste un Server
 * Component et son balisage part dans le HTML initial.
 *
 * Le vocabulaire visuel est celui du produit — cartes d'opportunité en
 * profondeur, réseau de points reliés, orbites, cap — et non des formes
 * abstraites choisies au hasard.
 */

type Vars = React.CSSProperties & Record<string, string | number>;

/** Carte d'opportunité stylisée, flottant en profondeur. */
function CarteFlottante({
  x,
  y,
  w,
  rot,
  anim,
  dur,
  delay,
  opacity,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  rot: number;
  anim: string;
  dur: string;
  delay: string;
  opacity: number;
  accent: string;
}) {
  return (
    <div
      className={anim}
      style={
        {
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: w,
          opacity,
          "--dur": dur,
          "--delay": delay,
        } as Vars
      }
      aria-hidden
    >
      <div
        style={{
          transform: `rotate(${rot}deg)`,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--card)",
          padding: 9,
          boxShadow: "0 18px 40px -22px rgb(0 0 0 / 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 5,
              background: accent,
              opacity: 0.85,
            }}
          />
          <span
            style={{
              height: 5,
              flex: 1,
              borderRadius: 3,
              background: "var(--muted-foreground)",
              opacity: 0.35,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            height: 5,
            width: "82%",
            borderRadius: 3,
            background: "var(--muted-foreground)",
            opacity: 0.22,
          }}
        />
        <div
          style={{
            marginTop: 5,
            height: 5,
            width: "56%",
            borderRadius: 3,
            background: "var(--muted-foreground)",
            opacity: 0.16,
          }}
        />
      </div>
    </div>
  );
}

/** Noyau entouré de deux orbites inclinées, avec des points en révolution. */
function Orbite({
  x,
  y,
  taille,
  opacity,
}: {
  x: number;
  y: number;
  taille: number;
  opacity: number;
}) {
  return (
    <div
      style={{ position: "absolute", left: `${x}%`, top: `${y}%`, opacity }}
      aria-hidden
    >
      <div style={{ position: "relative", width: taille, height: taille }}>
        <span
          style={{
            position: "absolute",
            inset: "50%",
            width: 10,
            height: 10,
            margin: "-5px 0 0 -5px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--primary) 0%, transparent 72%)",
          }}
        />
        <div
          className="anim-ring"
          style={
            {
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px solid var(--primary)",
              opacity: 0.3,
              "--dur": "22s",
            } as Vars
          }
        />
        <div
          className="anim-ring-rev"
          style={
            {
              position: "absolute",
              inset: taille * 0.18,
              borderRadius: "50%",
              border: "1px solid var(--chart-3)",
              opacity: 0.28,
              "--dur": "16s",
            } as Vars
          }
        />
        <span
          className="anim-orbit"
          style={
            {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 6,
              height: 6,
              margin: "-3px 0 0 -3px",
              borderRadius: "50%",
              background: "var(--primary)",
              "--r": `${taille / 2}px`,
              "--dur": "9s",
            } as Vars
          }
        />
        <span
          className="anim-orbit"
          style={
            {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 5,
              height: 5,
              margin: "-2.5px 0 0 -2.5px",
              borderRadius: "50%",
              background: "var(--chart-3)",
              "--r": `${taille * 0.32}px`,
              "--dur": "6s",
            } as Vars
          }
        />
      </div>
    </div>
  );
}

/** Point de réseau émettant une onde. */
function Balise({ x, y, delay }: { x: number; y: number; delay: string }) {
  return (
    <div
      style={{ position: "absolute", left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      <span
        style={{
          position: "absolute",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--primary)",
        }}
      />
      <span
        className="anim-pulse-ring"
        style={
          {
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: "50%",
            border: "1.5px solid var(--primary)",
            "--delay": delay,
          } as Vars
        }
      />
    </div>
  );
}

const CARTES = [
  { x: 6, y: 20, w: 132, rot: -8, anim: "anim-float-a", dur: "13s", delay: "0s", opacity: 0.75, accent: "var(--primary)" },
  { x: 82, y: 14, w: 116, rot: 7, anim: "anim-float-b", dur: "15s", delay: "1.4s", opacity: 0.65, accent: "var(--chart-3)" },
  { x: 74, y: 62, w: 124, rot: -5, anim: "anim-float-c", dur: "11s", delay: "2.6s", opacity: 0.6, accent: "var(--chart-4)" },
  { x: 12, y: 68, w: 110, rot: 10, anim: "anim-float-b", dur: "16s", delay: "0.8s", opacity: 0.55, accent: "var(--chart-5)" },
];

const BALISES = [
  { x: 24, y: 34, delay: "0s" },
  { x: 63, y: 26, delay: "1.1s" },
  { x: 44, y: 74, delay: "2.2s" },
  { x: 88, y: 44, delay: "0.6s" },
];

const PARTICULES = [
  { x: 18, y: 16, s: 3, op: 0.35, dur: "9s", delay: "0s", dx: "14px", dy: "-20px" },
  { x: 70, y: 10, s: 2, op: 0.3, dur: "11s", delay: "1.5s", dx: "-10px", dy: "-16px" },
  { x: 38, y: 46, s: 4, op: 0.22, dur: "13s", delay: "3s", dx: "16px", dy: "-12px" },
  { x: 92, y: 70, s: 3, op: 0.28, dur: "10s", delay: "2s", dx: "-14px", dy: "-18px" },
  { x: 8, y: 82, s: 3, op: 0.26, dur: "12s", delay: "0.7s", dx: "12px", dy: "-22px" },
  { x: 56, y: 88, s: 2, op: 0.3, dur: "9.5s", delay: "2.8s", dx: "-8px", dy: "-14px" },
];

export function LandingBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 select-none overflow-hidden scene-3d"
      aria-hidden
    >
      {/* Halos d'ambiance. Le flou est fixe et la couche isolée : le navigateur
          la rasterise une fois puis se contente de la transformer. */}
      <div
        className="anim-breathe"
        style={
          {
            position: "absolute",
            top: "-14%",
            left: "-8%",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--primary) 0%, transparent 68%)",
            filter: "blur(50px)",
            "--op": 0.13,
            "--dur": "9s",
          } as Vars
        }
      />
      <div
        className="anim-breathe"
        style={
          {
            position: "absolute",
            bottom: "-16%",
            right: "-10%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--chart-3) 0%, transparent 68%)",
            filter: "blur(56px)",
            "--op": 0.11,
            "--dur": "12s",
            "--delay": "1.5s",
          } as Vars
        }
      />
      <div
        className="anim-breathe"
        style={
          {
            position: "absolute",
            top: "34%",
            left: "58%",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--chart-5) 0%, transparent 70%)",
            filter: "blur(60px)",
            "--op": 0.08,
            "--dur": "14s",
            "--delay": "3s",
          } as Vars
        }
      />

      {/* Trame de points, estompée sur les bords. */}
      <div className="pattern-dots fade-edges absolute inset-0 opacity-70" />

      {/* Réseau de liaisons : le tracé se dessine au chargement. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          className="anim-draw"
          d="M120 420 L320 250 L520 330 L760 190 L980 300"
          stroke="var(--primary)"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.28"
          style={{ "--len": 1400, "--dur": "3.2s" } as Vars}
        />
        <path
          className="anim-draw"
          d="M200 610 L430 520 L640 580 L880 470 L1090 540"
          stroke="var(--chart-3)"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.22"
          style={{ "--len": 1400, "--dur": "3.8s", "--delay": "0.5s" } as Vars}
        />
      </svg>

      <Orbite x={72} y={22} taille={150} opacity={0.5} />
      <Orbite x={14} y={48} taille={104} opacity={0.4} />

      {CARTES.map((c, i) => (
        <CarteFlottante key={i} {...c} />
      ))}

      {BALISES.map((b, i) => (
        <Balise key={i} {...b} />
      ))}

      {PARTICULES.map((p, i) => (
        <span
          key={i}
          className="anim-drift"
          style={
            {
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              borderRadius: "50%",
              background: "var(--primary)",
              "--op": p.op,
              "--dur": p.dur,
              "--delay": p.delay,
              "--dx": p.dx,
              "--dy": p.dy,
            } as Vars
          }
        />
      ))}

      {/* Fondu vers le bas : la scène ne doit pas concurrencer le texte ni
          s'arrêter net à la limite de la section. */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
    </div>
  );
}
