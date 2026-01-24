import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  Briefcase,
  GraduationCap,
  Award,
  Bot,
  ArrowRight,
  CheckCircle,
  Users,
  MapPin,
  Sparkles,
  Play,
  Star,
  Zap,
  Shield,
  Globe,
  Heart,
  Mail,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// Floating animation component
function FloatingElement({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

// Testimonials data
const testimonials = [
  {
    name: "Fatou Diallo",
    role: "Développeuse Web",
    location: "Ziguinchor",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=face",
    content: "Grâce à Noken, j'ai trouvé mon premier emploi en moins de 2 semaines. L'assistant IA m'a aidé à optimiser mon CV.",
    rating: 5,
  },
  {
    name: "Moussa Sow",
    role: "Étudiant en Master",
    location: "Dakar",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "J'ai décroché une bourse pour la France grâce aux alertes personnalisées. Merci Noken !",
    rating: 5,
  },
  {
    name: "Aminata Ndiaye",
    role: "Comptable",
    location: "Kolda",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content: "La plateforme est intuitive et les offres sont de qualité. Je recommande à tous les Casamançais !",
    rating: 5,
  },
];

// Partners logos (using placeholder colors)
const partners = [
  { name: "Sonatel", color: "from-orange-400 to-orange-600" },
  { name: "ONFP", color: "from-blue-400 to-blue-600" },
  { name: "ANPEJ", color: "from-green-400 to-green-600" },
  { name: "Campus France", color: "from-red-400 to-red-600" },
  { name: "USAID", color: "from-indigo-400 to-indigo-600" },
];

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Animated counters
  const membersCounter = useCountUp(1000, 2500);
  const offersCounter = useCountUp(150, 2000);
  const partnersCounter = useCountUp(25, 1500);
  const placementCounter = useCountUp(85, 2000);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-white font-bold text-xl md:text-2xl">N</span>
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Noken
                </span>
                <span className="hidden md:inline text-xs text-gray-500 ml-2">Casamance</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" onClick={handleAuth} className="hidden sm:flex">
                Se connecter
              </Button>
              <Button onClick={handleAuth} className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Commencer</span>
                <span className="sm:hidden">Rejoindre</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
                <MapPin className="h-4 w-4" />
                <span>Plateforme #1 en Casamance</span>
                <Sparkles className="h-4 w-4" />
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Votre avenir
                </span>
                <br />
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent animate-gradient">
                    commence ici
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 4 150 6C200 8 250 4 298 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              <p className="mt-8 text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Noken connecte les talents de la <strong className="text-gray-900">Casamance</strong> aux meilleures opportunités. 
                Emplois, formations, bourses — tout est à portée de clic.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  onClick={handleAuth} 
                  className="group text-base px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <span>Créer mon compte gratuit</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group text-base px-8 py-6 border-2 hover:bg-gray-50"
                  onClick={() => navigate("/offres")}
                >
                  <Play className="mr-2 h-5 w-5 text-primary" />
                  <span>Voir les offres</span>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <span>100% Gratuit</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span>Inscription en 30s</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Made in Sénégal</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              {/* Main Card */}
              <div className="relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  {/* Profile Preview */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Tableau de bord</h3>
                      <p className="text-sm text-gray-500">Gérez votre carrière</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4">
                      <Briefcase className="h-6 w-6 text-primary mb-2" />
                      <div className="text-2xl font-bold text-gray-900">24</div>
                      <div className="text-xs text-gray-600">Offres compatibles</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl p-4">
                      <GraduationCap className="h-6 w-6 text-emerald-500 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">8</div>
                      <div className="text-xs text-gray-600">Formations</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-4">
                      <Award className="h-6 w-6 text-amber-500 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">5</div>
                      <div className="text-xs text-gray-600">Bourses</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-4">
                      <Bot className="h-6 w-6 text-purple-500 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">IA</div>
                      <div className="text-xs text-gray-600">Assistant</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-emerald-500 h-full w-3/4 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Profil complété à 75%</p>
                </div>
              </div>

              {/* Floating Elements */}
              <FloatingElement delay={0} className="absolute -top-8 -right-8 z-20">
                <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nouvelle offre !</p>
                      <p className="text-xs text-gray-500">Développeur à Ziguinchor</p>
                    </div>
                  </div>
                </div>
              </FloatingElement>

              <FloatingElement delay={1} className="absolute -bottom-4 -left-8 z-20">
                <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bourse disponible</p>
                      <p className="text-xs text-gray-500">Master en France</p>
                    </div>
                  </div>
                </div>
              </FloatingElement>

              {/* Background Decorations */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div ref={membersCounter.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {membersCounter.count}+
                </div>
                <div className="text-gray-400 text-sm md:text-base">Membres actifs</div>
              </div>
              <div ref={offersCounter.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                  {offersCounter.count}+
                </div>
                <div className="text-gray-400 text-sm md:text-base">Offres actives</div>
              </div>
              <div ref={partnersCounter.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">
                  {partnersCounter.count}+
                </div>
                <div className="text-gray-400 text-sm md:text-base">Partenaires</div>
              </div>
              <div ref={placementCounter.ref} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {placementCounter.count}%
                </div>
                <div className="text-gray-400 text-sm md:text-base">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>Fonctionnalités</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout pour réussir votre carrière
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des outils puissants pour vous accompagner à chaque étape de votre parcours professionnel
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Briefcase,
                title: "Offres d'emploi",
                description: "Des centaines d'opportunités en Casamance et au Sénégal",
                color: "from-blue-500 to-blue-600",
                bgColor: "bg-blue-50",
              },
              {
                icon: GraduationCap,
                title: "Formations",
                description: "Développez vos compétences avec des formations certifiantes",
                color: "from-emerald-500 to-emerald-600",
                bgColor: "bg-emerald-50",
              },
              {
                icon: Award,
                title: "Bourses d'études",
                description: "Accédez à des bourses pour le Sénégal et l'international",
                color: "from-amber-500 to-amber-600",
                bgColor: "bg-amber-50",
              },
              {
                icon: Bot,
                title: "Assistant IA",
                description: "Un conseiller intelligent qui analyse votre profil",
                color: "from-purple-500 to-purple-600",
                bgColor: "bg-purple-50",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-14 w-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-7 w-7 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} style={{ color: feature.color.includes('blue') ? '#3b82f6' : feature.color.includes('emerald') ? '#10b981' : feature.color.includes('amber') ? '#f59e0b' : '#8b5cf6' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600">
              Trois étapes simples pour lancer votre carrière
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary via-emerald-500 to-amber-500" />

            {[
              {
                step: "01",
                title: "Créez votre profil",
                description: "Inscrivez-vous gratuitement et complétez votre CV en quelques minutes",
                icon: Users,
                color: "primary",
              },
              {
                step: "02",
                title: "Explorez les offres",
                description: "Parcourez les opportunités adaptées à votre profil et vos ambitions",
                icon: Globe,
                color: "emerald-500",
              },
              {
                step: "03",
                title: "Postulez facilement",
                description: "Candidatez en un clic et suivez vos candidatures en temps réel",
                icon: Zap,
                color: "amber-500",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className={`mx-auto h-20 w-20 rounded-full bg-${item.color}/10 flex items-center justify-center mb-6 relative z-10 bg-white shadow-lg`}>
                  <item.icon className={`h-10 w-10 text-${item.color}`} style={{ color: item.color === 'primary' ? '#10b981' : item.color === 'emerald-500' ? '#10b981' : '#f59e0b' }} />
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              <span>Témoignages</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <img
                  src={testimonials[activeTestimonial].image}
                  alt={testimonials[activeTestimonial].name}
                  className="h-24 w-24 rounded-2xl object-cover shadow-lg"
                />
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-lg md:text-xl text-gray-700 italic mb-6">
                    "{testimonials[activeTestimonial].content}"
                  </p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</p>
                    <p className="text-sm text-gray-500">
                      {testimonials[activeTestimonial].role} • {testimonials[activeTestimonial].location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeTestimonial ? "w-8 bg-primary" : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 mb-8">Ils nous soutiennent</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className={`h-12 w-24 rounded-lg bg-gradient-to-r ${partner.color} opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center`}
              >
                <span className="text-white font-bold text-xs">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-emerald-600 to-emerald-700 rounded-3xl p-8 md:p-16 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Prêt à transformer votre avenir ?
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Rejoignez plus de 1 000 Casamançais qui construisent leur carrière avec Noken.
                C'est gratuit et ça le restera toujours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleAuth}
                  className="bg-white text-primary hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 px-8 py-6 text-base"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Créer mon compte gratuit
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loginWithGoogle}
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-base"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">N</span>
                </div>
                <span className="font-bold text-xl text-white">Noken</span>
              </div>
              <p className="text-gray-400 max-w-md">
                La plateforme qui connecte les talents de la Casamance aux meilleures opportunités professionnelles.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/offres" className="hover:text-white transition-colors">Offres d'emploi</a></li>
                <li><a href="/offres?type=FORMATION" className="hover:text-white transition-colors">Formations</a></li>
                <li><a href="/offres?type=BOURSE" className="hover:text-white transition-colors">Bourses</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Ziguinchor, Sénégal</li>
                <li>contact@noken.sn</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 Noken. Tous droits réservés. Made with ❤️ in Casamance
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
