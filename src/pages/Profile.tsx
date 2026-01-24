import { useState, useRef } from "react";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { usersService } from "@/services";
import { getImageUrl } from "@/services/api";
import confetti from "canvas-confetti";
import {
  User,
  Mail,
  Camera,
  Save,
  Shield,
  Briefcase,
  MapPin,
  Search,
  CheckCircle,
  GraduationCap,
  Laptop,
  RefreshCw,
  HelpCircle,
  Loader2,
} from "lucide-react";

const statutOptions = [
  { value: "NON_PRECISE", label: "Non précisé", icon: HelpCircle, color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300", borderColor: "border-gray-300" },
  { value: "EN_RECHERCHE", label: "En recherche", icon: Search, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", borderColor: "border-orange-500" },
  { value: "EN_POSTE", label: "En poste", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", borderColor: "border-green-500" },
  { value: "ETUDIANT", label: "Étudiant", icon: GraduationCap, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", borderColor: "border-blue-500" },
  { value: "FREELANCE", label: "Freelance", icon: Laptop, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", borderColor: "border-purple-500" },
  { value: "CHOMAGE", label: "Sans emploi", icon: Search, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", borderColor: "border-red-500" },
  { value: "RECONVERSION", label: "Reconversion", icon: RefreshCw, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", borderColor: "border-teal-500" },
];

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    statutProfessionnel: user?.statutProfessionnel || "NON_PRECISE" as string,
    pays: user?.pays || "Sénégal",
    commune: user?.commune || "",
    quartier: user?.quartier || "",
  });

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b'],
    });
  };

  const handleStatutChange = (value: string) => {
    const wasNotEnPoste = formData.statutProfessionnel !== "EN_POSTE";
    setFormData((prev) => ({ ...prev, statutProfessionnel: value }));
    
    if (value === "EN_POSTE" && wasNotEnPoste) {
      triggerConfetti();
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await usersService.uploadPhoto(user.id, formData);
      await refreshUser();
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erreur lors de l'upload de la photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersService.update(user.id, formData as any);
      await refreshUser();
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      <Header title="Mon Profil" subtitle="Gérez vos informations personnelles" />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Picture */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {uploadingPhoto ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : user.pictureUrl ? (
                    <img
                      src={getImageUrl(user.pictureUrl)}
                      alt=""
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-medium text-primary">
                      {user.firstName?.[0] || user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstName || user.username}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <Shield className="h-3 w-3" />
                    {user.role}
                  </span>
                  {user.isGoogleLogin && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Google
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block dark:text-gray-200">Prénom</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  placeholder="Votre prénom"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block dark:text-gray-200">Nom</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Votre nom"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block dark:text-gray-200">Nom d'utilisateur</label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Nom d'utilisateur"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block dark:text-gray-200">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <Input value={user.email} disabled className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400" />
              <p className="text-xs text-muted-foreground mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <MapPin className="h-5 w-5" />
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block dark:text-gray-200">Pays</label>
              <Input
                value={formData.pays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pays: e.target.value }))
                }
                placeholder="Sénégal"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block dark:text-gray-200">Commune</label>
                <Input
                  value={formData.commune}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, commune: e.target.value }))
                  }
                  placeholder="Ex: Dakar Plateau"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block dark:text-gray-200">Quartier</label>
                <Input
                  value={formData.quartier}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, quartier: e.target.value }))
                  }
                  placeholder="Ex: Médina"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Status - Card style buttons */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Briefcase className="h-5 w-5" />
              Situation professionnelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sélectionnez votre statut actuel
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {statutOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.statutProfessionnel === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatutChange(option.value)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected 
                        ? `${option.color} ${option.borderColor} shadow-md scale-105` 
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isSelected ? '' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className={`text-sm font-medium text-center ${isSelected ? '' : 'text-gray-700 dark:text-gray-300'}`}>
                      {option.label}
                    </span>
                    {option.value === "EN_POSTE" && isSelected && (
                      <span className="text-xs mt-1">🎉</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Cette information aide à personnaliser les offres qui vous sont proposées
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}
