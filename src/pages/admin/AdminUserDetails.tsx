import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, AlertModal, ConfirmModal } from "@/components/ui";
import { adminService } from "@/services";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  MessageSquare,
  Heart,
  User,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Clock,
  Globe,
  GraduationCap,
  Building2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface UserDetails {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isGoogleLogin?: boolean;
  pictureUrl?: string;
  statutProfessionnel?: string;
  sexe?: string;
  dateNaissance?: string;
  telephone?: string;
  pays?: string;
  commune?: string;
  quartier?: string;
  adresse?: string;
  handicap?: boolean;
  typeHandicap?: string;
  createdAt: string;
  updatedAt?: string;
  cv?: {
    id: number;
    titre?: string;
    resume?: string;
    competences?: string[];
    experiences?: any[];
    formations?: any[];
    langues?: any[];
  };
  retours?: {
    id: number;
    titre: string;
    datePublication: string;
  }[];
  offres?: {
    id: number;
    titre: string;
    typeOffre: string;
    datePublication: string;
  }[];
  _count?: {
    retours: number;
    offres: number;
    favorites?: number;
  };
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PARTENAIRE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  MEMBRE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  PARTENAIRE: "Partenaire",
  MEMBRE: "Membre",
};

const statutLabels: Record<string, string> = {
  ETUDIANT: "Étudiant",
  DIPLOME: "Diplômé",
  EMPLOYE: "Employé",
  CHERCHEUR_EMPLOI: "Chercheur d'emploi",
  ENTREPRENEUR: "Entrepreneur",
  AUTRE: "Autre",
  NON_PRECISE: "Non précisé",
};

const sexeLabels: Record<string, string> = {
  HOMME: "Homme",
  FEMME: "Femme",
  AUTRE: "Autre",
  NON_PRECISE: "Non précisé",
};

