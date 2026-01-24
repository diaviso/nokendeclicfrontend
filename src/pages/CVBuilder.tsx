import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Badge, AlertModal, AILoadingOverlay, UploadLoadingOverlay } from "@/components/ui";
import { cvService } from "@/services";
import type { ExtractedCVData } from "@/services/cvService";
import { useAuth } from "@/contexts/AuthContext";
import type { CV, Experience, Formation } from "@/types";
import {
  Save,
  Plus,
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Languages,
  Award,
  Heart,
  Globe,
  Linkedin,
  Github,
  Phone,
  MapPin,
  X,
  Upload,
  Sparkles,
  Loader2,
} from "lucide-react";

type ModalState = {
  isOpen: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
};

type LoadingState = {
  isVisible: boolean;
  stage: "analyzing" | "correcting" | "finalizing";
};

export function CVBuilder() {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedCvJson, setSavedCvJson] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  
  const [aiLoading, setAiLoading] = useState<LoadingState>({
    isVisible: false,
    stage: "analyzing",
  });

  const [cv, setCV] = useState<Partial<CV>>({
    titreProfessionnel: "",
    telephone: "",
    adresse: "",
    ville: "",
    codePostal: "",
    pays: "Sénégal",
    linkedin: "",
    siteWeb: "",
    github: "",
    resume: "",
    competences: [],
    langues: [],
    certifications: [],
    interets: [],
    estPublic: false,
    experiences: [],
    formations: [],
  });

  const [newCompetence, setNewCompetence] = useState("");
  const [newLangue, setNewLangue] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newInteret, setNewInteret] = useState("");

  useEffect(() => {
    const fetchCV = async () => {
      try {
        const res = await cvService.getMyCV();
        if (res.cv) {
          setCV(res.cv);
          setSavedCvJson(JSON.stringify(res.cv));
        }
      } catch (error) {
        console.error("Error fetching CV:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCV();
  }, []);

  // Track changes
  useEffect(() => {
    if (!loading && savedCvJson) {
      const currentJson = JSON.stringify(cv);
      setHasChanges(currentJson !== savedCvJson);
    }
  }, [cv, savedCvJson, loading]);

  const showModal = (type: ModalState["type"], title: string, message: string) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSave = async () => {
    setSaving(true);
    setAiLoading({ isVisible: true, stage: "analyzing" });

    try {
      // Step 1: Correct CV with AI
      setAiLoading({ isVisible: true, stage: "correcting" });
      const correctionResult = await cvService.correctCV(cv);
      
      let cvToSave = { ...cv };
      
      if (correctionResult.success && correctionResult.data) {
        // Update CV with corrected data (excluding corrections field)
        const { corrections, ...correctedData } = correctionResult.data as any;
        cvToSave = {
          ...cv,
          titreProfessionnel: correctedData.titreProfessionnel || cv.titreProfessionnel,
          resume: correctedData.resume || cv.resume,
          competences: correctedData.competences || cv.competences,
          langues: correctedData.langues || cv.langues,
          certifications: correctedData.certifications || cv.certifications,
          interets: correctedData.interets || cv.interets,
          experiences: correctedData.experiences || cv.experiences,
          formations: correctedData.formations || cv.formations,
        };
        setCV(cvToSave);
      }

      // Step 2: Save the corrected CV (remove any non-CV fields)
      setAiLoading({ isVisible: true, stage: "finalizing" });
      const { id, user, dateCreation, dateModification, ...cvDataToSave } = cvToSave as any;
      await cvService.saveCV(cvDataToSave);
      
      setAiLoading({ isVisible: false, stage: "analyzing" });
      
      const correctionsCount = correctionResult.corrections?.length || 0;
      
      // Update saved state to disable save button
      setSavedCvJson(JSON.stringify(cvToSave));
      setHasChanges(false);
      
      if (correctionsCount > 0) {
        showModal(
          "success",
          "CV optimisé et sauvegardé !",
          `Votre CV a été amélioré avec ${correctionsCount} correction${correctionsCount > 1 ? "s" : ""} et sauvegardé avec succès.`
        );
      } else {
        showModal("success", "CV sauvegardé !", "Votre CV a été sauvegardé avec succès.");
      }
    } catch (error) {
      console.error("Error saving CV:", error);
      setAiLoading({ isVisible: false, stage: "analyzing" });
      showModal("error", "Erreur", "Une erreur est survenue lors de la sauvegarde du CV.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Seuls les fichiers PDF sont acceptés");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const response = await cvService.uploadAndExtractCV(file);
      
      if (response.success && response.extractedData) {
        const extracted: ExtractedCVData = response.extractedData;
        
        // Merge extracted data with current CV
        setCV((prev) => ({
          ...prev,
          titreProfessionnel: extracted.titreProfessionnel || prev.titreProfessionnel,
          telephone: extracted.telephone || prev.telephone,
          adresse: extracted.adresse || prev.adresse,
          ville: extracted.ville || prev.ville,
          codePostal: extracted.codePostal || prev.codePostal,
          pays: extracted.pays || prev.pays,
          linkedin: extracted.linkedin || prev.linkedin,
          siteWeb: extracted.siteWeb || prev.siteWeb,
          github: extracted.github || prev.github,
          resume: extracted.resume || prev.resume,
          competences: extracted.competences?.length ? extracted.competences : prev.competences,
          langues: extracted.langues?.length ? extracted.langues : prev.langues,
          certifications: extracted.certifications?.length ? extracted.certifications : prev.certifications,
          interets: extracted.interets?.length ? extracted.interets : prev.interets,
          experiences: extracted.experiences?.length ? extracted.experiences : prev.experiences,
          formations: extracted.formations?.length ? extracted.formations : prev.formations,
        }));

        setHasChanges(true);
        showModal("success", "CV analysé !", "Les informations ont été extraites et remplies automatiquement.");
      }
    } catch (error: any) {
      console.error("Error uploading CV:", error);
      setUploadError(error.response?.data?.message || "Erreur lors de l'analyse du CV");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addExperience = () => {
    setCV((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences || []),
        {
          poste: "",
          entreprise: "",
          ville: "",
          dateDebut: "",
          dateFin: "",
          enCours: false,
          description: "",
        },
      ],
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    setCV((prev) => ({
      ...prev,
      experiences: prev.experiences?.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setCV((prev) => ({
      ...prev,
      experiences: prev.experiences?.filter((_, i) => i !== index),
    }));
  };

  const addFormation = () => {
    setCV((prev) => ({
      ...prev,
      formations: [
        ...(prev.formations || []),
        {
          diplome: "",
          etablissement: "",
          ville: "",
          dateDebut: "",
          dateFin: "",
          enCours: false,
          description: "",
        },
      ],
    }));
  };

  const updateFormation = (index: number, field: keyof Formation, value: string | boolean) => {
    setCV((prev) => ({
      ...prev,
      formations: prev.formations?.map((form, i) =>
        i === index ? { ...form, [field]: value } : form
      ),
    }));
  };

  const removeFormation = (index: number) => {
    setCV((prev) => ({
      ...prev,
      formations: prev.formations?.filter((_, i) => i !== index),
    }));
  };

  const addToArray = (field: "competences" | "langues" | "certifications" | "interets", value: string) => {
    if (!value.trim()) return;
    setCV((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
  };

  const removeFromArray = (field: "competences" | "langues" | "certifications" | "interets", index: number) => {
    setCV((prev) => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div>
        <Header title="Mon CV" subtitle="Construisez votre CV professionnel" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Mon CV" subtitle="Construisez votre CV professionnel" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Upload CV Section */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5 dark:bg-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Remplissage automatique par IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Uploadez votre CV en PDF et laissez l'IA extraire automatiquement vos informations
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cv-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Uploader mon CV (PDF)
                    </>
                  )}
                </Button>
                {uploadError && (
                  <p className="text-sm text-red-500">{uploadError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="public"
              checked={cv.estPublic}
              onChange={(e) => setCV((prev) => ({ ...prev, estPublic: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="public" className="text-sm text-gray-700 dark:text-gray-300">
              Rendre mon CV public (visible par les recruteurs)
            </label>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Titre professionnel</label>
              <Input
                placeholder="Ex: Développeur Full Stack, Chef de projet, etc."
                value={cv.titreProfessionnel || ""}
                onChange={(e) => setCV((prev) => ({ ...prev, titreProfessionnel: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Résumé professionnel</label>
              <Textarea
                placeholder="Décrivez brièvement votre parcours et vos objectifs..."
                value={cv.resume || ""}
                onChange={(e) => setCV((prev) => ({ ...prev, resume: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Téléphone
                </label>
                <Input
                  placeholder="+221 77 123 45 67"
                  value={cv.telephone || ""}
                  onChange={(e) => setCV((prev) => ({ ...prev, telephone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Ville
                </label>
                <Input
                  placeholder="Dakar"
                  value={cv.ville || ""}
                  onChange={(e) => setCV((prev) => ({ ...prev, ville: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Linkedin className="h-4 w-4 inline mr-1" />
                  LinkedIn
                </label>
                <Input
                  placeholder="linkedin.com/in/..."
                  value={cv.linkedin || ""}
                  onChange={(e) => setCV((prev) => ({ ...prev, linkedin: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Github className="h-4 w-4 inline mr-1" />
                  GitHub
                </label>
                <Input
                  placeholder="github.com/..."
                  value={cv.github || ""}
                  onChange={(e) => setCV((prev) => ({ ...prev, github: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Site web
                </label>
                <Input
                  placeholder="https://..."
                  value={cv.siteWeb || ""}
                  onChange={(e) => setCV((prev) => ({ ...prev, siteWeb: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Expériences professionnelles
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addExperience}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {cv.experiences?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune expérience ajoutée. Cliquez sur "Ajouter" pour commencer.
              </p>
            ) : (
              cv.experiences?.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Expérience {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeExperience(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Poste"
                      value={exp.poste}
                      onChange={(e) => updateExperience(index, "poste", e.target.value)}
                    />
                    <Input
                      placeholder="Entreprise"
                      value={exp.entreprise}
                      onChange={(e) => updateExperience(index, "entreprise", e.target.value)}
                    />
                    <Input
                      placeholder="Ville"
                      value={exp.ville || ""}
                      onChange={(e) => updateExperience(index, "ville", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="Début"
                        value={exp.dateDebut}
                        onChange={(e) => updateExperience(index, "dateDebut", e.target.value)}
                      />
                      <Input
                        type="date"
                        placeholder="Fin"
                        value={exp.dateFin || ""}
                        onChange={(e) => updateExperience(index, "dateFin", e.target.value)}
                        disabled={exp.enCours}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exp.enCours}
                      onChange={(e) => updateExperience(index, "enCours", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm">Poste actuel</label>
                  </div>
                  <Textarea
                    placeholder="Description des missions..."
                    value={exp.description || ""}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    rows={3}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Formations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Formations
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addFormation}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {cv.formations?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune formation ajoutée. Cliquez sur "Ajouter" pour commencer.
              </p>
            ) : (
              cv.formations?.map((form, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Formation {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFormation(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Diplôme"
                      value={form.diplome}
                      onChange={(e) => updateFormation(index, "diplome", e.target.value)}
                    />
                    <Input
                      placeholder="Établissement"
                      value={form.etablissement}
                      onChange={(e) => updateFormation(index, "etablissement", e.target.value)}
                    />
                    <Input
                      placeholder="Ville"
                      value={form.ville || ""}
                      onChange={(e) => updateFormation(index, "ville", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={form.dateDebut}
                        onChange={(e) => updateFormation(index, "dateDebut", e.target.value)}
                      />
                      <Input
                        type="date"
                        value={form.dateFin || ""}
                        onChange={(e) => updateFormation(index, "dateFin", e.target.value)}
                        disabled={form.enCours}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.enCours}
                      onChange={(e) => updateFormation(index, "enCours", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm">En cours</label>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Compétences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ajouter une compétence..."
                value={newCompetence}
                onChange={(e) => setNewCompetence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray("competences", newCompetence);
                    setNewCompetence("");
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  addToArray("competences", newCompetence);
                  setNewCompetence("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cv.competences?.map((comp, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                  {comp}
                  <button
                    onClick={() => removeFromArray("competences", index)}
                    className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Langues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ex: Français (natif), Anglais (courant)..."
                value={newLangue}
                onChange={(e) => setNewLangue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray("langues", newLangue);
                    setNewLangue("");
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  addToArray("langues", newLangue);
                  setNewLangue("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cv.langues?.map((langue, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                  {langue}
                  <button
                    onClick={() => removeFromArray("langues", index)}
                    className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ex: AWS Certified, Google Analytics..."
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray("certifications", newCertification);
                    setNewCertification("");
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  addToArray("certifications", newCertification);
                  setNewCertification("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cv.certifications?.map((cert, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                  {cert}
                  <button
                    onClick={() => removeFromArray("certifications", index)}
                    className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Centres d'intérêt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ex: Lecture, Sport, Voyages..."
                value={newInteret}
                onChange={(e) => setNewInteret(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray("interets", newInteret);
                    setNewInteret("");
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  addToArray("interets", newInteret);
                  setNewInteret("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cv.interets?.map((interet, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                  {interet}
                  <button
                    onClick={() => removeFromArray("interets", index)}
                    className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde en cours..." : hasChanges ? "Sauvegarder mon CV" : "Aucune modification"}
          </Button>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* AI Loading Overlay */}
      <AILoadingOverlay isVisible={aiLoading.isVisible} stage={aiLoading.stage} />

      {/* Upload Loading Overlay */}
      <UploadLoadingOverlay isVisible={uploading} />
    </div>
  );
}
