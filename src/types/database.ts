export type TypeInscription = "exposant" | "partenaire_officiel" | "visiteur";

export type StatutPipeline =
  | "nouveau"
  | "urgent_a_contacter"
  | "contacte"
  | "indisponible"
  | "relance"
  | "dossier_en_cours"
  | "rdv_programme"
  | "converti"
  | "perdu";

export type TypeInteraction =
  | "appel"
  | "email"
  | "whatsapp"
  | "rdv"
  | "relance"
  | "note";

export type Lead = {
  id: string;
  created_at: string;
  nom_complet: string;
  entreprise: string;
  poste: string | null;
  telephone: string;
  email: string;
  type_inscription: TypeInscription;
  source: string;
  statut_pipeline: StatutPipeline;
  prochaine_action: string | null;
  prochaine_action_date: string | null;
  assigne_a: string | null;
  notes_generales: string | null;
};

export type Interaction = {
  id: string;
  lead_id: string;
  created_at: string;
  type_interaction: TypeInteraction;
  resultat: string | null;
  commentaire: string | null;
  date_rdv: string | null;
  cree_par: string | null;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: Partial<Lead> &
          Pick<
            Lead,
            "nom_complet" | "entreprise" | "telephone" | "email" | "type_inscription"
          >;
        Update: Partial<Lead>;
        Relationships: [];
      };
      interactions: {
        Row: Interaction;
        Insert: Partial<Interaction> & Pick<Interaction, "lead_id" | "type_interaction">;
        Update: Partial<Interaction>;
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
