import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareError,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    MangaProviding,
    PagedResults,
    PaperbackInterceptor,
    Request,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SourceManga,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { URLBuilder } from "../utils/url-builder/base";
import { genreOptions } from "./genreOptions";
import { genres } from "./genres";

const DOMAIN_NAME = "https://toonily.com";

// Should match the capabilities which you defined in pbconfig.ts
type ToonilyImplementation = Extension &
    DiscoverSectionProviding &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

// Intercepts all the requests and responses and allows you to make changes to them
class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        // request.headers = {
        //   ...request.headers,
        //   referer: DOMAIN_NAME,
        //   origin: DOMAIN_NAME,
        //   "user-agent": await Application.getDefaultUserAgent(),
        //   "Cookie": "toonily-mature=1",
        // };

        request.headers = {
            ...(request.headers ?? {}),
            ...{
                "user-agent": await Application.getDefaultUserAgent(),
                referer: `${DOMAIN_NAME}/`,
                origin: `${DOMAIN_NAME}/`,
                ...(request.url.includes("wordpress.com") && {
                    Accept: "image/avif,image/webp,*/*",
                }), // Used for images hosted on Wordpress blogs
            },
            Cookie: "toonily-mature=1",
        };

        return request;
    }

    override async interceptResponse(
        request: Request,
        response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        return data;
    }
}

