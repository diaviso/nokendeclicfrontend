export interface RegionData {
  name: string;
  departements: string[];
}

/** Découpage administratif du Sénégal : 14 régions et leurs départements. */
export const SENEGAL_REGIONS: RegionData[] = [
  { name: "Dakar", departements: ["Dakar", "Guédiawaye", "Keur Massar", "Pikine", "Rufisque"] },
  { name: "Diourbel", departements: ["Bambey", "Diourbel", "Mbacké"] },
  { name: "Fatick", departements: ["Fatick", "Foundiougne", "Gossas"] },
  { name: "Kaffrine", departements: ["Birkelane", "Kaffrine", "Koungheul", "Malem-Hodar"] },
  { name: "Kaolack", departements: ["Guinguinéo", "Kaolack", "Nioro du Rip"] },
  { name: "Kédougou", departements: ["Kédougou", "Salémata", "Saraya"] },
  { name: "Kolda", departements: ["Kolda", "Médina Yoro Foulah", "Vélingara"] },
  { name: "Louga", departements: ["Kébémer", "Linguère", "Louga"] },
  { name: "Matam", departements: ["Kanel", "Matam", "Ranérou"] },
  { name: "Saint-Louis", departements: ["Dagana", "Podor", "Saint-Louis"] },
  { name: "Sédhiou", departements: ["Bounkiling", "Goudomp", "Sédhiou"] },
  { name: "Tambacounda", departements: ["Bakel", "Goudiry", "Koumpentoum", "Tambacounda"] },
  { name: "Thiès", departements: ["Mbour", "Thiès", "Tivaouane"] },
  { name: "Ziguinchor", departements: ["Bignona", "Oussouye", "Ziguinchor"] },
];

export const REGION_NAMES = SENEGAL_REGIONS.map((r) => r.name);

export function departementsFor(region?: string | null): string[] {
  if (!region) return [];
  return SENEGAL_REGIONS.find((r) => r.name === region)?.departements ?? [];
}
