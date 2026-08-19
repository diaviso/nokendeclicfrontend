"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CLASSE_POLICES_CV } from "@/lib/polices-cv";
import type { ModeleCV } from "@/lib/modeles-cv";
import type { CV, Experience, Formation, RubriqueCV, User } from "@/lib/types";

/**
 * Modèles de CV imprimables.
 *
 * Trois documents, et non trois jeux de couleurs : la mise en page change, pas
 * seulement la teinte. Un CV envoyé à une administration, un CV déposé chez un
 * recruteur du privé et un CV qu'on veut tenir sur une page ne se ressemblent
 * pas, et proposer trois variantes de la même grille n'aurait été qu'un choix
 * décoratif.
 *
 * Les couleurs sont écrites en dur, hors des variables de thème : le document
 * est toujours noir sur blanc, y compris pour un utilisateur en thème sombre.
 * Une feuille imprimée en blanc sur noir vide une cartouche et ne se lit pas.
 */

/* ------------------------------------------------------------------ Outils */

const ENCRE = "#1a1a1a";
const ENCRE_DOUCE = "#5b5b5b";
const FILET = "#d9d9d9";

/**
 * Mois et année, sans le jour.
 *
 * Un CV se lit par périodes, pas par dates exactes : « janv. 2023 » situe un
 * poste, « 15/01/2023 » donne une précision que personne ne demande et qui
 * alourdit chaque ligne de la colonne de droite.
 */
function moisAnnee(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return valeur;
  return format(date, "MMM yyyy", { locale: fr });
}

/** Période d'une entrée, avec « aujourd'hui » quand la fin est ouverte. */
function periode(debut: string, fin?: string | null, enCours?: boolean): string {
  const depuis = moisAnnee(debut);
  if (enCours || !fin) return `${depuis} — aujourd'hui`;
  return `${depuis} — ${moisAnnee(fin)}`;
}

function nomComplet(user?: User | null, cv?: CV): string {
  const nom = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return nom || user?.username || cv?.titreProfessionnel || "Curriculum vitae";
}

/** Coordonnées disponibles, dans l'ordre où on les lit sur un CV. */
function coordonnees(cv: CV, user?: User | null): string[] {
  return [
    user?.email,
    cv.telephone ?? user?.telephone,
    [cv.ville, cv.pays].filter(Boolean).join(", ") || null,
    cv.linkedin,
    cv.github,
    cv.siteWeb,
  ].filter((valeur): valeur is string => Boolean(valeur));
}

export interface DonneesCV {
  cv: CV;
  user?: User | null;
}

/* ---------------------------------------------------------------- Fragments */

function TitreSobre({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: ENCRE,
        borderBottom: `1px solid ${FILET}`,
        paddingBottom: "3pt",
        marginBottom: "7pt",
      }}
    >
      {children}
    </h2>
  );
}

