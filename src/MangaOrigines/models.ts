import type { SortingOption } from "@paperback/types";

export type Metadata = {
  page?: number;
  completed?: boolean;
};

export const SORTING_OPTIONS: SortingOption[] = [
  { id: "recents", label: "Récents" },
  { id: "populaire", label: "Populaire" },
  { id: "notes", label: "Mieux Notés" },
  { id: "az", label: "A-Z" },
];
