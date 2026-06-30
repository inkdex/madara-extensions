/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const BOOK_TYPES = ["MangaToon", "Manwha", "Manhwa", "Manhua", "Manga"] as const;
export type BookType = (typeof BOOK_TYPES)[number];

export interface ParsedSynopsis {
  bookTypes: BookType[];
  alternativeNames: string[];
  synopsis: string;
}
