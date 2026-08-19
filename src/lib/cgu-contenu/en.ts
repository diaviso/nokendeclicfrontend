/**
 * Terms of use — English version.
 *
 * ⚠️ Courtesy translation. The French text is the one that binds: it is the
 * version accepted at sign-up, the version whose number is recorded against the
 * account, and the one a Senegalese court would read. Article 14 says so inside
 * the document itself, because a reader who only ever sees this page would
 * otherwise have no way of knowing.
 */
import type { ArticleCgu } from "../cgu";

export const ARTICLES_EN: ArticleCgu[] = [
  {
    id: "objet",
    titre: "1. Purpose and acceptance",
    contenu: [
      "These terms of use (the “Terms”) govern access to and use of the Noken Declic platform (the “Platform”), available through a web browser and as an installable application.",
      "The Platform connects people looking for opportunities (employment, training, scholarships, volunteering, support programmes) with the organisations that offer them.",
      "Creating an account constitutes full acceptance of these Terms. Anyone who does not accept them must refrain from using the Platform.",
    ],
  },
  {
    id: "definitions",
    titre: "2. Definitions",
    contenu: [
      {
        liste: [
          "“Member”: any natural person holding an account, who browses opportunities and may build an online curriculum vitae.",
          "“Partner”: any organisation (company, association, institution, training provider) holding an account that allows it to publish opportunities and, under the conditions set out in article 7, to view profiles.",
          "“Publisher”: the Noken Declic team, which administers the Platform, approves listings and carries out moderation.",
          "“Opportunity”: any listing published on the Platform, whatever its category.",
          "“Content”: any data placed on the Platform by a Member or a Partner (curriculum vitae, listing, comment, first-hand account, message).",
        ],
      },
    ],
  },
  {
    id: "compte",
    titre: "3. Accounts and access",
    contenu: [
      "Registration is free and requires a valid email address, verified by a six-digit code. It may also be completed using a Google account.",
      "The Member undertakes to provide accurate information and to keep it up to date. They alone are responsible for the confidentiality of their password and for any activity carried out from their account.",
      "The Publisher may suspend or close an account in the event of a breach of these Terms, in particular in cases of false declaration, impersonation or conduct harmful to others.",
      "The Member may close their account at any time from their personal area, or on simple request to the Publisher.",
    ],
  },
  {
    id: "usage",
    titre: "4. Rules of use",
    contenu: [
      "Everyone undertakes to use the Platform in good faith. The following are prohibited in particular:",
      {
        liste: [
          "publishing content that is false, misleading, defamatory, insulting, hateful or discriminatory;",
          "publishing fraudulent listings, or listings that make an application conditional on payment of a sum of money to the advertiser;",
          "automated collection of data (scraping, bulk extraction) by any means whatsoever;",
          "impersonating a person or an organisation;",
          "any attempt to compromise the security or the operation of the Platform.",
        ],
      },
      "Any breach may result in removal of the content concerned and closure of the account, without prejudice to any proceedings the Publisher or the injured parties may consider appropriate.",
    ],
  },
  {
    id: "offres",
    titre: "5. Publication of opportunities and moderation",
    contenu: [
      "Opportunities are published either by the Publisher or by a Partner. Any listing submitted by a Partner is reviewed by the Publisher before going live; it may be rejected, in which case its author is given the reason and may correct it.",
      "Any change made by a Partner to an already published listing triggers a further review before it goes live again.",
      "The Publisher is neither the employer nor the organiser of opportunities published by third parties. It does not guarantee their accuracy, their availability, or the outcome of an application. It is for each person to check the decisive information with the organisation concerned before committing, in particular where a payment is requested.",
      "Any listing that appears fraudulent may be reported from the Platform; the Publisher undertakes to examine it as soon as possible.",
    ],
  },
  {
    id: "cv",
    titre: "6. Curriculum vitae and visibility",
    contenu: [
      "The Member may build a curriculum vitae on the Platform, entering it directly or importing it from a document, and may amend or delete it at any time.",
      "This curriculum vitae is private by default. It is visible to no Partner until the Member has themselves activated the visibility setting provided for that purpose.",
      "The Member may withdraw that visibility at any time, with a single setting. Their profile then ceases to appear in Partners' searches.",
    ],
  },
  {
    id: "partage",
    titre: "7. Sharing data with Partners",
    saillant: true,
    contenu: [
      "By making their curriculum vitae visible to recruiters, the Member expressly agrees that the data they have entered there may be disclosed to Partners of the Platform, solely for the purpose of professional matching and the handling of published opportunities.",
      "The data thus disclosed includes in particular professional background, education, skills, languages, the declared region or town, and professional status.",
      "The Member's direct contact details — telephone number, postal address, email address — are not passed on to Partners. First contact is made through the Platform's internal messaging, and the Member remains free not to reply.",
      "This sharing rests on the Member's consent. Withdrawing it, by turning off visibility, ends any further disclosure of their data to Partners.",
    ],
  },
  {
    id: "partenaires-obligations",
    titre: "8. Partners' obligations regarding the data they consult",
    saillant: true,
    contenu: [
      "A Partner who accesses Members' profiles undertakes to use the data consulted only in connection with the opportunities published on the Platform — that is, solely in order to identify candidates and to contact them about a specific post, training course or programme.",
      "The Partner is accordingly prohibited from:",
      {
        liste: [
          "using this data for commercial prospecting, canvassing, or sending communications unrelated to an opportunity;",
          "transferring, renting, reselling or disclosing it to a third party, whether free of charge or for consideration;",
          "retaining it beyond the period necessary to handle the application or recruitment concerned;",
          "extracting it in bulk, or incorporating it into a file compiled outside the Platform;",
          "basing a decision on a discriminatory criterion within the meaning of the law.",
        ],
      },
      "The Partner remains responsible for the processing it carries out on the data it accesses, and must comply, on its own account, with the applicable personal data protection rules.",
      "Any breach of this article results in immediate suspension of access to profiles, without prejudice to closure of the account and to any legal action the Publisher or the Members concerned may consider necessary.",
    ],
  },
  {
    id: "donnees",
    titre: "9. Personal data",
    contenu: [
      "The processing carried out by the Platform is governed by Senegalese law no. 2008-12 of 25 January 2008 on the protection of personal data, and falls under the supervision of the Personal Data Protection Commission (CDP).",
      "The data collected is used to create and manage accounts, for the matching described in articles 6 and 7, to improve the recommendations offered, and to compile usage statistics.",
      "Certain information — sex, age range, disability status, region — is collected for statistical monitoring of the work carried out. It is used only in aggregate form and is never disclosed to Partners.",
      "In accordance with the law, everyone has a right of access, rectification, objection and erasure in respect of data concerning them. These rights are exercised from the personal area or by request to the Publisher, who responds within the statutory time limits.",
      "Data is kept for the lifetime of the account, then deleted or anonymised. Uploaded files (photographs, documents) are hosted with an infrastructure provider and protected by restricted access.",
    ],
  },
  {
    id: "propriete",
    titre: "10. Intellectual property",
    contenu: [
      "The Platform, its structure, its interfaces and its graphic elements are protected and remain the property of the Publisher.",
      "Everyone retains ownership of the content they upload. By publishing it, they grant the Publisher the right to host, display and distribute it on the Platform, solely for the purposes of the service and for as long as it remains published.",
    ],
  },
  {
    id: "responsabilite",
    titre: "11. Liability and availability",
    contenu: [
      "The Publisher takes reasonable steps to keep the Platform available, without guaranteeing absolute continuity. Access may be interrupted for maintenance or for reasons beyond its control.",
      "The Publisher cannot be held liable for content published by third parties, nor for the consequences of an application, a recruitment process or any step taken following an opportunity found on the Platform.",
    ],
  },
  {
    id: "modification",
    titre: "12. Changes to the Terms",
    contenu: [
      "The Publisher may amend these Terms. Any substantial change gives rise to a new version, brought to users' attention, whose acceptance is requested at the next sign-in.",
      "Continued use after acceptance constitutes agreement to the version in force.",
    ],
  },
  {
    id: "droit",
    titre: "13. Governing law and disputes",
    contenu: [
      "These Terms are governed by Senegalese law.",
      "In the event of a dispute, the parties shall endeavour to reach an amicable solution. Failing that, the dispute shall be brought before the competent courts of Dakar.",
    ],
  },
  {
    id: "langue",
    titre: "14. Language of the Terms",
    saillant: true,
    contenu: [
      "This English text is a courtesy translation, provided to make the Terms readable to non-French speakers.",
      "Only the French version is binding. It is the version accepted when an account is created, the version whose number is recorded against the account, and the one that prevails in the event of any discrepancy of wording or interpretation between the two texts.",
    ],
  },
];

/** Summary shown in the acceptance dialog, before agreement is given. */
export const POINTS_CLES_EN = [
  "Your curriculum vitae stays private until you turn on its visibility to recruiters yourself.",
  "If you do turn it on, your background data is disclosed to partners, solely in connection with published opportunities.",
  "Your direct contact details are never passed on to them: contact goes through the platform's messaging.",
  "Partners may use this data only for their recruitment, and may neither resell it nor reuse it elsewhere.",
  "You can withdraw that visibility, correct or delete your data at any time.",
];
