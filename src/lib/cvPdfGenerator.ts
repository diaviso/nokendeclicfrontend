import { jsPDF } from "jspdf";
import type { CV, Experience, Formation } from "@/types";

interface UserInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  pictureUrl?: string;
}

const COLORS = {
  primary: [37, 99, 235] as [number, number, number], // Blue-600
  sidebar: [241, 245, 249] as [number, number, number], // Slate-100 (lighter)
  sidebarText: [51, 65, 85] as [number, number, number], // Slate-700
  accent: [16, 185, 129] as [number, number, number], // Emerald-500
  dark: [30, 41, 59] as [number, number, number], // Slate-800
  white: [255, 255, 255] as [number, number, number],
  text: [51, 65, 85] as [number, number, number], // Slate-700
  muted: [100, 116, 139] as [number, number, number], // Slate-500
};

function formatDateShort(dateString: string | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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

  // Draw sidebar background (lighter color)
  doc.setFillColor(...COLORS.sidebar);
  doc.rect(0, 0, sidebarWidth + margin, pageHeight, "F");

  // Profile section in sidebar
  yPos = 20;

  // Profile picture or initials
  const profileCenterX = margin + sidebarWidth / 2;
  let profileImageLoaded = false;
  
  if (user.pictureUrl) {
    try {
      const imageData = await loadImageAsBase64(user.pictureUrl);
      if (imageData) {
        doc.addImage(imageData, "JPEG", profileCenterX - 15, yPos, 30, 30);
        profileImageLoaded = true;
      }
    } catch {
      profileImageLoaded = false;
    }
  }
  
  if (!profileImageLoaded) {
    // Draw circle with initials
    doc.setFillColor(...COLORS.primary);
    doc.circle(profileCenterX, yPos + 15, 15, "F");
    const initials = `${(user.firstName?.[0] || "").toUpperCase()}${(user.lastName?.[0] || "").toUpperCase()}`;
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(initials, profileCenterX, yPos + 18, { align: "center" });
  }

  yPos += 38;

  // Name in sidebar
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Votre Nom";
  const nameLines = doc.splitTextToSize(fullName, sidebarWidth - 6);
  doc.text(nameLines, profileCenterX, yPos, { align: "center" });
  yPos += nameLines.length * 5 + 3;

  // Title
  if (cv.titreProfessionnel) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.primary);
    const titleLines = doc.splitTextToSize(cv.titreProfessionnel, sidebarWidth - 6);
    doc.text(titleLines, profileCenterX, yPos, { align: "center" });
    yPos += titleLines.length * 4 + 6;
  }

  // Contact section
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, sidebarWidth - 5, 0.5, "F");
  yPos += 5;

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CONTACT", margin + 3, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.sidebarText);

  if (user.email) {
    doc.text("@", margin + 3, yPos);
    const emailLines = doc.splitTextToSize(user.email, sidebarWidth - 15);
    doc.text(emailLines, margin + 10, yPos);
    yPos += emailLines.length * 3.5 + 2;
  }

  if (cv.telephone) {
    doc.text("Tel:", margin + 3, yPos);
    doc.text(cv.telephone, margin + 14, yPos);
    yPos += 5;
  }

  if (cv.ville || cv.pays) {
    doc.text("Loc:", margin + 3, yPos);
    const location = `${cv.ville || ""}${cv.ville && cv.pays ? ", " : ""}${cv.pays || ""}`;
    const locLines = doc.splitTextToSize(location, sidebarWidth - 18);
    doc.text(locLines, margin + 14, yPos);
    yPos += locLines.length * 3.5 + 2;
  }

  if (cv.linkedin) {
    doc.text("in:", margin + 3, yPos);
    const linkedinShort = cv.linkedin.replace("https://www.linkedin.com/in/", "").replace("https://linkedin.com/in/", "");
    const linkedinLines = doc.splitTextToSize(linkedinShort, sidebarWidth - 15);
    doc.text(linkedinLines, margin + 10, yPos);
    yPos += linkedinLines.length * 3.5 + 2;
  }

  if (cv.github) {
    doc.text("gh:", margin + 3, yPos);
    const githubShort = cv.github.replace("https://github.com/", "").replace("github.com/", "");
    const githubLines = doc.splitTextToSize(githubShort, sidebarWidth - 15);
    doc.text(githubLines, margin + 10, yPos);
    yPos += githubLines.length * 3.5 + 2;
  }

  yPos += 3;

  // Skills section
  if (cv.competences && cv.competences.length > 0) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, yPos, sidebarWidth - 5, 0.5, "F");
    yPos += 5;

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("COMPETENCES", margin + 3, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.sidebarText);

    cv.competences.forEach((comp) => {
      if (yPos > pageHeight - 20) return;
      const compLines = doc.splitTextToSize("- " + comp, sidebarWidth - 10);
      doc.text(compLines, margin + 3, yPos);
      yPos += compLines.length * 3 + 1;
    });

    yPos += 3;
  }

  // Languages section
  if (cv.langues && cv.langues.length > 0) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, yPos, sidebarWidth - 5, 0.5, "F");
    yPos += 5;

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("LANGUES", margin + 3, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.sidebarText);

    cv.langues.forEach((langue) => {
      if (yPos > pageHeight - 20) return;
      doc.text("- " + langue, margin + 3, yPos);
      yPos += 4;
    });

    yPos += 3;
  }

  // Certifications section
  if (cv.certifications && cv.certifications.length > 0) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, yPos, sidebarWidth - 5, 0.5, "F");
    yPos += 5;

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATIONS", margin + 3, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.sidebarText);

    cv.certifications.forEach((cert) => {
      if (yPos > pageHeight - 20) return;
      const certLines = doc.splitTextToSize("- " + cert, sidebarWidth - 10);
      doc.text(certLines, margin + 3, yPos);
      yPos += certLines.length * 3 + 1;
    });
  }

  // Main content area
  const mainX = sidebarWidth + margin + 10;
  let mainY = 20;

  // Resume/Summary section
  if (cv.resume) {
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PROFIL", mainX, mainY);
    
    // Underline
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(mainX, mainY + 1.5, mainX + 20, mainY + 1.5);
    mainY += 6;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const resumeLines = doc.splitTextToSize(cv.resume, mainWidth);
    doc.text(resumeLines, mainX, mainY);
    mainY += resumeLines.length * 3.5 + 6;
  }

  // Experience section
  if (cv.experiences && cv.experiences.length > 0) {
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EXPERIENCE PROFESSIONNELLE", mainX, mainY);
    
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(mainX, mainY + 1.5, mainX + 55, mainY + 1.5);
    mainY += 6;

    cv.experiences.forEach((exp: Experience) => {
      if (mainY > pageHeight - 30) {
        doc.addPage();
        mainY = 20;
      }

      // Job title
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(exp.poste, mainX, mainY);
      mainY += 4;

      // Company and location
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${exp.entreprise}${exp.ville ? " - " + exp.ville : ""}`, mainX, mainY);
      mainY += 4;

      // Dates
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(8);
      const dateText = `${formatDateShort(exp.dateDebut)} - ${exp.enCours ? "Present" : formatDateShort(exp.dateFin)}`;
      doc.text(dateText, mainX, mainY);
      mainY += 4;

      // Description
      if (exp.description) {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(8);
        const descLines = doc.splitTextToSize(exp.description, mainWidth);
        doc.text(descLines, mainX, mainY);
        mainY += descLines.length * 3 + 2;
      }

      mainY += 3;
    });
  }

  // Education section
  if (cv.formations && cv.formations.length > 0) {
    if (mainY > pageHeight - 40) {
      doc.addPage();
      mainY = 20;
    }

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATION", mainX, mainY);
    
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(mainX, mainY + 1.5, mainX + 28, mainY + 1.5);
    mainY += 6;

    cv.formations.forEach((form: Formation) => {
      if (mainY > pageHeight - 25) {
        doc.addPage();
        mainY = 20;
      }

      // Degree
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const diplomeLines = doc.splitTextToSize(form.diplome, mainWidth);
      doc.text(diplomeLines, mainX, mainY);
      mainY += diplomeLines.length * 4;

      // School
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${form.etablissement}${form.ville ? " - " + form.ville : ""}`, mainX, mainY);
      mainY += 4;

      // Dates
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(8);
      const dateText = `${formatDateShort(form.dateDebut)} - ${form.enCours ? "Present" : formatDateShort(form.dateFin)}`;
      doc.text(dateText, mainX, mainY);
      mainY += 4;

      // Description
      if (form.description) {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(8);
        const descLines = doc.splitTextToSize(form.description, mainWidth);
        doc.text(descLines, mainX, mainY);
        mainY += descLines.length * 3 + 2;
      }

      mainY += 3;
    });
  }

  // Interests section
  if (cv.interets && cv.interets.length > 0) {
    if (mainY > pageHeight - 25) {
      doc.addPage();
      mainY = 20;
    }

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CENTRES D'INTERET", mainX, mainY);
    
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(mainX, mainY + 1.5, mainX + 40, mainY + 1.5);
    mainY += 6;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const interetsText = cv.interets.join(" - ");
    const interetsLines = doc.splitTextToSize(interetsText, mainWidth);
    doc.text(interetsLines, mainX, mainY);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text("CV genere sur noken.app", pageWidth / 2, pageHeight - 8, { align: "center" });

  // Download the PDF
  const fileName = `CV_${user.firstName || ""}${user.lastName || ""}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName.replace(/\s+/g, "_"));
}

// Generate Word document
export function generateCVWord(cv: CV, user: UserInfo): void {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Votre Nom";
  
  let content = `${fullName}\n`;
  content += `${cv.titreProfessionnel || ""}\n\n`;
  
  // Contact
  content += "CONTACT\n";
  content += "--------\n";
  if (user.email) content += `Email: ${user.email}\n`;
  if (cv.telephone) content += `Tel: ${cv.telephone}\n`;
  if (cv.ville || cv.pays) content += `Adresse: ${cv.ville || ""}${cv.ville && cv.pays ? ", " : ""}${cv.pays || ""}\n`;
  if (cv.linkedin) content += `LinkedIn: ${cv.linkedin}\n`;
  if (cv.github) content += `GitHub: ${cv.github}\n`;
  content += "\n";
  
  // Profile
  if (cv.resume) {
    content += "PROFIL\n";
    content += "------\n";
    content += `${cv.resume}\n\n`;
  }
  
  // Experience
  if (cv.experiences && cv.experiences.length > 0) {
    content += "EXPERIENCE PROFESSIONNELLE\n";
    content += "--------------------------\n";
    cv.experiences.forEach((exp) => {
      content += `${exp.poste}\n`;
      content += `${exp.entreprise}${exp.ville ? " - " + exp.ville : ""}\n`;
      content += `${formatDateShort(exp.dateDebut)} - ${exp.enCours ? "Present" : formatDateShort(exp.dateFin)}\n`;
      if (exp.description) content += `${exp.description}\n`;
      content += "\n";
    });
  }
  
  // Education
  if (cv.formations && cv.formations.length > 0) {
    content += "FORMATION\n";
    content += "---------\n";
    cv.formations.forEach((form) => {
      content += `${form.diplome}\n`;
      content += `${form.etablissement}${form.ville ? " - " + form.ville : ""}\n`;
      content += `${formatDateShort(form.dateDebut)} - ${form.enCours ? "Present" : formatDateShort(form.dateFin)}\n`;
      if (form.description) content += `${form.description}\n`;
      content += "\n";
    });
  }
  
  // Skills
  if (cv.competences && cv.competences.length > 0) {
    content += "COMPETENCES\n";
    content += "-----------\n";
    content += cv.competences.join(", ") + "\n\n";
  }
  
  // Languages
  if (cv.langues && cv.langues.length > 0) {
    content += "LANGUES\n";
    content += "-------\n";
    content += cv.langues.join(", ") + "\n\n";
  }
  
  // Certifications
  if (cv.certifications && cv.certifications.length > 0) {
    content += "CERTIFICATIONS\n";
    content += "--------------\n";
    content += cv.certifications.join(", ") + "\n\n";
  }
  
  // Interests
  if (cv.interets && cv.interets.length > 0) {
    content += "CENTRES D'INTERET\n";
    content += "-----------------\n";
    content += cv.interets.join(", ") + "\n";
  }
  
  // Create blob and download
  const blob = new Blob([content], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `CV_${user.firstName || ""}${user.lastName || ""}_${new Date().toISOString().split("T")[0]}.doc`.replace(/\s+/g, "_");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
