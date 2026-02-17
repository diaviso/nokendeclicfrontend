import { jsPDF } from "jspdf";
import type { CV, Experience, Formation } from "@/types";

interface UserInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  pictureUrl?: string;
}

const COLORS = {
  primary: [59, 130, 246] as [number, number, number], // Blue-500
  secondary: [100, 116, 139] as [number, number, number], // Slate-500
  accent: [16, 185, 129] as [number, number, number], // Emerald-500
  dark: [30, 41, 59] as [number, number, number], // Slate-800
  light: [248, 250, 252] as [number, number, number], // Slate-50
  white: [255, 255, 255] as [number, number, number],
  text: [51, 65, 85] as [number, number, number], // Slate-700
  muted: [148, 163, 184] as [number, number, number], // Slate-400
};

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export async function generateCVPdf(cv: CV, user: UserInfo): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const sidebarWidth = 65;
  const mainWidth = contentWidth - sidebarWidth - 10;

  let yPos = margin;

  // Draw sidebar background
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, sidebarWidth + margin, pageHeight, "F");

  // Profile section in sidebar
  yPos = 25;

  // Profile circle placeholder
  doc.setFillColor(...COLORS.primary);
  doc.circle(margin + sidebarWidth / 2, yPos + 20, 18, "F");
  
  // Initials in circle
  const initials = `${(user.firstName?.[0] || "").toUpperCase()}${(user.lastName?.[0] || "").toUpperCase()}`;
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(initials, margin + sidebarWidth / 2, yPos + 25, { align: "center" });

  yPos += 50;

  // Name in sidebar
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Votre Nom";
  const nameLines = doc.splitTextToSize(fullName, sidebarWidth - 10);
  doc.text(nameLines, margin + sidebarWidth / 2, yPos, { align: "center" });
  yPos += nameLines.length * 6 + 5;

  // Title
  if (cv.titreProfessionnel) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.primary);
    const titleLines = doc.splitTextToSize(cv.titreProfessionnel, sidebarWidth - 10);
    doc.text(titleLines, margin + sidebarWidth / 2, yPos, { align: "center" });
    yPos += titleLines.length * 5 + 10;
  }

  // Contact section
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin - 5, yPos, sidebarWidth + 5, 0.5, "F");
  yPos += 8;

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONTACT", margin + 5, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);

  if (user.email) {
    doc.text("✉", margin + 5, yPos);
    const emailLines = doc.splitTextToSize(user.email, sidebarWidth - 20);
    doc.text(emailLines, margin + 12, yPos);
    yPos += emailLines.length * 4 + 4;
  }

  if (cv.telephone) {
    doc.text("☎", margin + 5, yPos);
    doc.text(cv.telephone, margin + 12, yPos);
    yPos += 8;
  }

  if (cv.ville || cv.pays) {
    doc.text("📍", margin + 5, yPos);
    doc.text(`${cv.ville || ""}${cv.ville && cv.pays ? ", " : ""}${cv.pays || ""}`, margin + 12, yPos);
    yPos += 8;
  }

  if (cv.linkedin) {
    doc.text("in", margin + 5, yPos);
    const linkedinLines = doc.splitTextToSize(cv.linkedin, sidebarWidth - 20);
    doc.text(linkedinLines, margin + 12, yPos);
    yPos += linkedinLines.length * 4 + 4;
  }

  if (cv.github) {
    doc.text("⌨", margin + 5, yPos);
    const githubLines = doc.splitTextToSize(cv.github, sidebarWidth - 20);
    doc.text(githubLines, margin + 12, yPos);
    yPos += githubLines.length * 4 + 4;
  }

  yPos += 5;

  // Skills section
  if (cv.competences && cv.competences.length > 0) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin - 5, yPos, sidebarWidth + 5, 0.5, "F");
    yPos += 8;

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("COMPÉTENCES", margin + 5, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);

    cv.competences.forEach((comp) => {
      if (yPos > pageHeight - 30) return;
      doc.text("•", margin + 5, yPos);
      const compLines = doc.splitTextToSize(comp, sidebarWidth - 15);
      doc.text(compLines, margin + 10, yPos);
      yPos += compLines.length * 4 + 2;
    });

    yPos += 5;
  }

  // Languages section
  if (cv.langues && cv.langues.length > 0) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin - 5, yPos, sidebarWidth + 5, 0.5, "F");
    yPos += 8;

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("LANGUES", margin + 5, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);

    cv.langues.forEach((langue) => {
      if (yPos > pageHeight - 30) return;
      doc.text("•", margin + 5, yPos);
      doc.text(langue, margin + 10, yPos);
      yPos += 6;
    });

    yPos += 5;
  }

  // Certifications section
  if (cv.certifications && cv.certifications.length > 0) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin - 5, yPos, sidebarWidth + 5, 0.5, "F");
    yPos += 8;

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATIONS", margin + 5, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);

    cv.certifications.forEach((cert) => {
      if (yPos > pageHeight - 30) return;
      doc.text("•", margin + 5, yPos);
      const certLines = doc.splitTextToSize(cert, sidebarWidth - 15);
      doc.text(certLines, margin + 10, yPos);
      yPos += certLines.length * 4 + 2;
    });
  }

  // Main content area
  const mainX = sidebarWidth + margin + 10;
  let mainY = 25;

  // Resume/Summary section
  if (cv.resume) {
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PROFIL", mainX, mainY);
    
    // Underline
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(mainX, mainY + 2, mainX + 25, mainY + 2);
    mainY += 10;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const resumeLines = doc.splitTextToSize(cv.resume, mainWidth);
    doc.text(resumeLines, mainX, mainY);
    mainY += resumeLines.length * 5 + 10;
  }

  // Experience section
  if (cv.experiences && cv.experiences.length > 0) {
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EXPÉRIENCE PROFESSIONNELLE", mainX, mainY);
    
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(mainX, mainY + 2, mainX + 70, mainY + 2);
    mainY += 10;

    cv.experiences.forEach((exp: Experience) => {
      if (mainY > pageHeight - 40) {
        doc.addPage();
        mainY = 25;
      }

      // Job title
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(exp.poste, mainX, mainY);
      mainY += 5;

      // Company and location
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${exp.entreprise}${exp.ville ? ` • ${exp.ville}` : ""}`, mainX, mainY);
      mainY += 5;

      // Dates
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(9);
      const dateText = `${formatDate(exp.dateDebut)} - ${exp.enCours ? "Présent" : formatDate(exp.dateFin)}`;
      doc.text(dateText, mainX, mainY);
      mainY += 6;

      // Description
      if (exp.description) {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(exp.description, mainWidth);
        doc.text(descLines, mainX, mainY);
        mainY += descLines.length * 4 + 4;
      }

      mainY += 5;
    });
  }

  // Education section
  if (cv.formations && cv.formations.length > 0) {
    if (mainY > pageHeight - 60) {
      doc.addPage();
      mainY = 25;
    }

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATION", mainX, mainY);
    
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(mainX, mainY + 2, mainX + 35, mainY + 2);
    mainY += 10;

    cv.formations.forEach((form: Formation) => {
      if (mainY > pageHeight - 40) {
        doc.addPage();
        mainY = 25;
      }

      // Degree
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const diplomeLines = doc.splitTextToSize(form.diplome, mainWidth);
      doc.text(diplomeLines, mainX, mainY);
      mainY += diplomeLines.length * 5;

      // School
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${form.etablissement}${form.ville ? ` • ${form.ville}` : ""}`, mainX, mainY);
      mainY += 5;

      // Dates
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(9);
      const dateText = `${formatDate(form.dateDebut)} - ${form.enCours ? "Présent" : formatDate(form.dateFin)}`;
      doc.text(dateText, mainX, mainY);
      mainY += 6;

      // Description
      if (form.description) {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(form.description, mainWidth);
        doc.text(descLines, mainX, mainY);
        mainY += descLines.length * 4 + 4;
      }

      mainY += 5;
    });
  }

  // Interests section
  if (cv.interets && cv.interets.length > 0) {
    if (mainY > pageHeight - 40) {
      doc.addPage();
      mainY = 25;
    }

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CENTRES D'INTÉRÊT", mainX, mainY);
    
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(mainX, mainY + 2, mainX + 50, mainY + 2);
    mainY += 10;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const interetsText = cv.interets.join(" • ");
    const interetsLines = doc.splitTextToSize(interetsText, mainWidth);
    doc.text(interetsLines, mainX, mainY);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("CV généré sur noken.app", pageWidth / 2, pageHeight - 10, { align: "center" });

  // Download the PDF
  const fileName = `CV_${user.firstName || ""}${user.lastName || ""}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName.replace(/\s+/g, "_"));
}
