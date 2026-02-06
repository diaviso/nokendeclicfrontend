import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, AlertModal } from "@/components/ui";
import { offresService, uploadService } from "@/services";
import type { OffreFichier } from "@/services/uploadService";
import {
  Save,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Award,
  HandHeart,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Globe,
  Loader2,
  Upload,
  Trash2,
  File,
  X,
  Edit2,
  Check,
} from "lucide-react";

type ModalState = {
  isOpen: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
};

const typeOffreOptions = [
  { value: "EMPLOI", label: "Emploi", icon: Briefcase },
  { value: "FORMATION", label: "Formation", icon: GraduationCap },
  { value: "BOURSE", label: "Bourse", icon: Award },
  { value: "VOLONTARIAT", label: "Volontariat", icon: HandHeart },
];

const typeEmploiOptions = [
  { value: "CDI", label: "CDI" },
  { value: "CDD", label: "CDD" },
  { value: "STAGE", label: "Stage" },
  { value: "ALTERNANCE", label: "Alternance" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERIM", label: "Intérim" },
];

const secteurOptions = [
  "INFORMATIQUE",
  "FINANCE",
  "MARKETING",
  "COMMERCE",
  "INDUSTRIE",
  "SANTE",
  "EDUCATION",
  "BTP",
  "TRANSPORT",
  "AGRICULTURE",
  "TOURISME",
  "AUTRE",
];

const niveauExperienceOptions = [
  { value: "DEBUTANT", label: "Débutant (0-2 ans)" },
  { value: "JUNIOR", label: "Junior (2-5 ans)" },
  { value: "CONFIRME", label: "Confirmé (5-10 ans)" },
  { value: "SENIOR", label: "Senior (10+ ans)" },
];

export function AdminOffreForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    typeOffre: "EMPLOI",
    typeEmploi: "",
    secteur: "",
    niveauExperience: "",
    localisation: "",
    entreprise: "",
    url: "",
    dateLimite: "",
    salaireMin: "",
    salaireMax: "",
    devise: "FCFA",
    tags: [] as string[],
    // Formation specific
    organisme: "",
    dureeFormation: "",
    certification: "",
    // Bourse specific
    paysBourse: "",
    niveauEtude: "",
    montantBourse: "",
    estRemboursable: false,
    // Volontariat specific
    typeVolontariat: "",
    dureeVolontariat: "",
    hebergement: false,
    indemnite: "",
    competencesRequises: "",
  });

  const [newTag, setNewTag] = useState("");
  const [fichiers, setFichiers] = useState<OffreFichier[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && id) {
      const fetchOffre = async () => {
        try {
          const offre = await offresService.getById(parseInt(id));
          setFormData({
            titre: offre.titre || "",
            description: offre.description || "",
            typeOffre: offre.typeOffre || "EMPLOI",
            typeEmploi: offre.typeEmploi || "",
            secteur: offre.secteur || "",
            niveauExperience: offre.niveauExperience || "",
            localisation: offre.localisation || "",
            entreprise: offre.entreprise || "",
            url: offre.url || "",
            dateLimite: offre.dateLimite ? offre.dateLimite.split("T")[0] : "",
            salaireMin: offre.salaireMin?.toString() || "",
            salaireMax: offre.salaireMax?.toString() || "",
            devise: offre.devise || "FCFA",
            tags: offre.tags || [],
            organisme: offre.organisme || "",
            dureeFormation: offre.dureeFormation?.toString() || "",
            certification: offre.certification || "",
            paysBourse: offre.paysBourse || "",
            niveauEtude: offre.niveauEtude || "",
            montantBourse: offre.montantBourse?.toString() || "",
            estRemboursable: offre.estRemboursable || false,
            typeVolontariat: offre.typeVolontariat || "",
            dureeVolontariat: offre.dureeVolontariat?.toString() || "",
            hebergement: offre.hebergement || false,
            indemnite: offre.indemnite?.toString() || "",
            competencesRequises: offre.competencesRequises || "",
          });
          if (offre.fichiers) {
            setFichiers(offre.fichiers);
          }
        } catch (error) {
          console.error("Error fetching offre:", error);
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de charger l'offre.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchOffre();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titre || !formData.description) {
      setModal({
        isOpen: true,
        type: "warning",
        title: "Champs requis",
        message: "Le titre et la description sont obligatoires.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        titre: formData.titre,
        description: formData.description,
        typeOffre: formData.typeOffre,
        localisation: formData.localisation || undefined,
        entreprise: formData.entreprise || undefined,
        url: formData.url || undefined,
        tags: formData.tags,
      };

      if (formData.dateLimite) {
        payload.dateLimite = new Date(formData.dateLimite).toISOString();
      }

      if (formData.typeOffre === "EMPLOI") {
        payload.typeEmploi = formData.typeEmploi || undefined;
        payload.secteur = formData.secteur || undefined;
        payload.niveauExperience = formData.niveauExperience || undefined;
        if (formData.salaireMin) payload.salaireMin = parseFloat(formData.salaireMin);
        if (formData.salaireMax) payload.salaireMax = parseFloat(formData.salaireMax);
        payload.devise = formData.devise;
      } else if (formData.typeOffre === "FORMATION") {
        payload.organisme = formData.organisme || undefined;
        if (formData.dureeFormation) payload.dureeFormation = parseInt(formData.dureeFormation);
        payload.certification = formData.certification || undefined;
      } else if (formData.typeOffre === "BOURSE") {
        payload.paysBourse = formData.paysBourse || undefined;
        payload.niveauEtude = formData.niveauEtude || undefined;
        if (formData.montantBourse) payload.montantBourse = parseFloat(formData.montantBourse);
        payload.estRemboursable = formData.estRemboursable;
      } else if (formData.typeOffre === "VOLONTARIAT") {
        payload.typeVolontariat = formData.typeVolontariat || undefined;
        if (formData.dureeVolontariat) payload.dureeVolontariat = parseInt(formData.dureeVolontariat);
        payload.hebergement = formData.hebergement;
        if (formData.indemnite) payload.indemnite = parseFloat(formData.indemnite);
        payload.competencesRequises = formData.competencesRequises || undefined;
      }

      if (isEditing && id) {
        await offresService.update(parseInt(id), payload);
        setModal({
          isOpen: true,
          type: "success",
          title: "Offre modifiée",
          message: "L'offre a été mise à jour avec succès.",
        });
      } else {
        const newOffre = await offresService.create(payload);
        setModal({
          isOpen: true,
          type: "success",
          title: "Offre créée",
          message: "L'offre a été créée avec succès. Vous allez être redirigé vers la page de modification pour ajouter des fichiers.",
        });
        // Redirect to edit page so user can add files
        setTimeout(() => navigate(`/admin/offres/${newOffre.id}/edit`), 2000);
        return;
      }

      setTimeout(() => navigate("/admin/offres"), 1500);
    } catch (error: any) {
      console.error("Error saving offre:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: error.response?.data?.message || "Une erreur est survenue.",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    setUploadingFiles(true);
    try {
      const uploadedFiles = await uploadService.uploadMultipleOffreFiles(
        parseInt(id),
        Array.from(files)
      );
      setFichiers((prev) => [...uploadedFiles, ...prev]);
      setModal({
        isOpen: true,
        type: "success",
        title: "Fichiers uploadés",
        message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès.`,
      });
    } catch (error: any) {
      console.error("Error uploading files:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur d'upload",
        message: error.response?.data?.message || "Impossible d'uploader les fichiers.",
      });
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (fichierId: number) => {
    try {
      await uploadService.deleteFichier(fichierId);
      setFichiers((prev) => prev.filter((f) => f.id !== fichierId));
      setModal({
        isOpen: true,
        type: "success",
        title: "Fichier supprimé",
        message: "Le fichier a été supprimé avec succès.",
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: error.response?.data?.message || "Impossible de supprimer le fichier.",
      });
    }
  };

  const handleUpdateFileName = async (fichierId: number) => {
    if (!editingFileName.trim()) return;
    try {
      const updated = await uploadService.updateFichierName(fichierId, editingFileName.trim());
      setFichiers((prev) => prev.map((f) => (f.id === fichierId ? updated : f)));
      setEditingFileId(null);
      setEditingFileName("");
    } catch (error: any) {
      console.error("Error updating file name:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: error.response?.data?.message || "Impossible de renommer le fichier.",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageFile = (type: string) => type.startsWith("image/");

  if (loading) {
    return (
      <div>
        <Header title="Chargement..." />
        <div className="p-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={isEditing ? "Modifier l'offre" : "Nouvelle offre"}
        subtitle={isEditing ? "Modifiez les informations de l'offre" : "Créez une nouvelle offre"}
      />

      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/offres")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type d'offre */}
          <Card>
            <CardHeader>
              <CardTitle>Type d'offre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {typeOffreOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.typeOffre === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, typeOffre: option.value }))}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-8 w-8" />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titre *</label>
                <Input
                  value={formData.titre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, titre: e.target.value }))}
                  placeholder="Ex: Développeur Full Stack React/Node.js"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez l'offre en détail..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Entreprise / Organisation
                  </label>
                  <Input
                    value={formData.entreprise}
                    onChange={(e) => setFormData((prev) => ({ ...prev, entreprise: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Localisation
                  </label>
                  <Input
                    value={formData.localisation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, localisation: e.target.value }))}
                    placeholder="Ex: Dakar, Sénégal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    URL externe
                  </label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date limite
                  </label>
                  <Input
                    value={formData.dateLimite}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateLimite: e.target.value }))}
                    type="date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Champs spécifiques Emploi */}
          {formData.typeOffre === "EMPLOI" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Détails de l'emploi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type de contrat</label>
                    <select
                      value={formData.typeEmploi}
                      onChange={(e) => setFormData((prev) => ({ ...prev, typeEmploi: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Sélectionner...</option>
                      {typeEmploiOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Secteur</label>
                    <select
                      value={formData.secteur}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secteur: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Sélectionner...</option>
                      {secteurOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Niveau d'expérience</label>
                    <select
                      value={formData.niveauExperience}
                      onChange={(e) => setFormData((prev) => ({ ...prev, niveauExperience: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Sélectionner...</option>
                      {niveauExperienceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Salaire min
                    </label>
                    <Input
                      value={formData.salaireMin}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salaireMin: e.target.value }))}
                      type="number"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Salaire max</label>
                    <Input
                      value={formData.salaireMax}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salaireMax: e.target.value }))}
                      type="number"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Devise</label>
                    <select
                      value={formData.devise}
                      onChange={(e) => setFormData((prev) => ({ ...prev, devise: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="FCFA">FCFA</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Champs spécifiques Formation */}
          {formData.typeOffre === "FORMATION" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Détails de la formation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Organisme</label>
                    <Input
                      value={formData.organisme}
                      onChange={(e) => setFormData((prev) => ({ ...prev, organisme: e.target.value }))}
                      placeholder="Nom de l'organisme de formation"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Durée (en jours)</label>
                    <Input
                      value={formData.dureeFormation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dureeFormation: e.target.value }))}
                      type="number"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Certification</label>
                  <Input
                    value={formData.certification}
                    onChange={(e) => setFormData((prev) => ({ ...prev, certification: e.target.value }))}
                    placeholder="Certification obtenue à l'issue de la formation"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Champs spécifiques Bourse */}
          {formData.typeOffre === "BOURSE" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Détails de la bourse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Pays de destination</label>
                    <Input
                      value={formData.paysBourse}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paysBourse: e.target.value }))}
                      placeholder="Ex: France, Canada..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Niveau d'étude requis</label>
                    <Input
                      value={formData.niveauEtude}
                      onChange={(e) => setFormData((prev) => ({ ...prev, niveauEtude: e.target.value }))}
                      placeholder="Ex: Licence, Master..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Montant de la bourse</label>
                    <Input
                      value={formData.montantBourse}
                      onChange={(e) => setFormData((prev) => ({ ...prev, montantBourse: e.target.value }))}
                      type="number"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="estRemboursable"
                      checked={formData.estRemboursable}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estRemboursable: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="estRemboursable" className="text-sm">
                      Bourse remboursable
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Champs spécifiques Volontariat */}
          {formData.typeOffre === "VOLONTARIAT" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandHeart className="h-5 w-5" />
                  Détails du volontariat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type de volontariat</label>
                    <select
                      value={formData.typeVolontariat}
                      onChange={(e) => setFormData((prev) => ({ ...prev, typeVolontariat: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="SERVICE_CIVIQUE">Service civique</option>
                      <option value="VOLONTARIAT_INTERNATIONAL">Volontariat international</option>
                      <option value="BENEVOLAT">Bénévolat</option>
                      <option value="MISSION_HUMANITAIRE">Mission humanitaire</option>
                      <option value="VOLONTARIAT_ASSOCIATIF">Volontariat associatif</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Durée (en mois)</label>
                    <Input
                      value={formData.dureeVolontariat}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dureeVolontariat: e.target.value }))}
                      type="number"
                      placeholder="6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Indemnité mensuelle</label>
                    <Input
                      value={formData.indemnite}
                      onChange={(e) => setFormData((prev) => ({ ...prev, indemnite: e.target.value }))}
                      type="number"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="hebergement"
                      checked={formData.hebergement}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hebergement: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="hebergement" className="text-sm">
                      Hébergement fourni
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Compétences requises</label>
                  <Textarea
                    value={formData.competencesRequises}
                    onChange={(e) => setFormData((prev) => ({ ...prev, competencesRequises: e.target.value }))}
                    placeholder="Décrivez les compétences ou qualités recherchées..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fichiers - Show info when creating, upload zone when editing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Fichiers joints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                  <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Vous pourrez ajouter des fichiers (images, PDF, documents) après la création de l'offre.
                  </p>
                </div>
              ) : (
                <>
                  {/* Upload zone */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-10 w-10 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadingFiles ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Upload en cours...
                        </span>
                      ) : (
                        <>
                          <span className="text-primary font-medium">Cliquez pour uploader</span>
                          {" "}ou glissez-déposez
                        </>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      Images, PDF, Word, Excel, PowerPoint, texte - Max 10MB
                    </span>
                  </label>
                </div>

                {/* Files list */}
                {fichiers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {fichiers.length} fichier(s) joint(s)
                    </p>
                    <div className="grid gap-3">
                      {fichiers.map((fichier) => (
                        <div
                          key={fichier.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                        >
                          {/* Preview or icon */}
                          {isImageFile(fichier.type) ? (
                            <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={fichier.url}
                                alt={fichier.nom}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                              <File className="h-6 w-6 text-red-500" />
                            </div>
                          )}

                          {/* File info */}
                          <div className="flex-1 min-w-0">
                            {editingFileId === fichier.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingFileName}
                                  onChange={(e) => setEditingFileName(e.target.value)}
                                  className="h-8 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateFileName(fichier.id);
                                    } else if (e.key === "Escape") {
                                      setEditingFileId(null);
                                      setEditingFileName("");
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFileName(fichier.id)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFileId(null);
                                    setEditingFileName("");
                                  }}
                                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium truncate">{fichier.nom}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(fichier.taille)} • {fichier.type.split("/")[1]?.toUpperCase()}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          {editingFileId !== fichier.id && (
                            <div className="flex items-center gap-1">
                              <a
                                href={fichier.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded"
                                title="Voir"
                              >
                                <Globe className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFileId(fichier.id);
                                  setEditingFileName(fichier.nom);
                                }}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Renommer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(fichier.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/offres")}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Mettre à jour" : "Créer l'offre"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
