import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Wand2, Brain, Zap } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  type?: "default" | "ai" | "magic";
}

export function LoadingOverlay({
  isVisible,
  title = "Chargement en cours...",
  subtitle,
  type = "default",
}: LoadingOverlayProps) {
  const [dots, setDots] = React.useState("");
  const [currentIcon, setCurrentIcon] = React.useState(0);

  const icons = [Sparkles, Wand2, Brain, Zap];

  React.useEffect(() => {
    if (!isVisible) return;

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 800);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(iconInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const CurrentIcon = icons[currentIcon];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                i % 3 === 0
                  ? "bg-primary/40"
                  : i % 3 === 1
                  ? "bg-purple-400/40"
                  : "bg-pink-400/40"
              )}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated icon container */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 w-32 h-32 -m-4">
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-primary border-r-purple-500 animate-spin" />
          </div>

          {/* Inner pulsing circle */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
            <CurrentIcon
              className={cn(
                "relative z-10 w-10 h-10 text-primary transition-all duration-300",
                type === "ai" && "text-purple-500",
                type === "magic" && "text-pink-500"
              )}
            />
          </div>

          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-primary to-purple-500"
              style={{
                animation: `orbit 2s linear infinite`,
                animationDelay: `${i * 0.66}s`,
                top: "50%",
                left: "50%",
                transformOrigin: "0 0",
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 max-w-sm animate-pulse">
              {subtitle}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-64 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full animate-progress" />
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }
        
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(60px) rotate(-360deg);
          }
        }
        
        @keyframes progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

interface AILoadingOverlayProps {
  isVisible: boolean;
  stage?: "analyzing" | "correcting" | "finalizing";
}

export function AILoadingOverlay({ isVisible, stage = "analyzing" }: AILoadingOverlayProps) {
  const stages = {
    analyzing: {
      title: "Analyse en cours",
      subtitle: "Notre IA examine votre CV avec attention...",
    },
    correcting: {
      title: "Optimisation du contenu",
      subtitle: "Amélioration de la qualité et du style professionnel...",
    },
    finalizing: {
      title: "Finalisation",
      subtitle: "Dernières retouches pour un CV parfait...",
    },
  };

  const { title, subtitle } = stages[stage];

  return (
    <LoadingOverlay
      isVisible={isVisible}
      title={title}
      subtitle={subtitle}
      type="ai"
    />
  );
}

interface UploadLoadingOverlayProps {
  isVisible: boolean;
  progress?: number;
}

export function UploadLoadingOverlay({ isVisible }: UploadLoadingOverlayProps) {
  const [scanLine, setScanLine] = React.useState(0);
  const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  React.useEffect(() => {
    if (!isVisible) return;

    const scanInterval = setInterval(() => {
      setScanLine((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    const particleInterval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = [...prev, { id: Date.now(), x: Math.random() * 100, y: 100 }];
        return newParticles.slice(-15);
      });
    }, 200);

    return () => {
      clearInterval(scanInterval);
      clearInterval(particleInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with scan effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-md" />

      {/* Scan line effect */}
      <div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
        style={{ top: `${scanLine}%`, transition: "top 0.05s linear" }}
      />

      {/* Rising particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-8 bg-gradient-to-t from-cyan-400 to-transparent rounded-full animate-rise"
            style={{
              left: `${particle.x}%`,
              bottom: 0,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Document icon with scan effect */}
        <div className="relative mb-8">
          {/* Outer glow */}
          <div className="absolute inset-0 w-40 h-48 -m-4 bg-cyan-400/20 rounded-lg blur-xl animate-pulse" />

          {/* Document shape */}
          <div className="relative w-32 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-cyan-400/50 overflow-hidden">
            {/* Document lines */}
            <div className="absolute inset-4 space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
            </div>

            {/* Scanning overlay */}
            <div
              className="absolute left-0 right-0 h-8 bg-gradient-to-b from-cyan-400/40 via-cyan-400/20 to-transparent"
              style={{ top: `${scanLine}%`, transition: "top 0.05s linear" }}
            />

            {/* Corner fold */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-cyan-200 to-cyan-400 dark:from-cyan-700 dark:to-cyan-500" 
                 style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          </div>

          {/* Floating data points */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping"
              style={{
                top: `${20 + i * 15}%`,
                right: "-20px",
                animationDelay: `${i * 0.3}s`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Extraction des données
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-4">
            Lecture et analyse de votre document PDF...
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-3 h-8 bg-cyan-400/30 rounded-full overflow-hidden"
              >
                <div
                  className="w-full bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-full animate-wave"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    height: "100%",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes rise {
          0% {
            transform: translateY(0) scaleY(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scaleY(0.5);
            opacity: 0;
          }
        }
        
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        
        .animate-rise {
          animation: rise 3s ease-out forwards;
        }
        
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