// Main extension class
export class ToonilyExtension implements ToonilyImplementation {
    // Implementation of the main rate limiter
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 10,
        bufferInterval: 1,
        ignoreImages: true,
    });

    // Implementation of the main interceptor
    mainInterceptor = new MainInterceptor("main");

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        const get_new_on_toonily: DiscoverSection = {
            id: "get-new-on-toonily",
            title: "New on Toonily",
            type: DiscoverSectionType.featured,
        };

        const get_latest_releases: DiscoverSection = {
            id: "get-latest-releases",
            title: "Latest Releases",
            type: DiscoverSectionType.simpleCarousel,
        };

        const get_trending_section: DiscoverSection = {
            id: "get-trending-section",
            title: "Trending",
            type: DiscoverSectionType.simpleCarousel,
        };

        const get_genre_section: DiscoverSection = {
            id: "get-genre-section",
            title: "Genres",
            type: DiscoverSectionType.genres,
        };

        return [
            get_new_on_toonily,
            get_latest_releases,
            get_trending_section,
            get_genre_section,
        ];
    }

    // Populates both the discover sections
    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Toonily.Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "get-new-on-toonily":
                return this.getNewOnToonily(metadata);
            case "get-latest-releases":
                return this.getLatestReleases(section, metadata);
            case "get-trending-section":
                return this.getTrendingSection(section, metadata);
            case "get-genre-section":
                return this.getGenreSection();
            default:
                return { items: [] };
        }
    }

    // Populates the new on Toonily section
    async getNewOnToonily(
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const items: DiscoverSectionItem[] = [];
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: new URLBuilder(DOMAIN_NAME).build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Extract "New on Toonily" section
        $("section ul li.css-1urdgju").each((_, element) => {
            const unit = $(element);
            const anchor = unit.find("a").first();
            const href = anchor.attr("href") || "";
            const mangaId = href.match(/\/serie\/(.+?)\/?$/)?.[1] || "";
            const image = unit.find("img").attr("data-cfsrc") || "";
            const title = unit.find(".txt span").text().trim();

            if (mangaId && title && image && !collectedIds.includes(mangaId)) {
                collectedIds.push(mangaId);
                items.push(
                    createDiscoverSectionItem({
                        id: mangaId,
                        image: image,
                        title: title,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        // Check if next button exists and is visible
        const nextButton = $(".next_btn_topco-9MoRR_2");
        const hasNextPage =
            nextButton.length > 0 &&
            !nextButton.attr("style")?.includes("display: none");

        return {
            items: items,
            metadata: hasNextPage
                ? {
                      page: page + 1,
                      collectedIds,
                  }
                : undefined,
        };
    }

    // Populates the latest releases section
    async getLatestReleases(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const items: DiscoverSectionItem[] = [];
        const collectedIds = metadata?.collectedIds ?? [];

        //https://toonily.com/page/2/
        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("page")
                .addPath(page.toString())
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Extract manga items from new HTML structure
        $(".page-listing-item .col-6.col-sm-3.col-lg-2").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3.h5 a").first();
            const href = titleLink.attr("href") || "";
            const mangaId = href.match(/\/serie\/(.+?)\/?$/)?.[1] || "";
            const image =
                unit.find("img").attr("src") ||
                unit.find("img").attr("data-src") ||
                "";
            const title = titleLink.text().trim();

            //console.log(`Here lies the ${image}`);

            // Extract latest chapter info
            const chapterItem = unit
                .find(".list-chapter .chapter-item")
                .first();
            const subtitle = chapterItem.find(".chapter a").text().trim();

            if (mangaId && title && image && !collectedIds.includes(mangaId)) {
                collectedIds.push(mangaId);
                items.push(
                    createDiscoverSectionItem({
                        id: mangaId,
                        image: image,
                        title: title,
                        subtitle: subtitle,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        // Check for next page
        const nextPageHref = $(".nextpostslink").attr("href");
        let nextPage: number | undefined;
        if (nextPageHref) {
            const pageMatch = nextPageHref.match(/page\/(\d+)/);
            if (pageMatch) {
                nextPage = parseInt(pageMatch[1], 10);
                console.log(`Next page: ${nextPage}`);
            } else {
                nextPage = page + 1;
            }
        }

        return {
            items: items,
            metadata: nextPage ? { page: nextPage } : undefined,
        };
    }

    // Populates the trending section
    async getTrendingSection(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const items: DiscoverSectionItem[] = [];
        const collectedIds = metadata?.collectedIds ?? [];

        //https://toonily.com/webtoons/?m_orderby=trending
        //https://toonily.com/webtoons/page/2/?m_orderby=trending
        // Build URL with pagination in path
        const urlBuilder = new URLBuilder(DOMAIN_NAME).addPath("webtoons");

        if (page > 1) {
            urlBuilder.addPath("page").addPath(page.toString());
        }

        urlBuilder.addQuery("m_orderby", "trending");

        const request = {
            url: urlBuilder.build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Extract manga items from new HTML structure
        $(".page-listing-item .col-6.col-sm-3.col-lg-2").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3.h5 a").first();
            const href = titleLink.attr("href") || "";
            const mangaId = href.match(/\/serie\/(.+?)\/?$/)?.[1] || "";
            const image =
                unit.find("img").attr("src") ||
                unit.find("img").attr("data-src") ||
                "";
            const title = titleLink.text().trim();

            //console.log(`Here lies the ${image}`);

            // Extract latest chapter info
            const chapterItem = unit
                .find(".list-chapter .chapter-item")
                .first();
            const subtitle = chapterItem.find(".chapter a").text().trim();

            if (mangaId && title && image && !collectedIds.includes(mangaId)) {
                collectedIds.push(mangaId);
                items.push(
                    createDiscoverSectionItem({
                        id: mangaId,
                        image: image,
                        title: title,
                        subtitle: subtitle,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        // Check for next page
        const nextPageHref = $(".nextpostslink").attr("href");
        let nextPage: number | undefined;
        if (nextPageHref) {
            const pageMatch = nextPageHref.match(/page\/(\d+)/);
            if (pageMatch) {
                nextPage = parseInt(pageMatch[1], 10);
            }
        }

        return {
            items: items,
            metadata: nextPage ? { page: nextPage, collectedIds } : undefined,
        };
    }

    // Populates the genre section
    async getGenreSection(): Promise<PagedResults<DiscoverSectionItem>> {
        return {
            items: genres.map((genre) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        { id: "genres", value: { [genre.id]: "included" } },
                    ],
                },
                name: genre.name,
                metadata: undefined,
            })),
        };
    }

    // Populate search filters
    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];

        // Type filter dropdown
        filters.push({
            id: "genres",
            type: "multiselect",
            options: genreOptions,

            allowExclusion: true,
            value: {},
            title: "Genre Filter",
            allowEmptySelection: false,
            maximum: undefined,
        });

        return filters;
    }

    // Populates search
    async getSearchResults(
        query: SearchQuery,
        metadata?: { page?: number },
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        const urlBuilder = new URLBuilder(DOMAIN_NAME).addPath("search");

        // Only add the search term path if it's not empty
        if (query.title && query.title.trim() !== "") {
            // Convert spaces to hyphens instead of encoding them as %20
            const formattedQuery = query.title
                .trim()
                .replace(/\s+/g, "-")
                .replace(/’/g, "'");
            // Don't encode apostrophes as they should remain in the URL
            urlBuilder.addPath(formattedQuery);
        }

        // Add page path
        urlBuilder.addPath("page").addPath(page.toString());

        // Get the filters to access the genre options
        const filters = await this.getSearchFilters();
        const genreFilter = filters.find((f) => f.id === "genres");

        // Define type for the multiselect filter
        interface FilterOption {
            id: string;
            value: string;
        }

        type MultiselectFilter = SearchFilter & {
            type: "multiselect";
            options: FilterOption[];
        };

        // Handle genres
        const genresFilter = query.filters?.find((f) => f.id === "genres")
            ?.value as Record<string, "included" | "excluded">;
        if (genresFilter && genreFilter) {
            const typedGenreFilter = genreFilter as MultiselectFilter;
            let genreIndex = 0;
            Object.entries(genresFilter).forEach(([id, inclusion]) => {
                if (inclusion === "included") {
                    // Get the genre option by id with proper typing
                    const genreOption = typedGenreFilter.options.find(
                        (opt) => opt.id === id,
                    );
                    if (genreOption) {
                        // Format genre value by converting to kebab-case
                        const genreValue = genreOption.value
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        urlBuilder.addQuery(`genre[${genreIndex}]`, genreValue);
                        genreIndex++;
                    }
                }
                // Excluded genres not supported in the provided URL examples
            });
        }

        // Add default query parameters that appear in all example URLs
        urlBuilder.addQuery("op", "");
        urlBuilder.addQuery("author", "");
        urlBuilder.addQuery("artist", "");
        urlBuilder.addQuery("adult", "");

        const searchUrl = urlBuilder.build();
        const request = { url: searchUrl, method: "GET" };
        const $ = await this.fetchCheerio(request);
        const searchResults: SearchResultItem[] = [];

        console.log(`The URL is: ${searchUrl}`);

        $(".page-listing-item .col-6.col-sm-3.col-lg-2").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3.h5 a").first();
            const href = titleLink.attr("href") || "";
            const mangaId = href.split("/serie/")[1]?.replace(/\/$/, "") || "";
            const image =
                unit.find("img").attr("src") ||
                unit.find("img").attr("data-src") ||
                "";
            const title = titleLink.text().trim();

            if (mangaId && title) {
                searchResults.push({
                    mangaId: mangaId,
                    imageUrl: image,
                    title: title,
                    subtitle: undefined, // Add subtitle if needed
                });
            }
        });

        // Check for next page
        const nextPageHref = $(".nextpostslink").attr("href");
        let hasNextPage = false;
        if (nextPageHref) {
            const nextPageMatch = nextPageHref.match(/page\/(\d+)/);
            hasNextPage = !!nextPageMatch;
        }

        return {
            items: searchResults,
            metadata: hasNextPage ? { page: page + 1 } : undefined,
        };
    }

    // Populates the title details
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        console.log(`Here is my ID: ${mangaId}`);
        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("serie")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Extract the primary title
        const title = $(".post-title h1").text().trim();

        // Extract alternative titles
        const altNames: string[] = [];
        $('.summary-heading:contains("Alt Name(s)")')
            .next(".summary-content")
            .each((_, element) => {
                const altName = $(element).text().trim();
                if (altName) altNames.push(altName);
            });

        // Extract thumbnail URL
        // In getMangaDetails function, ensure image URL is valid
        const image =
            $(".summary_image img").attr("data-src") ||
            $(".summary_image img").attr("src") ||
            "";
        const validImage = image.trim();
        // Extract description
        const description = $(".summary__content p").text().trim();

        // Extract status
        let status = "UNKNOWN";
        const statusText = $('.summary-heading:contains("Status")')
            .next(".summary-content")
            .text()
            .trim()
            .toLowerCase();
        if (statusText.includes("ongoing")) {
            status = "ONGOING";
        } else if (statusText.includes("completed")) {
            status = "COMPLETED";
        }

        // Extract authors
        const authors: string[] = [];
        $('.summary-heading:contains("Author(s)")')
            .next(".summary-content")
            .find("a")
            .each((_, element) => {
                authors.push($(element).text().trim());
            });

        // Extract artists
        const artists: string[] = [];
        $('.summary-heading:contains("Artist(s)")')
            .next(".summary-content")
            .find("a")
            .each((_, element) => {
                artists.push($(element).text().trim());
            });

        // Extract genres
        const genres: string[] = [];
        $('.summary-heading:contains("Genre(s)")')
            .next(".summary-content")
            .find("a")
            .each((_, element) => {
                genres.push($(element).text().trim());
            });

        // Extract tags from the Tags section
        const tags: string[] = [];
        $(".wp-manga-tags-list a").each((_, element) => {
            const tag = $(element).text().trim().replace(/^#/, "");
            if (tag) tags.push(tag);
        });

        //console.log(contentRating);

        // Build tag sections
        const tagSections: TagSection[] = [];
        if (genres.length > 0) {
            tagSections.push({
                id: "genres",
                title: "Genres",
                tags: genres.map((genre) => ({
                    id: genre.toLowerCase().replace(/\s+/g, "-"),
                    title: genre,
                })),
            });
        }
        if (tags.length > 0) {
            tagSections.push({
                id: "tags",
                title: "Tags",
                tags: tags.map((tag) => ({
                    id: tag.toLowerCase().replace(/\s+/g, "-"),
                    title: tag,
                })),
            });
        }

        //console.log(`${mangaId}, ${title}, ${validImage}, ${description}, ${status}, ${altNames.join(', ')}, Tag sections count: ${tagSections.length}`);
        return {
            mangaId: mangaId,
            mangaInfo: {
                primaryTitle: title,
                secondaryTitles: altNames,
                thumbnailUrl: validImage,
                synopsis: description,
                contentRating: ContentRating.MATURE,
                status: status as "ONGOING" | "COMPLETED",
                tagGroups: tagSections,
                //authors: authors,
                //artists: artists,
            },
        };
    }

    // Populates the chapter list
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const request = {
            url: `${DOMAIN_NAME}/serie/${sourceManga.mangaId}`,
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);
        const chapters: Chapter[] = [];

        const chapterElements = $(
            "ul.main.version-chap li.wp-manga-chapter, .listing-chapters_wrap li.wp-manga-chapter",
        );

        chapterElements.each((index, element) => {
            const row = $(element);
            const chapterLink = row.find("a");
            const chapterPath = chapterLink.attr("href") || "";

            // Updated regex to capture full chapter identifier
            const chapterIdMatch = chapterPath.match(/(chapter-[\d.]+)/i);
            const chapterId = chapterIdMatch ? chapterIdMatch[1] : "";

            const rawChapterText = chapterLink.text().trim();
            const chapterMatch = rawChapterText.match(
                /Chapter\s*(\d+(?:\.\d+)?)/i,
            );
            const chapterNumber = chapterMatch
                ? parseFloat(chapterMatch[1])
                : 0;

            let publishDate = new Date();
            const dateElement = row.find(".chapter-release-date i");
            if (dateElement.length > 0) {
                try {
                    const rawDate = dateElement.text().trim().replace(/,/g, "");
                    const parsedDate = new Date(rawDate);

                    if (!isNaN(parsedDate.getTime())) {
                        publishDate = parsedDate;
                    }
                } catch (error) {
                    console.error(
                        `Date parsing error for chapter ${rawChapterText}: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            }

            console.log(`Chapter ${index + 1}: 
        Raw Text: ${rawChapterText}
        Chapter Number: ${chapterNumber}
        Chapter Path: ${chapterPath}
        Chapter ID: ${chapterId}`);

            chapters.push({
                chapterId: chapterId,
                //title: rawChapterText,
                sourceManga,
                chapNum: chapterNumber,
                publishDate: publishDate,
                langCode: "en",
            });
        });

        // Add more detailed logging for final chapters array
        console.log(`Total chapters processed: ${chapters.length}`);
        console.log("First 5 chapters:", chapters.slice(0, 5));
        console.log("Last 5 chapters:", chapters.slice(-5));

        return chapters.length > 0 ? chapters.reverse() : [];
    }

    // Populates a chapter with images
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const url = new URLBuilder(DOMAIN_NAME)
            .addPath("serie")
            .addPath(chapter.sourceManga.mangaId)
            .addPath(chapter.chapterId)
            .build();

        const request = {
            url: url,
            method: "GET",
        };

        console.log(`Here is the URL: ${request.url}`);

        try {
            const $ = await this.fetchCheerio(request);
            const pages: string[] = [];

            // Extract image URLs from chapter content
            $(".reading-content img.wp-manga-chapter-img").each((_, img) => {
                const rawSrc = (
                    $(img).attr("data-src") ||
                    $(img).attr("src") ||
                    ""
                ).trim();
                if (rawSrc) {
                    // Ensure absolute URL and filter out ad images
                    const src = rawSrc.startsWith("http")
                        ? rawSrc
                        : `${DOMAIN_NAME}${rawSrc}`;

                    if (!src.includes("999.png")) {
                        pages.push(src);
                    }
                }
            });

            if (pages.length === 0) {
                throw new Error("No pages found in this chapter");
            }

            console.log(`Chapter ${chapter.chapterId}`);
            return {
                id: chapter.chapterId,
                mangaId: chapter.sourceManga.mangaId,
                pages: pages,
            };
        } catch (error) {
            console.error(
                `Chapter details fetch error: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error(
                `Failed to load chapter: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    async fetchCheerio(request: Request): Promise<CheerioAPI> {
        const [response, data] = await Application.scheduleRequest(request);
        this.checkCloudflareStatus(response.status);
        return cheerio.load(Application.arrayBufferToUTF8String(data));
    }

    checkCloudflareStatus(status: number): void {
        if (status === 503 || status === 403) {
            throw new CloudflareError({ url: DOMAIN_NAME, method: "GET" });
        }
    }
}

function createDiscoverSectionItem(options: {
    id: string;
    image: string;
    title: string;
    subtitle?: string;
    type: "simpleCarouselItem";
}): DiscoverSectionItem {
    return {
        type: options.type,
        mangaId: options.id,
        imageUrl: options.image,
        title: options.title,
        subtitle: options.subtitle,
        metadata: undefined,
    };
}

export const Toonily = new ToonilyExtension();
