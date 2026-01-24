import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card, CardContent, AlertModal } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { authService } from "@/services";

type AuthMode = "login" | "register" | "verify";

export function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
  });
  
  // Verification code
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  
  // Modal
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = [...verificationCode];
    for (let i = 0; i < pastedData.length; i++) {
      if (/\d/.test(pastedData[i])) {
        newCode[i] = pastedData[i];
      }
    }
    setVerificationCode(newCode);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    if (formData.password.length < 6) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username || formData.email.split("@")[0],
      });
      
      setPendingEmail(formData.email);
      setMode("verify");
      setModal({
        isOpen: true,
        type: "success",
        title: "Code envoyé !",
        message: `Un code de vérification a été envoyé à ${formData.email}`,
      });
    } catch (error: any) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: error.response?.data?.message || "Une erreur est survenue lors de l'inscription.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      
      if (response.requiresVerification) {
        setPendingEmail(formData.email);
        setMode("verify");
        setModal({
          isOpen: true,
          type: "success",
          title: "Vérification requise",
          message: "Un code de vérification a été envoyé à votre email.",
        });
      } else if (response.accessToken || response.access_token || response.user) {
        // Login successful - tokens already saved by authService.login
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur de connexion",
        message: error.response?.data?.message || "Email ou mot de passe incorrect.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    
    if (code.length !== 6) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Code incomplet",
        message: "Veuillez entrer le code à 6 chiffres.",
      });
      return;
    }

    setLoading(true);
    try {
      await authService.verifyEmail({
        email: pendingEmail,
        code,
      });
      
      setModal({
        isOpen: true,
        type: "success",
        title: "Email vérifié !",
        message: "Votre compte a été activé. Vous pouvez maintenant vous connecter.",
      });
      
      setTimeout(() => {
        setMode("login");
        setModal({ ...modal, isOpen: false });
      }, 2000);
    } catch (error: any) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Code invalide",
        message: error.response?.data?.message || "Le code de vérification est incorrect ou expiré.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await authService.resendVerificationCode(pendingEmail);
      setModal({
        isOpen: true,
        type: "success",
        title: "Code renvoyé",
        message: `Un nouveau code a été envoyé à ${pendingEmail}`,
      });
    } catch (error: any) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de renvoyer le code. Réessayez plus tard.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Noken
            </span>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-8">
            {/* Mode: Verify */}
            {mode === "verify" && (
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Vérifiez votre email
                </h2>
                <p className="text-gray-600 mb-8">
                  Entrez le code à 6 chiffres envoyé à<br />
                  <strong className="text-gray-900">{pendingEmail}</strong>
                </p>

                <form onSubmit={handleVerify}>
                  <div className="flex justify-center gap-2 mb-8">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        onPaste={handleCodePaste}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-6 text-base shadow-lg shadow-primary/25"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Vérifier
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Renvoyer le code
                  </button>
                </div>

                <button
                  onClick={() => setMode("login")}
                  className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Retour à la connexion
                </button>
              </div>
            )}

            {/* Mode: Login */}
            {mode === "login" && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Bon retour ! 👋
                </h2>
                <p className="text-gray-600 text-center mb-8">
                  Connectez-vous pour accéder à votre compte
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 py-6"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 py-6"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-6 text-base shadow-lg shadow-primary/25"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full py-6 text-base border-2"
                  onClick={loginWithGoogle}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </Button>

                <p className="text-center mt-8 text-gray-600">
                  Pas encore de compte ?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="text-primary font-semibold hover:underline"
                  >
                    S'inscrire
                  </button>
                </p>
              </>
            )}

            {/* Mode: Register */}
            {mode === "register" && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Créer un compte <Sparkles className="inline h-6 w-6 text-amber-500" />
                </h2>
                <p className="text-gray-600 text-center mb-8">
                  Rejoignez la communauté Noken
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="Prénom"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="py-5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Nom"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="py-5"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 py-5"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom d'utilisateur (optionnel)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        name="username"
                        placeholder="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="pl-10 py-5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Min. 6 caractères"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10 py-5"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirmer"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10 py-5"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-6 text-base shadow-lg shadow-primary/25"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full py-5 text-base border-2"
                  onClick={loginWithGoogle}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </Button>

                <p className="text-center mt-6 text-gray-600">
                  Déjà un compte ?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Se connecter
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-gray-500">
          En continuant, vous acceptez nos{" "}
          <a href="#" className="text-primary hover:underline">Conditions d'utilisation</a>
          {" "}et notre{" "}
          <a href="#" className="text-primary hover:underline">Politique de confidentialité</a>
        </p>
      </div>

      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}
