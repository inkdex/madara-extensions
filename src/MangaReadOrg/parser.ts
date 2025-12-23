import { MadaraParser } from "../generic/MadaraParser";

export class MangaReadOrgParser extends MadaraParser {
  override parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split(".").map(Number);

    const parseDate = new Date(year, month - 1, day);
    if (parseDate.getFullYear() == year) {
      return parseDate;
    }

    const date: string = dateString.toUpperCase();

    if (date.includes("LESS THAN AN HOUR") || date.includes("JUST NOW")) {
      return new Date();
    }

    if (date.includes("YESTERDAY")) {
      return new Date(Date.now() - 86400000);
    }

    const timeUnits: Record<string, number> = {
      YEAR: 31556952000,
      MONTH: 2592000000,
      WEEK: 604800000,
      DAY: 86400000,
      HOUR: 3600000,
      MINUTE: 60000,
      MINS: 60000,
      SECOND: 1000,
    };

    const match = date.match(/(\d+)\s*(YEAR|MONTH|WEEK|DAY|HOUR|MINUTE|MINS|SECOND)/);
    if (match) {
      const [, numStr, unit] = match;
      const number = Number(numStr);
      return new Date(Date.now() - number * timeUnits[unit]);
    }

    return new Date(date);
  };
}
