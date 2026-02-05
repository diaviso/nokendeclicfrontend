import api from "./api";

export interface OffreFichier {
  id: number;
  nom: string;
  url: string;
  type: string;
  taille: number;
  createdAt: string;
  offreId?: number;
}

const uploadService = {
  async uploadOffreFile(offreId: number, file: File): Promise<OffreFichier> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/upload/offre/${offreId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async uploadMultipleOffreFiles(offreId: number, files: File[]): Promise<OffreFichier[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    const response = await api.post(`/upload/offre/${offreId}/multiple`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getOffreFichiers(offreId: number): Promise<OffreFichier[]> {
    const response = await api.get(`/upload/offre/${offreId}`);
    return response.data;
  },

  async deleteFichier(fichierId: number): Promise<{ message: string }> {
    const response = await api.delete(`/upload/${fichierId}`);
    return response.data;
  },

  async updateFichierName(fichierId: number, nom: string): Promise<OffreFichier> {
    const response = await api.patch(`/upload/${fichierId}`, { nom });
    return response.data;
  },
};

export default uploadService;