const typeOffreColors: Record<string, string> = {
  EMPLOI: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FORMATION: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  BOURSE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  VOLONTARIAT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export function AdminUserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: "info" });

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUserById(Number(id));
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de charger les détails de l'utilisateur.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    
    setConfirmModal({
      isOpen: true,
      title: user.isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur",
      message: user.isActive
        ? `Êtes-vous sûr de vouloir désactiver ${user.firstName || user.username} ? Il ne pourra plus se connecter.`
        : `Êtes-vous sûr de vouloir réactiver ${user.firstName || user.username} ?`,
      type: user.isActive ? "warning" : "info",
      onConfirm: async () => {
        try {
          await adminService.toggleUserActive(user.id, !user.isActive);
          setUser({ ...user, isActive: !user.isActive });
          setModal({
            isOpen: true,
            type: "success",
            title: "Succès",
            message: `L'utilisateur a été ${user.isActive ? "désactivé" : "activé"} avec succès.`,
          });
        } catch (error) {
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de modifier le statut de l'utilisateur.",
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user || user.role === newRole) return;

    setConfirmModal({
      isOpen: true,
      title: "Changer le rôle",
      message: `Êtes-vous sûr de vouloir changer le rôle de ${user.firstName || user.username} en "${roleLabels[newRole]}" ?`,
      type: "warning",
      onConfirm: async () => {
        try {
          await adminService.updateUserRole(user.id, newRole);
          setUser({ ...user, role: newRole });
          setModal({
            isOpen: true,
            type: "success",
            title: "Succès",
            message: "Le rôle a été modifié avec succès.",
          });
        } catch (error) {
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de modifier le rôle.",
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleDelete = async () => {
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous sûr de vouloir supprimer définitivement ${user.firstName || user.username} ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await adminService.deleteUser(user.id);
          setModal({
            isOpen: true,
            type: "success",
            title: "Succès",
            message: "L'utilisateur a été supprimé avec succès.",
          });
          setTimeout(() => navigate("/admin/users"), 1500);
        } catch (error) {
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de supprimer l'utilisateur.",
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateAge = (dateNaissance?: string) => {
    if (!dateNaissance) return null;
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Utilisateur non trouvé</p>
        <Button onClick={() => navigate("/admin/users")} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  const age = calculateAge(user.dateNaissance);

  return (
    <div>
      <Header
        title="Détails de l'utilisateur"
        subtitle={`Profil complet de ${user.firstName || user.username}`}
      />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>

        {/* User Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.pictureUrl ? (
                  <img
                    src={user.pictureUrl}
                    alt={user.firstName || user.username}
                    className="h-32 w-32 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {(user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username || "Utilisateur"}
                  </h2>
                  <Badge className={roleColors[user.role]}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  {user.isActive ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                  {user.isGoogleLogin && (
                    <Badge variant="outline" className="text-xs">
                      <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">@{user.username}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                  {user.telephone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {user.telephone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Inscrit {formatRelativeDate(user.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant={user.isActive ? "outline" : "default"}
                  size="sm"
                  onClick={handleToggleActive}
                >
                  {user.isActive ? (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold">{user._count?.offres || 0}</p>
              <p className="text-xs text-muted-foreground">Offres publiées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold">{user._count?.retours || 0}</p>
              <p className="text-xs text-muted-foreground">Retours partagés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold">{user._count?.favorites || 0}</p>
              <p className="text-xs text-muted-foreground">Favoris</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold">{user.cv ? "Oui" : "Non"}</p>
              <p className="text-xs text-muted-foreground">CV créé</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prénom</p>
                  <p className="font-medium">{user.firstName || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nom</p>
                  <p className="font-medium">{user.lastName || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sexe</p>
                  <p className="font-medium">{sexeLabels[user.sexe || ""] || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date de naissance</p>
                  <p className="font-medium">
                    {user.dateNaissance ? (
                      <>
                        {formatDate(user.dateNaissance)}
                        {age && <span className="text-muted-foreground ml-1">({age} ans)</span>}
                      </>
                    ) : (
                      "Non renseigné"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
                  <p className="font-medium">{user.telephone || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Statut professionnel</p>
                  <p className="font-medium">{statutLabels[user.statutProfessionnel || ""] || "Non renseigné"}</p>
                </div>
              </div>

              {user.handicap && (
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Situation de handicap</p>
                  <p className="font-medium text-purple-800 dark:text-purple-300">
                    {user.typeHandicap || "Type non précisé"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pays</p>
                  <p className="font-medium flex items-center gap-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {user.pays || "Non renseigné"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Commune</p>
                  <p className="font-medium">{user.commune || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quartier</p>
                  <p className="font-medium">{user.quartier || "Non renseigné"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Adresse complète</p>
                  <p className="font-medium">{user.adresse || "Non renseigné"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestion du rôle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Rôle actuel: <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
              </p>
              <div className="flex flex-wrap gap-2">
                {["MEMBRE", "PARTENAIRE", "ADMIN"].map((role) => (
                  <Button
                    key={role}
                    variant={user.role === role ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChangeRole(role)}
                    disabled={user.role === role}
                  >
                    {roleLabels[role]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID utilisateur</span>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date d'inscription</span>
                <span className="text-sm">{formatDate(user.createdAt)}</span>
              </div>
              {user.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                  <span className="text-sm">{formatDate(user.updatedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Connexion Google</span>
                <span className="text-sm">{user.isGoogleLogin ? "Oui" : "Non"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CV Section */}
        {user.cv && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CV de l'utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.cv.titre && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Titre</p>
                    <p className="font-medium">{user.cv.titre}</p>
                  </div>
                )}
                {user.cv.resume && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Résumé</p>
                    <p className="text-sm">{user.cv.resume}</p>
                  </div>
                )}
                {user.cv.competences && user.cv.competences.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Compétences</p>
                    <div className="flex flex-wrap gap-2">
                      {user.cv.competences.map((comp, i) => (
                        <Badge key={i} variant="outline">{comp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <GraduationCap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{user.cv.formations?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Formations</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Building2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{user.cv.experiences?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Expériences</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Globe className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{user.cv.langues?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Langues</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Retours */}
          {user.retours && user.retours.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Retours récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.retours.map((retour) => (
                    <Link
                      key={retour.id}
                      to={`/retours/${retour.id}`}
                      className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <p className="font-medium text-sm">{retour.titre}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeDate(retour.datePublication)}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Offres (for partners) */}
          {user.offres && user.offres.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Offres publiées récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.offres.map((offre) => (
                    <Link
                      key={offre.id}
                      to={`/admin/offres/${offre.id}`}
                      className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={typeOffreColors[offre.typeOffre]}>
                          {offre.typeOffre}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{offre.titre}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeDate(offre.datePublication)}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}
