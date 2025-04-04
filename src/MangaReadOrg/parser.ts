import { MadaraParser } from "../generic/MadaraParser";

export class MangaReadOrgParser extends MadaraParser {
    override parseDate = (dateString: string) => {
        const [day, month, year] = dateString.split(".").map(Number);
        return new Date(year, month - 1, day);
    };
}
