/**
 * Privacy policy — English version.
 *
 * ⚠️ Courtesy translation. The French text is the one that binds; article 14
 * says so inside the document itself, because a reader who only ever sees this
 * page would otherwise have no way of knowing.
 */
import type { ArticleLegal } from "../legal-types";

export const ARTICLES_EN: ArticleLegal[] = [
  {
    id: "responsable",
    titre: "1. Data controller and purpose of this policy",
    contenu: [
      "Noken (the “Platform”), a project run by the organisation Declic, connects people looking for opportunities with the organisations that offer them. Running it involves processing personal data.",
      "This policy explains what data is collected, why, how long it is kept, who can access it, and how to exercise your rights. It supplements the terms of use, which remain the contractual document.",
      "This processing is governed by Senegalese law no. 2008-12 of 25 January 2008 on the protection of personal data, and falls under the supervision of the Personal Data Protection Commission (CDP).",
    ],
  },
  {
    id: "donnees",
    titre: "2. Data collected",
    contenu: [
      "We collect only what you give us and what running the service requires.",
      "Account data, at sign-up:",
      {
        liste: [
          "email address, username, password (stored in hashed form, never in clear text);",
          "first and last name, profile photograph if you upload one;",
          "professional status, country, region, department, municipality;",
          "date of birth, sex, disability status and its nature: these are optional and serve the statistical monitoring described in article 3;",
          "telephone number and postal address, if you enter them.",
        ],
      },
      "Curriculum vitae data, if you build one:",
      {
        liste: [
          "professional title, summary, experience, education, skills, languages, certifications, interests;",
          "links to your public profiles (personal site, LinkedIn, code repository);",
          "the document you import, where applicable, from which the details are extracted automatically.",
        ],
      },
      "Activity data, produced by your use of the service:",
      {
        liste: [
          "opportunities saved to favourites, opportunities liked, alerts created;",
          "first-hand accounts and comments you publish;",
          "messages exchanged through the internal messaging;",
          "exchanges with the assistant, kept so that you can resume a conversation;",
          "reports sent to the team.",
        ],
      },
      "Technical data: server logs record incoming requests, with a timestamp and a correlation identifier, for security and diagnostic purposes.",
      "The Platform uses no third-party audience measurement tool and carries out no advertising tracking.",
    ],
  },
  {
    id: "finalites",
    titre: "3. Purposes and legal bases",
    contenu: [
      {
        liste: [
          "Creating and managing your account, authenticating you, securing access — necessary to provide the service you request.",
          "Displaying opportunities, managing your favourites and your alerts — necessary to provide the service.",
          "Putting you in touch with partner organisations when you make your curriculum vitae visible — on the basis of your consent, which you may withdraw at any time (article 4).",
          "Sending you service messages: address verification, password reset, notifications, deadline reminders — necessary to provide the service.",
          "Improving the recommendations offered to you and operating the assistant — legitimate interest in providing a useful service.",
          "Producing statistics on usage and on the make-up of our audience, used only in aggregate form — legitimate interest in monitoring and reporting on the work carried out.",
          "Preventing fraud, abusive publications and security incidents — legitimate interest in protecting users.",
        ],
      },
      "Optional information — sex, date of birth, disability status — serves statistical monitoring only. It is never disclosed to partners, never used at an individual level, and in no way conditions access to the service.",
    ],
  },
  {
    id: "partenaires",
    titre: "4. Sharing with partner organisations",
    saillant: true,
    contenu: [
      "Your curriculum vitae is private by default. No partner has access to it until you have activated the visibility setting yourself.",
      "Once you activate it, partners can view your professional background, your education, your skills, your languages, your professional status, and the town or region you have declared.",
      "Your direct contact details — telephone number, postal address, email address — are never passed on to them. First contact goes through the internal messaging, and you remain free not to reply.",
      "Partners may use this data only in connection with published opportunities. They are forbidden from reselling it, transferring it, reusing it for canvassing, or extracting it outside the Platform. These obligations appear in articles 7 and 8 of the terms of use.",
      "Withdrawing visibility ends any further disclosure of your data. A partner who had saved your profile keeps their private note, but your profile ceases to be viewable by them.",
    ],
  },
  {
    id: "prestataires",
    titre: "5. Technical service providers",
    contenu: [
      "The Platform relies on providers acting on its behalf and on its instructions:",
      {
        liste: [
          "Railway — hosting of the application and of the database;",
          "Cloudflare R2 — storage of uploaded files: profile photographs, documents attached to opportunities, organisation logos;",
          "OpenAI — processing of requests sent to the assistant, and extraction of details from an imported curriculum vitae. Only the content needed for the request at hand is transmitted;",
          "Google — only if you choose to sign in with a Google account, to verify your identity with that provider;",
          "an email delivery service, for service-related messages.",
        ],
      },
      "None of these providers is permitted to use your data for its own purposes under our service.",
      "Apart from them, and from partners within the scope described in article 4, your data is disclosed to no one — save where required by a duly empowered judicial or administrative authority.",
    ],
  },
  {
    id: "conservation",
    titre: "6. Retention periods",
    contenu: [
      {
        liste: [
          "Account and curriculum vitae: kept for as long as the account exists, then deleted or anonymised.",
          "Private messages and exchanges with the assistant: kept for as long as the account exists; you may delete a conversation at any time.",
          "Comments and first-hand accounts: kept for as long as they remain published; you may delete them.",
          "Uploaded files: deleted at the same time as the item they are attached to.",
          "Technical logs: kept for a limited period, for security and diagnostic purposes.",
          "Aggregate statistics: kept without time limit, since they no longer identify anyone.",
        ],
      },
      "Closing your account results in the deletion of the data attached to it, subject to anything the law requires to be kept.",
    ],
  },
  {
    id: "securite",
    titre: "7. Security",
    contenu: [
      "Exchanges with the Platform are encrypted in transit. Passwords are stored as cryptographic hashes and cannot be read back, neither by the team nor by anyone else.",
      "Access to data is restricted to the team members who need it to administer the service, and uploaded files are reachable only through the addresses issued by the Platform.",
      "No arrangement removes all risk. In the event of a data breach likely to harm you, you will be informed and the competent authority will be notified.",
    ],
  },
  {
    id: "droits",
    titre: "8. Your rights",
    saillant: true,
    contenu: [
      "Under law no. 2008-12, you have the following rights over data concerning you:",
      {
        liste: [
          "right of access: to know what data is held and to obtain a copy;",
          "right of rectification: to correct inaccurate or incomplete information;",
          "right of erasure: to request deletion of your data, which closing the account carries out;",
          "right to object: to object to processing based on legitimate interest;",
          "withdrawal of consent: to turn off your curriculum vitae's visibility at any time, without calling into question what was done beforehand.",
        ],
      },
      "Most of these rights are exercised directly from your personal area: your profile and your curriculum vitae can be edited at will, visibility is a single setting, and closing your account is available from your settings.",
      "For any other request, write to us from the “Reports” area of your account, or using the contact details given on the home page. You will receive a reply within the statutory time limits.",
    ],
  },
  {
    id: "cookies",
    titre: "9. Cookies and local storage",
    contenu: [
      "The Platform places no advertising or audience-measurement cookie. It uses only what its operation requires:",
      {
        liste: [
          "a “NEXT_LOCALE” cookie, which remembers the display language you chose;",
          "in your browser's local storage: your sign-in tokens, recently used emoji, and the date on which you dismissed the prompt to install the app;",
          "a page cache, managed by the installable app, which lets you read offline what you have already opened.",
        ],
      },
      "None of this is used for tracking. Clearing the site's data from your browser removes it; you will then be signed out.",
    ],
  },
  {
    id: "transferts",
    titre: "10. Transfers outside Senegal",
    contenu: [
      "The providers listed in article 5 operate infrastructure located outside Senegal. Your data may therefore be hosted or processed abroad.",
      "These transfers take place within the framework of the contractual data protection commitments made by those providers, and subject to the formalities required by law no. 2008-12.",
    ],
  },
  {
    id: "mineurs",
    titre: "11. Minors",
    contenu: [
      "The Platform is intended for people of working or training age. An account opened by a minor falls under the authorisation of their legal representatives, who may request its closure.",
    ],
  },
  {
    id: "modification",
    titre: "12. Changes to this policy",
    contenu: [
      "This policy may change, in particular if the service changes or if a new provider is engaged. Any substantial change is brought to users' attention, and the version in force is always the one published on this page.",
    ],
  },
  {
    id: "reclamation",
    titre: "13. Complaints",
    contenu: [
      "If you consider that your rights are not being respected, you may refer the matter to the Personal Data Protection Commission (CDP), the supervisory authority in Senegal.",
    ],
  },
  {
    id: "langue",
    titre: "14. Language of this policy",
    saillant: true,
    contenu: [
      "This English text is a courtesy translation, provided to make the policy readable to non-French speakers.",
      "Only the French version is binding. It prevails in the event of any discrepancy of wording or interpretation between the two texts.",
    ],
  },
];
