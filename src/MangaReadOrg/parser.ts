import { MadaraParser } from "../generic/MadaraParser";

export class MangaReadOrgParser extends MadaraParser {
    override parseDate = (dateString: string) => {
        dateString = dateString.toLowerCase();
        const firstNumber = Number(dateString.match(/\d+/g)?.[0]);

        if (
            dateString.includes("les than an hour") ||
            dateString.includes("now")
        )
            return new Date(Date.now());
        // include yesterday with undefined firstNumber so 1
        if (dateString.includes("day"))
            return new Date(
                Date.now() - (firstNumber ?? 1) * 24 * 60 * 60 * 1000,
            );
        if (dateString.includes("hour"))
            return new Date(Date.now() - firstNumber * 60 * 60 * 1000);
        if (dateString.includes("min"))
            return new Date(Date.now() - firstNumber * 60 * 1000);
        if (dateString.includes("sec"))
            return new Date(Date.now() - firstNumber * 1000);

        const [day, month, year] = dateString.split(".").map(Number);
        return new Date(year, month - 1, day);
    };
}
