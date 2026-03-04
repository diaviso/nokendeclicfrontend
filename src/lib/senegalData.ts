export interface RegionData {
  name: string;
  departements: string[];
}

export const senegalRegions: RegionData[] = [
  {
    name: "Dakar",
    departements: ["Dakar", "Pikine", "Rufisque", "Guédiawaye", "Keur Massar"],
  },
  {
    name: "Diourbel",
    departements: ["Bambey", "Diourbel", "Mbacké"],
  },
  {
    name: "Fatick",
    departements: ["Fatick", "Foundiougne", "Gossas"],
  },
  {
    name: "Kaffrine",
    departements: ["Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"],
  },
  {
    name: "Kaolack",
    departements: ["Kaolack", "Nioro du Rip", "Guinguinéo"],
  },
  {
    name: "Kédougou",
    departements: ["Kédougou", "Salemata", "Saraya"],
  },
  {
    name: "Kolda",
    departements: ["Kolda", "Vélingara", "Médina Yoro Foulah"],
  },
  {
    name: "Louga",
    departements: ["Kébémer", "Linguère", "Louga"],
  },
  {
    name: "Matam",
    departements: ["Kanel", "Matam", "Ranérou"],
  },
  {
    name: "Saint-Louis",
    departements: ["Dagana", "Podor", "Saint-Louis"],
  },
  {
    name: "Sédhiou",
    departements: ["Sédhiou", "Bounkiling", "Goudomp"],
  },
  {
    name: "Tambacounda",
    departements: ["Bakel", "Tambacounda", "Goudiry", "Koumpentoum"],
  },
  {
    name: "Thiès",
    departements: ["Mbour", "Thiès", "Tivaouane"],
  },
  {
    name: "Ziguinchor",
    departements: ["Bignona", "Oussouye", "Ziguinchor"],
  },
];

export function getDepartementsForRegion(regionName: string): string[] {
  if (regionName === "Autre") return ["Autre"];
  const region = senegalRegions.find((r) => r.name === regionName);
  return region ? region.departements : [];
}

export function getAllRegionNames(): string[] {
  return senegalRegions.map((r) => r.name);
}