function Entree({
  titre,
  sousTitre,
  quand,
  description,
  compact,
}: {
  titre: string;
  sousTitre?: string | null;
  quand?: string | null;
  description?: string | null;
  compact?: boolean;
}) {
  return (
    <div style={{ marginBottom: compact ? "6pt" : "9pt", breakInside: "avoid" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8pt",
          alignItems: "baseline",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: compact ? "9.5pt" : "10.5pt" }}>
          {titre}
        </p>
        {quand ? (
          <p
            style={{
              fontSize: "8.5pt",
              color: ENCRE_DOUCE,
              whiteSpace: "nowrap",
            }}
          >
            {quand}
          </p>
        ) : null}
      </div>
      {sousTitre ? (
        <p
          style={{
            fontSize: compact ? "9pt" : "9.5pt",
            color: ENCRE_DOUCE,
            fontStyle: "italic",
          }}
        >
          {sousTitre}
        </p>
      ) : null}
      {description ? (
        <p
          style={{
            marginTop: "2pt",
            fontSize: compact ? "8.5pt" : "9.5pt",
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ListeSeparee({
  valeurs,
  compact,
}: {
  valeurs: string[];
  compact?: boolean;
}) {
  return (
    <p style={{ fontSize: compact ? "8.5pt" : "9.5pt", lineHeight: 1.6 }}>
      {valeurs.join(" · ")}
    </p>
  );
}

function entreesExperience(experiences: Experience[] = []) {
  return experiences.map((experience, rang) => (
    <Entree
      key={experience.id ?? rang}
      titre={experience.poste}
      sousTitre={[experience.entreprise, experience.ville]
        .filter(Boolean)
        .join(" — ")}
      quand={periode(experience.dateDebut, experience.dateFin, experience.enCours)}
      description={experience.description}
    />
  ));
}

function entreesFormation(formations: Formation[] = []) {
  return formations.map((formation, rang) => (
    <Entree
      key={formation.id ?? rang}
      titre={formation.diplome}
      sousTitre={[formation.etablissement, formation.ville]
        .filter(Boolean)
        .join(" — ")}
      quand={periode(formation.dateDebut, formation.dateFin, formation.enCours)}
      description={formation.description}
    />
  ));
}

function entreesRubrique(rubrique: RubriqueCV, compact?: boolean) {
  return rubrique.entrees.map((entree, rang) => (
    <Entree
      key={rang}
      titre={entree.titre}
      sousTitre={entree.sousTitre}
      quand={entree.periode}
      description={entree.description}
      compact={compact}
    />
  ));
}

/* ------------------------------------------------------------------ Sobre */

function Sobre({ cv, user }: DonneesCV) {
  const contacts = coordonnees(cv, user);

  return (
    <div style={{ padding: "16mm 18mm", color: ENCRE, fontSize: "10pt" }}>
      <header
        style={{
          textAlign: "center",
          borderBottom: `2px solid ${ENCRE}`,
          paddingBottom: "8pt",
          marginBottom: "12pt",
        }}
      >
        <h1
          style={{
            fontSize: "20pt",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {nomComplet(user, cv)}
        </h1>
        {cv.titreProfessionnel ? (
          <p style={{ marginTop: "2pt", fontSize: "11.5pt", color: ENCRE_DOUCE }}>
            {cv.titreProfessionnel}
          </p>
        ) : null}
        {contacts.length > 0 ? (
          <p
            style={{
              marginTop: "6pt",
              fontSize: "8.5pt",
              color: ENCRE_DOUCE,
              lineHeight: 1.6,
            }}
          >
            {contacts.join("  ·  ")}
          </p>
        ) : null}
      </header>

      {cv.resume ? (
        <section style={{ marginBottom: "12pt" }}>
          <TitreSobre>Profil</TitreSobre>
          <p style={{ lineHeight: 1.55, textAlign: "justify" }}>{cv.resume}</p>
        </section>
      ) : null}

      {cv.experiences?.length ? (
        <section style={{ marginBottom: "12pt" }}>
          <TitreSobre>Expérience professionnelle</TitreSobre>
          {entreesExperience(cv.experiences)}
        </section>
      ) : null}

      {cv.formations?.length ? (
        <section style={{ marginBottom: "12pt" }}>
          <TitreSobre>Formation</TitreSobre>
          {entreesFormation(cv.formations)}
        </section>
      ) : null}

      {cv.competences.length > 0 ? (
        <section style={{ marginBottom: "12pt" }}>
          <TitreSobre>Compétences</TitreSobre>
          <ListeSeparee valeurs={cv.competences} />
        </section>
      ) : null}

      {cv.langues.length > 0 ? (
        <section style={{ marginBottom: "12pt" }}>
          <TitreSobre>Langues</TitreSobre>
          <ListeSeparee valeurs={cv.langues} />
        </section>
      ) : null}

      {cv.certifications.length > 0 ? (
        <section style={{ marginBottom: "12pt" }}>
          <TitreSobre>Certifications</TitreSobre>
          <ListeSeparee valeurs={cv.certifications} />
        </section>
      ) : null}

      {cv.rubriques.map((rubrique) => (
        <section key={rubrique.titre} style={{ marginBottom: "12pt" }}>
          <TitreSobre>{rubrique.titre}</TitreSobre>
          {entreesRubrique(rubrique)}
        </section>
      ))}

      {cv.interets.length > 0 ? (
        <section>
          <TitreSobre>Centres d&apos;intérêt</TitreSobre>
          <ListeSeparee valeurs={cv.interets} />
        </section>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Moderne */

function BlocLateral({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "11pt", breakInside: "avoid" }}>
      <h2
        style={{
          fontSize: "8.5pt",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#0f5f5c",
          marginBottom: "4pt",
        }}
      >
        {titre}
      </h2>
      {children}
    </section>
  );
}

function Moderne({ cv, user }: DonneesCV) {
  const contacts = coordonnees(cv, user);

  return (
    <div style={{ color: ENCRE, fontSize: "10pt" }}>
      {/* Bandeau : c'est lui qui distingue ce modèle au premier regard, et il
          est volontairement plein — un aplat imprime plus proprement qu'un
          dégradé, qui sort souvent en bandes sur une imprimante de bureau. */}
      <header
        style={{
          background: "#0f5f5c",
          color: "#ffffff",
          padding: "13mm 14mm 10mm",
        }}
      >
        <h1 style={{ fontSize: "21pt", fontWeight: 700, lineHeight: 1.1 }}>
          {nomComplet(user, cv)}
        </h1>
        {cv.titreProfessionnel ? (
          <p
            style={{
              marginTop: "3pt",
              fontSize: "12pt",
              color: "rgba(255,255,255,0.88)",
            }}
          >
            {cv.titreProfessionnel}
          </p>
        ) : null}
      </header>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <aside
          style={{
            width: "58mm",
            flexShrink: 0,
            background: "#f4f6f6",
            padding: "10mm 8mm",
            minHeight: "180mm",
          }}
        >
          {contacts.length > 0 ? (
            <BlocLateral titre="Contact">
              {contacts.map((contact) => (
                <p
                  key={contact}
                  style={{
                    fontSize: "8.5pt",
                    lineHeight: 1.5,
                    marginBottom: "2pt",
                    wordBreak: "break-word",
                  }}
                >
                  {contact}
                </p>
              ))}
            </BlocLateral>
          ) : null}

          {cv.competences.length > 0 ? (
            <BlocLateral titre="Compétences">
              {cv.competences.map((competence) => (
                <p
                  key={competence}
                  style={{
                    fontSize: "8.5pt",
                    lineHeight: 1.5,
                    marginBottom: "1.5pt",
                  }}
                >
                  {competence}
                </p>
              ))}
            </BlocLateral>
          ) : null}

          {cv.langues.length > 0 ? (
            <BlocLateral titre="Langues">
              {cv.langues.map((langue) => (
                <p
                  key={langue}
                  style={{ fontSize: "8.5pt", lineHeight: 1.5 }}
                >
                  {langue}
                </p>
              ))}
            </BlocLateral>
          ) : null}

          {cv.certifications.length > 0 ? (
            <BlocLateral titre="Certifications">
              {cv.certifications.map((certification) => (
                <p
                  key={certification}
                  style={{
                    fontSize: "8.5pt",
                    lineHeight: 1.5,
                    marginBottom: "1.5pt",
                  }}
                >
                  {certification}
                </p>
              ))}
            </BlocLateral>
          ) : null}

          {cv.interets.length > 0 ? (
            <BlocLateral titre="Centres d'intérêt">
              <p style={{ fontSize: "8.5pt", lineHeight: 1.5 }}>
                {cv.interets.join(", ")}
              </p>
            </BlocLateral>
          ) : null}
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: "10mm 12mm" }}>
          {cv.resume ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitreSobre>Profil</TitreSobre>
              <p style={{ lineHeight: 1.55, textAlign: "justify" }}>
                {cv.resume}
              </p>
            </section>
          ) : null}

          {cv.experiences?.length ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitreSobre>Expérience</TitreSobre>
              {entreesExperience(cv.experiences)}
            </section>
          ) : null}

          {cv.formations?.length ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitreSobre>Formation</TitreSobre>
              {entreesFormation(cv.formations)}
            </section>
          ) : null}

          {cv.rubriques.map((rubrique) => (
            <section key={rubrique.titre} style={{ marginBottom: "11pt" }}>
              <TitreSobre>{rubrique.titre}</TitreSobre>
              {entreesRubrique(rubrique)}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Compact */

function TitreCompact({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "8.5pt",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: ENCRE,
        borderBottom: `1px solid ${ENCRE}`,
        paddingBottom: "2pt",
        marginBottom: "5pt",
      }}
    >
      {children}
    </h2>
  );
}

function Compact({ cv, user }: DonneesCV) {
  const contacts = coordonnees(cv, user);

  return (
    <div style={{ padding: "12mm 13mm", color: ENCRE, fontSize: "9pt" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "10pt",
          borderBottom: `1.5px solid ${ENCRE}`,
          paddingBottom: "5pt",
          marginBottom: "8pt",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: "16pt", fontWeight: 700, lineHeight: 1.1 }}>
            {nomComplet(user, cv)}
          </h1>
          {cv.titreProfessionnel ? (
            <p style={{ fontSize: "10pt", color: ENCRE_DOUCE }}>
              {cv.titreProfessionnel}
            </p>
          ) : null}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {contacts.slice(0, 4).map((contact) => (
            <p
              key={contact}
              style={{ fontSize: "7.5pt", color: ENCRE_DOUCE, lineHeight: 1.45 }}
            >
              {contact}
            </p>
          ))}
        </div>
      </header>

      {cv.resume ? (
        <p
          style={{
            fontSize: "8.5pt",
            lineHeight: 1.45,
            textAlign: "justify",
            marginBottom: "8pt",
          }}
        >
          {cv.resume}
        </p>
      ) : null}

      {/* Deux colonnes : à cette densité, une ligne pleine largeur dépasse la
          soixantaine de caractères au-delà de laquelle l'œil perd la ligne
          suivante. */}
      <div style={{ display: "flex", gap: "9mm", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          {cv.experiences?.length ? (
            <section style={{ marginBottom: "8pt" }}>
              <TitreCompact>Expérience</TitreCompact>
              {cv.experiences.map((experience, rang) => (
                <Entree
                  key={experience.id ?? rang}
                  compact
                  titre={experience.poste}
                  sousTitre={[experience.entreprise, experience.ville]
                    .filter(Boolean)
                    .join(" — ")}
                  quand={periode(
                    experience.dateDebut,
                    experience.dateFin,
                    experience.enCours,
                  )}
                  description={experience.description}
                />
              ))}
            </section>
          ) : null}

          {cv.rubriques.map((rubrique) => (
            <section key={rubrique.titre} style={{ marginBottom: "8pt" }}>
              <TitreCompact>{rubrique.titre}</TitreCompact>
              {entreesRubrique(rubrique, true)}
            </section>
          ))}
        </div>

        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          {cv.formations?.length ? (
            <section style={{ marginBottom: "8pt" }}>
              <TitreCompact>Formation</TitreCompact>
              {cv.formations.map((formation, rang) => (
                <Entree
                  key={formation.id ?? rang}
                  compact
                  titre={formation.diplome}
                  sousTitre={[formation.etablissement, formation.ville]
                    .filter(Boolean)
                    .join(" — ")}
                  quand={periode(
                    formation.dateDebut,
                    formation.dateFin,
                    formation.enCours,
                  )}
                  description={formation.description}
                />
              ))}
            </section>
          ) : null}

          {cv.competences.length > 0 ? (
            <section style={{ marginBottom: "8pt" }}>
              <TitreCompact>Compétences</TitreCompact>
              <ListeSeparee valeurs={cv.competences} compact />
            </section>
          ) : null}

          {cv.langues.length > 0 ? (
            <section style={{ marginBottom: "8pt" }}>
              <TitreCompact>Langues</TitreCompact>
              <ListeSeparee valeurs={cv.langues} compact />
            </section>
          ) : null}

          {cv.certifications.length > 0 ? (
            <section style={{ marginBottom: "8pt" }}>
              <TitreCompact>Certifications</TitreCompact>
              <ListeSeparee valeurs={cv.certifications} compact />
            </section>
          ) : null}

          {cv.interets.length > 0 ? (
            <section>
              <TitreCompact>Centres d&apos;intérêt</TitreCompact>
              <ListeSeparee valeurs={cv.interets} compact />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Éditorial */

const EDITORIAL = {
  encre: "#2b2320",
  douce: "#6b5f57",
  accent: "#9c3d24",
  chaud: "#c07830",
  papier: "#fdfaf5",
  voile: "#f2e7da",
} as const;

function TitreEditorial({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "9pt",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: EDITORIAL.accent,
        display: "flex",
        alignItems: "center",
        gap: "8pt",
        marginBottom: "8pt",
      }}
    >
      {children}
      {/* Le filet prolonge le titre jusqu'à la marge : il tient lieu de
          séparateur sans ajouter une ligne pleine largeur de plus. */}
      <span
        aria-hidden
        style={{ flex: 1, height: "1px", background: EDITORIAL.voile }}
      />
    </h2>
  );
}

function Editorial({ cv, user }: DonneesCV) {
  const contacts = coordonnees(cv, user);
  const nom = nomComplet(user, cv);

  return (
    <div
      style={{
        background: EDITORIAL.papier,
        color: EDITORIAL.encre,
        fontSize: "9.5pt",
        minHeight: "297mm",
      }}
    >
      <header style={{ padding: "20mm 20mm 0" }}>
        <h1
          style={{
            fontFamily: "var(--police-editorial), Georgia, serif",
            fontSize: "34pt",
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          {nom}
        </h1>

        {cv.titreProfessionnel ? (
          <p
            style={{
              marginTop: "5pt",
              fontFamily: "var(--police-editorial), Georgia, serif",
              fontSize: "13pt",
              fontStyle: "italic",
              color: EDITORIAL.accent,
            }}
          >
            {cv.titreProfessionnel}
          </p>
        ) : null}

        {/* Double filet : l'épais porte l'accent, le fin le prolonge. Deux
            traits d'épaisseur différente se lisent comme une signature
            typographique, là où un seul ferait décoration. */}
        <div style={{ display: "flex", alignItems: "center", marginTop: "10pt" }}>
          <span
            aria-hidden
            style={{ width: "28mm", height: "3pt", background: EDITORIAL.accent }}
          />
          <span
            aria-hidden
            style={{ flex: 1, height: "1px", background: EDITORIAL.voile }}
          />
        </div>

        {contacts.length > 0 ? (
          <p
            style={{
              marginTop: "8pt",
              fontSize: "8pt",
              color: EDITORIAL.douce,
              lineHeight: 1.7,
            }}
          >
            {contacts.join("   ·   ")}
          </p>
        ) : null}
      </header>

      <div style={{ padding: "12mm 20mm 18mm" }}>
        {cv.resume ? (
          <section style={{ marginBottom: "13pt" }}>
            <p
              style={{
                fontFamily: "var(--police-editorial), Georgia, serif",
                fontSize: "11pt",
                lineHeight: 1.55,
                color: EDITORIAL.encre,
                borderLeft: `2pt solid ${EDITORIAL.chaud}`,
                paddingLeft: "10pt",
              }}
            >
              {cv.resume}
            </p>
          </section>
        ) : null}

        {cv.experiences?.length ? (
          <section style={{ marginBottom: "13pt" }}>
            <TitreEditorial>Parcours professionnel</TitreEditorial>
            {cv.experiences.map((experience, rang) => (
              <div
                key={experience.id ?? rang}
                style={{ marginBottom: "10pt", breakInside: "avoid" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10pt",
                    alignItems: "baseline",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--police-editorial), Georgia, serif",
                      fontSize: "12pt",
                      fontWeight: 600,
                    }}
                  >
                    {experience.poste}
                  </p>
                  <p
                    style={{
                      fontSize: "8pt",
                      color: EDITORIAL.chaud,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {periode(
                      experience.dateDebut,
                      experience.dateFin,
                      experience.enCours,
                    )}
                  </p>
                </div>
                <p style={{ fontSize: "9.5pt", color: EDITORIAL.douce }}>
                  {[experience.entreprise, experience.ville]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {experience.description ? (
                  <p
                    style={{
                      marginTop: "3pt",
                      fontSize: "9pt",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {experience.description}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {cv.formations?.length ? (
          <section style={{ marginBottom: "13pt" }}>
            <TitreEditorial>Formation</TitreEditorial>
            {cv.formations.map((formation, rang) => (
              <div
                key={formation.id ?? rang}
                style={{ marginBottom: "8pt", breakInside: "avoid" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10pt",
                    alignItems: "baseline",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--police-editorial), Georgia, serif",
                      fontSize: "11pt",
                      fontWeight: 600,
                    }}
                  >
                    {formation.diplome}
                  </p>
                  <p
                    style={{
                      fontSize: "8pt",
                      color: EDITORIAL.chaud,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {periode(
                      formation.dateDebut,
                      formation.dateFin,
                      formation.enCours,
                    )}
                  </p>
                </div>
                <p style={{ fontSize: "9.5pt", color: EDITORIAL.douce }}>
                  {[formation.etablissement, formation.ville]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {cv.rubriques.map((rubrique) => (
          <section key={rubrique.titre} style={{ marginBottom: "13pt" }}>
            <TitreEditorial>{rubrique.titre}</TitreEditorial>
            {entreesRubrique(rubrique)}
          </section>
        ))}

        {cv.competences.length > 0 ? (
          <section style={{ marginBottom: "13pt" }}>
            <TitreEditorial>Compétences</TitreEditorial>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4pt" }}>
              {cv.competences.map((competence) => (
                <span
                  key={competence}
                  style={{
                    fontSize: "8.5pt",
                    padding: "2pt 7pt",
                    borderRadius: "999px",
                    background: EDITORIAL.voile,
                    color: EDITORIAL.accent,
                  }}
                >
                  {competence}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div style={{ display: "flex", gap: "12mm" }}>
          {cv.langues.length > 0 ? (
            <section style={{ flex: 1, minWidth: 0 }}>
              <TitreEditorial>Langues</TitreEditorial>
              <ListeSeparee valeurs={cv.langues} />
            </section>
          ) : null}

          {cv.certifications.length > 0 ? (
            <section style={{ flex: 1, minWidth: 0 }}>
              <TitreEditorial>Certifications</TitreEditorial>
              <ListeSeparee valeurs={cv.certifications} />
            </section>
          ) : null}
        </div>

        {cv.interets.length > 0 ? (
          <section style={{ marginTop: "13pt" }}>
            <TitreEditorial>Centres d&apos;intérêt</TitreEditorial>
            <ListeSeparee valeurs={cv.interets} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Prisme */

const PRISME = {
  encre: "#171634",
  douce: "#5b5a7a",
  indigo: "#4338ca",
  violet: "#7c3aed",
  rose: "#db2777",
  voile: "#f2f1fd",
  filet: "#e2e0f7",
} as const;

/** Trois teintes qui se répètent, pour distinguer les entrées d'une liste. */
const PASTILLES = [PRISME.indigo, PRISME.violet, PRISME.rose] as const;

function TitrePrisme({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--police-prisme), system-ui, sans-serif",
        fontSize: "9pt",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: PRISME.indigo,
        marginBottom: "6pt",
      }}
    >
      {children}
    </h2>
  );
}

function Prisme({ cv, user }: DonneesCV) {
  const contacts = coordonnees(cv, user);

  return (
    <div
      style={{
        fontFamily: "var(--police-prisme), system-ui, sans-serif",
        color: PRISME.encre,
        fontSize: "9.5pt",
        minHeight: "297mm",
      }}
    >
      {/* Dégradé plutôt qu'aplat : c'est ce qui donne son nom au modèle. Il
          sort net dans un PDF ; sur une imprimante de bureau bon marché, il
          peut apparaître en bandes — le modèle « Moderne » reste là pour ce
          cas. */}
      <header
        style={{
          background: `linear-gradient(115deg, ${PRISME.indigo} 0%, ${PRISME.violet} 55%, ${PRISME.rose} 100%)`,
          color: "#ffffff",
          padding: "16mm 14mm 13mm",
        }}
      >
        <h1
          style={{
            fontSize: "26pt",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {nomComplet(user, cv)}
        </h1>
        {cv.titreProfessionnel ? (
          <p
            style={{
              marginTop: "4pt",
              fontSize: "12pt",
              fontWeight: 500,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {cv.titreProfessionnel}
          </p>
        ) : null}

        {contacts.length > 0 ? (
          <p
            style={{
              marginTop: "8pt",
              fontSize: "8pt",
              color: "rgba(255,255,255,0.82)",
              lineHeight: 1.7,
            }}
          >
            {contacts.join("   •   ")}
          </p>
        ) : null}
      </header>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <main style={{ flex: 1, minWidth: 0, padding: "11mm 10mm 14mm 14mm" }}>
          {cv.resume ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitrePrisme>Profil</TitrePrisme>
              <p style={{ lineHeight: 1.55 }}>{cv.resume}</p>
            </section>
          ) : null}

          {cv.experiences?.length ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitrePrisme>Expérience</TitrePrisme>
              {cv.experiences.map((experience, rang) => (
                <div
                  key={experience.id ?? rang}
                  style={{
                    position: "relative",
                    paddingLeft: "12pt",
                    marginBottom: "9pt",
                    breakInside: "avoid",
                  }}
                >
                  {/* Pastille de chronologie : elle remplace la puce et donne
                      le rythme de lecture de la colonne. */}
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "3.5pt",
                      width: "5pt",
                      height: "5pt",
                      borderRadius: "999px",
                      background: PASTILLES[rang % PASTILLES.length],
                    }}
                  />
                  <p style={{ fontWeight: 700, fontSize: "10.5pt" }}>
                    {experience.poste}
                  </p>
                  <p style={{ fontSize: "9pt", color: PRISME.douce }}>
                    {[experience.entreprise, experience.ville]
                      .filter(Boolean)
                      .join(" · ")}
                    {"  —  "}
                    <span style={{ color: PASTILLES[rang % PASTILLES.length] }}>
                      {periode(
                        experience.dateDebut,
                        experience.dateFin,
                        experience.enCours,
                      )}
                    </span>
                  </p>
                  {experience.description ? (
                    <p
                      style={{
                        marginTop: "2.5pt",
                        fontSize: "9pt",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {experience.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          {cv.formations?.length ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitrePrisme>Formation</TitrePrisme>
              {entreesFormation(cv.formations)}
            </section>
          ) : null}

          {cv.rubriques.map((rubrique) => (
            <section key={rubrique.titre} style={{ marginBottom: "11pt" }}>
              <TitrePrisme>{rubrique.titre}</TitrePrisme>
              {entreesRubrique(rubrique)}
            </section>
          ))}
        </main>

        <aside
          style={{
            width: "56mm",
            flexShrink: 0,
            background: PRISME.voile,
            padding: "11mm 9mm",
            minHeight: "170mm",
          }}
        >
          {cv.competences.length > 0 ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitrePrisme>Compétences</TitrePrisme>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3pt" }}>
                {cv.competences.map((competence, rang) => (
                  <span
                    key={competence}
                    style={{
                      fontSize: "8pt",
                      padding: "2pt 6pt",
                      borderRadius: "4pt",
                      background: "#ffffff",
                      color: PASTILLES[rang % PASTILLES.length],
                      border: `0.5pt solid ${PRISME.filet}`,
                    }}
                  >
                    {competence}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {cv.langues.length > 0 ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitrePrisme>Langues</TitrePrisme>
              {cv.langues.map((langue) => (
                <p key={langue} style={{ fontSize: "8.5pt", lineHeight: 1.6 }}>
                  {langue}
                </p>
              ))}
            </section>
          ) : null}

          {cv.certifications.length > 0 ? (
            <section style={{ marginBottom: "11pt" }}>
              <TitrePrisme>Certifications</TitrePrisme>
              {cv.certifications.map((certification) => (
                <p
                  key={certification}
                  style={{ fontSize: "8.5pt", lineHeight: 1.5, marginBottom: "2pt" }}
                >
                  {certification}
                </p>
              ))}
            </section>
          ) : null}

          {cv.interets.length > 0 ? (
            <section>
              <TitrePrisme>Centres d&apos;intérêt</TitrePrisme>
              <p style={{ fontSize: "8.5pt", lineHeight: 1.6 }}>
                {cv.interets.join(", ")}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Rendu */

/**
 * Feuille A4.
 *
 * La largeur est fixée en millimètres, pas en pixels : c'est la même feuille
 * qui est affichée à l'écran et envoyée à l'imprimante, et une mesure en
 * pixels aurait donné deux résultats différents.
 */
export function DocumentCV({
  modele,
  cv,
  user,
}: DonneesCV & { modele: ModeleCV }) {
  const RENDUS: Record<ModeleCV, (donnees: DonneesCV) => React.ReactElement> = {
    sobre: Sobre,
    moderne: Moderne,
    compact: Compact,
    editorial: Editorial,
    prisme: Prisme,
  };
  const Rendu = RENDUS[modele] ?? Sobre;

  return (
    <div
      className={`feuille-cv ${CLASSE_POLICES_CV}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        background: "#ffffff",
        color: ENCRE,
        // Interlignage et famille posés ici plutôt qu'hérités de
        // l'application : le document ne doit dépendre d'aucun réglage de la
        // page qui l'affiche.
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        lineHeight: 1.4,
      }}
    >
      <Rendu cv={cv} user={user} />
    </div>
  );
}
