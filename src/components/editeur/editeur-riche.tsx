"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
// `extension-table` n'expose pas d'export par défaut, contrairement aux
// autres : ses composants se prennent nommément.
import { Table, TableCell, TableHeader } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Loader2,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { envoyerImageContenu, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Éditeur de contenu d'annonce.
 *
 * Le balisage produit ici n'est jamais tenu pour sûr : il est assaini par le
 * serveur à l'enregistrement, sur une liste blanche. La barre d'outils ne
 * propose donc que ce que cette liste accepte — offrir un bouton dont le
 * résultat serait retiré au premier enregistrement serait pire que de ne pas
 * l'offrir.
 */

function Bouton({
  actif,
  titre,
  onClick,
  desactive,
  children,
}: {
  actif?: boolean;
  titre: string;
  onClick: () => void;
  desactive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titre}
      aria-label={titre}
      aria-pressed={actif}
      disabled={desactive}
      // `onMouseDown` plutôt que `onClick` : un clic ordinaire retire d'abord
      // le focus de l'éditeur, et la sélection sur laquelle porte la commande
      // est perdue avant qu'elle ne s'exécute.
      onMouseDown={(evenement) => {
        evenement.preventDefault();
        onClick();
      }}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:pointer-events-none disabled:opacity-40",
        actif
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Separateur() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

function BarreOutils({ editeur }: { editeur: Editor }) {
  const poserLien = useCallback(() => {
    const actuel = editeur.getAttributes("link").href as string | undefined;
    const saisi = window.prompt("Adresse du lien", actuel ?? "https://");
    if (saisi === null) return;

    if (!saisi.trim()) {
      editeur.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Une adresse sans protocole est interprétée comme un chemin relatif :
    // « exemple.sn » mènerait à « /offres/exemple.sn ».
    const adresse = /^https?:\/\/|^mailto:|^tel:/.test(saisi.trim())
      ? saisi.trim()
      : `https://${saisi.trim()}`;

    editeur.chain().focus().extendMarkRange("link").setLink({ href: adresse }).run();
  }, [editeur]);

  const champFichier = useRef<HTMLInputElement>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const deposerImage = useCallback(
    async (fichier: File) => {
      setEnvoiEnCours(true);
      try {
        const { url } = await envoyerImageContenu(fichier);
        // Le texte alternatif est demandé après coup : l'image est déjà
        // déposée, et refuser l'insertion faute de description perdrait le
        // fichier. Laissé vide, il reste corrigeable dans le balisage.
        const texte =
          window.prompt(
            "Décrivez l'image en quelques mots (pour les lecteurs d'écran)",
            fichier.name.replace(/\.[^.]+$/, ""),
          ) ?? "";
        editeur.chain().focus().setImage({ src: url, alt: texte }).run();
      } catch (cause) {
        toast.error("Image non déposée", { description: errorMessage(cause) });
      } finally {
        setEnvoiEnCours(false);
      }
    },
    [editeur],
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
      <Bouton
        titre="Gras"
        actif={editeur.isActive("bold")}
        onClick={() => editeur.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </Bouton>
      <Bouton
        titre="Italique"
        actif={editeur.isActive("italic")}
        onClick={() => editeur.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </Bouton>
      <Bouton
        titre="Souligné"
        actif={editeur.isActive("underline")}
        onClick={() => editeur.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </Bouton>
      <Bouton
        titre="Barré"
        actif={editeur.isActive("strike")}
        onClick={() => editeur.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </Bouton>
      <Bouton
        titre="Code"
        actif={editeur.isActive("code")}
        onClick={() => editeur.chain().focus().toggleCode().run()}
      >
        <Code2 className="size-4" />
      </Bouton>

      <Separateur />

      <Bouton
        titre="Titre de section"
        actif={editeur.isActive("heading", { level: 2 })}
        onClick={() => editeur.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </Bouton>
      <Bouton
        titre="Sous-titre"
        actif={editeur.isActive("heading", { level: 3 })}
        onClick={() => editeur.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </Bouton>

      <Separateur />

      <Bouton
        titre="Liste à puces"
        actif={editeur.isActive("bulletList")}
        onClick={() => editeur.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Bouton>
      <Bouton
        titre="Liste numérotée"
        actif={editeur.isActive("orderedList")}
        onClick={() => editeur.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Bouton>
      <Bouton
        titre="Citation"
        actif={editeur.isActive("blockquote")}
        onClick={() => editeur.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </Bouton>
      <Bouton
        titre="Séparateur"
        onClick={() => editeur.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </Bouton>

      <Separateur />

      {(
        [
          ["left", AlignLeft, "Aligner à gauche"],
          ["center", AlignCenter, "Centrer"],
          ["right", AlignRight, "Aligner à droite"],
          ["justify", AlignJustify, "Justifier"],
        ] as const
      ).map(([valeur, Icone, titre]) => (
        <Bouton
          key={valeur}
          titre={titre}
          actif={editeur.isActive({ textAlign: valeur })}
          onClick={() => editeur.chain().focus().setTextAlign(valeur).run()}
        >
          <Icone className="size-4" />
        </Bouton>
      ))}

      <Separateur />

      <Bouton titre="Insérer un lien" actif={editeur.isActive("link")} onClick={poserLien}>
        <Link2 className="size-4" />
      </Bouton>
      <Bouton
        titre="Retirer le lien"
        desactive={!editeur.isActive("link")}
        onClick={() => editeur.chain().focus().unsetLink().run()}
      >
        <Link2Off className="size-4" />
      </Bouton>
      <input
        ref={champFichier}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(evenement) => {
          const fichier = evenement.target.files?.[0];
          if (fichier) void deposerImage(fichier);
          // Réinitialisé pour que redéposer le même fichier déclenche à
          // nouveau l'événement.
          evenement.target.value = "";
        }}
      />
      <Bouton
        titre="Insérer une image"
        desactive={envoiEnCours}
        onClick={() => champFichier.current?.click()}
      >
        {envoiEnCours ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
      </Bouton>
      <Bouton
        titre="Insérer un tableau"
        onClick={() =>
          editeur
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        <TableIcon className="size-4" />
      </Bouton>

      <Separateur />

      <Bouton
        titre="Annuler"
        desactive={!editeur.can().undo()}
        onClick={() => editeur.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </Bouton>
      <Bouton
        titre="Rétablir"
        desactive={!editeur.can().redo()}
        onClick={() => editeur.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </Bouton>
    </div>
  );
}

export function EditeurRiche({
  valeur,
  onChange,
  placeholder = "Rédigez l'annonce : missions, profil recherché, conditions…",
  className,
}: {
  valeur: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editeur = useEditor({
    // Le rendu serveur d'un éditeur n'a aucun intérêt et provoque un écart
    // d'hydratation : il est monté côté navigateur uniquement.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // Le lien est configuré à part, avec ses propres règles de sécurité.
        link: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: valeur,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose-annonce min-h-[22rem] max-w-none px-4 py-3 outline-none",
      },
    },
  });

  // Le contenu peut changer sans que l'éditeur en soit la cause : chargement
  // d'une offre existante, réinitialisation du formulaire. La comparaison
  // évite de replacer le curseur à chaque frappe.
  useEffect(() => {
    if (!editeur) return;
    if (valeur !== editeur.getHTML()) {
      editeur.commands.setContent(valeur, { emitUpdate: false });
    }
  }, [valeur, editeur]);

  if (!editeur) {
    return (
      <div
        className={cn(
          "min-h-[26rem] animate-pulse rounded-xl border bg-muted/30",
          className,
        )}
      />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-background", className)}>
      <BarreOutils editeur={editeur} />
      <EditorContent editor={editeur} />
    </div>
  );
}
