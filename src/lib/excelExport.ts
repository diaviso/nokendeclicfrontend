import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  // Transform data to match column headers
  const exportData = data.map((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      const keys = col.key.split(".");
      let value: unknown = item;
      for (const key of keys) {
        value = (value as Record<string, unknown>)?.[key];
      }
      row[col.header] = value ?? "";
    });
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  worksheet["!cols"] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Generate filename with date
  const date = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${date}.xlsx`;

  // Download
  XLSX.writeFile(workbook, fullFilename);
}

// Export users to Excel
export function exportUsersToExcel(users: Array<{
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  statutProfessionnel?: string;
  createdAt: string;
  _count?: { retours: number; offres: number };
}>): void {
  const columns: ExportColumn[] = [
    { header: "ID", key: "id", width: 8 },
    { header: "Email", key: "email", width: 30 },
    { header: "Nom d'utilisateur", key: "username", width: 20 },
    { header: "Prenom", key: "firstName", width: 15 },
    { header: "Nom", key: "lastName", width: 15 },
    { header: "Role", key: "role", width: 12 },
    { header: "Statut Pro", key: "statutProfessionnel", width: 15 },
    { header: "Actif", key: "isActive", width: 8 },
    { header: "Date inscription", key: "createdAt", width: 20 },
    { header: "Nb Retours", key: "_count.retours", width: 12 },
    { header: "Nb Offres", key: "_count.offres", width: 12 },
  ];

  const formattedUsers = users.map((user) => ({
    ...user,
    isActive: user.isActive ? "Oui" : "Non",
    createdAt: new Date(user.createdAt).toLocaleDateString("fr-FR"),
    role: user.role === "ADMIN" ? "Admin" : user.role === "PARTENAIRE" ? "Partenaire" : "Membre",
  }));

  exportToExcel(formattedUsers as unknown as Record<string, unknown>[], columns, "utilisateurs_noken");
}

// Export offers to Excel
export function exportOffresToExcel(offres: Array<{
  id: number;
  titre: string;
  description: string;
  typeOffre: string;
  typeEmploi?: string;
  localisation?: string;
  entreprise?: string;
  datePublication: string;
  dateLimite?: string;
  viewCount: number;
  estCloturee?: boolean;
  auteur?: { username: string; email: string };
  _count?: { retours: number };
}>): void {
  const columns: ExportColumn[] = [
    { header: "ID", key: "id", width: 8 },
    { header: "Titre", key: "titre", width: 40 },
    { header: "Type", key: "typeOffre", width: 15 },
    { header: "Type Emploi", key: "typeEmploi", width: 15 },
    { header: "Entreprise", key: "entreprise", width: 25 },
    { header: "Localisation", key: "localisation", width: 20 },
    { header: "Date Publication", key: "datePublication", width: 15 },
    { header: "Date Limite", key: "dateLimite", width: 15 },
    { header: "Vues", key: "viewCount", width: 10 },
    { header: "Cloturee", key: "estCloturee", width: 10 },
    { header: "Nb Retours", key: "_count.retours", width: 12 },
    { header: "Auteur", key: "auteur.username", width: 20 },
  ];

  const typeLabels: Record<string, string> = {
    EMPLOI: "Emploi",
    FORMATION: "Formation",
    BOURSE: "Bourse",
    VOLONTARIAT: "Volontariat",
    PROGRAMME: "Programme",
  };

  const formattedOffres = offres.map((offre) => ({
    ...offre,
    typeOffre: typeLabels[offre.typeOffre] || offre.typeOffre,
    datePublication: new Date(offre.datePublication).toLocaleDateString("fr-FR"),
    dateLimite: offre.dateLimite ? new Date(offre.dateLimite).toLocaleDateString("fr-FR") : "",
    estCloturee: offre.estCloturee ? "Oui" : "Non",
  }));

  exportToExcel(formattedOffres as unknown as Record<string, unknown>[], columns, "offres_noken");
}
