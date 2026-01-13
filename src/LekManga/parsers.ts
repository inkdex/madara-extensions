/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { MadaraParser } from "../generic/parsers";

export class LekMangaParser extends MadaraParser {
  override parseDate = (date: string): Date => {
    date = date.toUpperCase().trim();

    if (date.includes("قبل ساعة") || date.includes("الان")) {
      return new Date();
    }
    if (date.includes("يومين")) {
      return new Date(Date.now() - 2 * 86400000);
    }

    const timeUnits: Record<string, number> = {
      سنة: 31556952000,
      سنوات: 31556952000,
      شهر: 2592000000,
      شهور: 2592000000,
      اسبوع: 604800000,
      اسابيع: 604800000,
      اسبوعين: 604800000,
      يوم: 86400000,
      ايام: 86400000,
      ساعة: 3600000,
      ساعات: 3600000,
      دقيقة: 60000,
      دقائق: 60000,
      ثانية: 1000,
      ثواني: 1000,
      ثانيا: 1000,
    };

    const match = date.match(
      /(\d+)\s*(سنة|سنوات|شهر|شهور|اسبوع|اسبوعين|اسابيع|يوم|ايام|ساعة|ساعات|دقيقة|دقائق|ثانية|ثواني|ثانيا)/,
    );
    if (match) {
      const [, numStr, unit] = match;
      const number = Number(numStr);
      return new Date(Date.now() - number * timeUnits[unit]);
    }

    const arabicMonths: Record<string, string> = {
      يناير: "January",
      فبراير: "February",
      مارس: "March",
      أبريل: "April",
      ابريل: "April",
      مايو: "May",
      يونيو: "June",
      يوليو: "July",
      أغسطس: "August",
      اغسطس: "August",
      سبتمبر: "September",
      أكتوبر: "October",
      اكتوبر: "October",
      نوفمبر: "November",
      ديسمبر: "December",
    };

    Object.entries(arabicMonths).forEach(([arabic, english]) => {
      date = date.replace(new RegExp(arabic, "gi"), english);
    });

    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };
}
