import api from "./api";
import type { CV } from "@/types";

export interface ExtractedCVData {
  titreProfessionnel?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  linkedin?: string;
  siteWeb?: string;
  github?: string;
  resume?: string;
  competences: string[];
  langues: string[];
  certifications: string[];
  interets: string[];
  experiences: {
    poste: string;
    entreprise: string;
    ville?: string;
    dateDebut: string;
    dateFin?: string;
    enCours: boolean;
    description?: string;
  }[];
  formations: {
    diplome: string;
    etablissement: string;
    ville?: string;
    dateDebut: string;
    dateFin?: string;
    enCours: boolean;
    description?: string;
  }[];
}

export interface UploadCVResponse {
  success: boolean;
  message: string;
  extractedData: ExtractedCVData;
  filePath: string;
}

export const cvService = {
  async getMyCV(): Promise<{ hasCV: boolean; cv: CV | null }> {
    const { data } = await api.get<{ hasCV: boolean; cv: CV | null }>("/api/cv/me");
    return data;
  },

  async saveCV(cv: Partial<CV>): Promise<CV> {
    const { data } = await api.post<CV>("/api/cv/me", cv);
    return data;
  },

  async deleteCV(): Promise<void> {
    await api.delete("/api/cv/me");
  },

  async getPublicCVs(): Promise<CV[]> {
    const { data } = await api.get<CV[]>("/api/cv/public");
    return data;
  },

  async getPublicCV(userId: number): Promise<CV> {
    const { data } = await api.get<CV>(`/api/cv/user/${userId}`);
    return data;
  },

  async uploadAndExtractCV(file: File): Promise<UploadCVResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<UploadCVResponse>("/api/cv/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  async uploadExtractAndSaveCV(file: File): Promise<{ success: boolean; message: string; cv: CV }> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<{ success: boolean; message: string; cv: CV }>(
      "/api/cv/upload-and-save",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  async correctCV(cvData: Partial<CV>): Promise<{
    success: boolean;
    data: Partial<CV>;
    corrections: Array<{
      field: string;
      original: string;
      corrected: string;
      reason: string;
    }>;
  }> {
    const { data } = await api.post("/api/cv/correct", cvData);
    return data;
  },
};

export default cvService;
