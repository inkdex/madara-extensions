import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareBypassRequestProviding,
    CloudflareError,
    ContentRating,
    Cookie,
    CookieStorageInterceptor,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    Form,
    MangaProviding,
    PagedResults,
    PaperbackInterceptor,
    Request,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SettingsFormProviding,
    SourceManga,
    TagSection,
    URL,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { MadaraInterceptor } from "./MadaraInterceptor";
import { MadaraParser } from "./MadaraParser";
import { getUsePostIds, MadaraSettings } from "./MadaraSettings";

const BASE_VERSION = "1.0.0-alpha.2";

export function getVersion(
    options?:
        | {
              increaseMajor?: number;
              increaseMinor?: number;
              increasePatch?: number;
          }
        | {
              increasePrerelease: number;
          },
): string {
    if (!options) {
        return BASE_VERSION;
    }

    const baseParts = BASE_VERSION.split("-");
    const versionNumbers = baseParts[0].split(".").map(Number);
    const isPrerelease = baseParts.length > 1;

    if (versionNumbers.length < 3) {
        throw new Error(
            `Invalid BASE_VERSION: '${BASE_VERSION}'. Expected format: 'X.Y.Z' or 'X.Y.Z-prerelease.N'`,
        );
    }

    if ("increasePrerelease" in options) {
        if (!isPrerelease) {
            throw new Error(
                "Cannot set a prerelease number on a stable version.",
            );
        }

        const prereleaseParts = baseParts[1].split(".");
        if (prereleaseParts.length < 2 || isNaN(Number(prereleaseParts[1]))) {
            throw new Error(
                `Invalid prerelease format in BASE_VERSION: '${BASE_VERSION}'. Expected format: 'X.Y.Z-prerelease.N'`,
            );
        }

        const newPrereleaseNum =
            Number(prereleaseParts[1]) + options.increasePrerelease;
        return `${baseParts[0]}-${prereleaseParts[0]}.${newPrereleaseNum}`;
    }

    if (isPrerelease) {
        throw new Error(
            "BASE_VERSION is a prerelease. Use increasePrerelease option instead.",
        );
    }

    const hasVersionIncrement =
        options.increaseMajor !== undefined ||
        options.increaseMinor !== undefined ||
        options.increasePatch !== undefined;

    if (!hasVersionIncrement) {
        throw new Error(
            "Empty options object provided. Either specify version increments or call getVersion() with no arguments.",
        );
    }

    const newMajor = versionNumbers[0] + (options.increaseMajor || 0);
    const newMinor = versionNumbers[1] + (options.increaseMinor || 0);
    const newPatch = versionNumbers[2] + (options.increasePatch || 0);

    return `${newMajor}.${newMinor}.${newPatch}`;
}

export interface GenericParams {
    name: string;
    domain: string;
    contentRating: ContentRating;
    language: string;
    usePostIds: boolean;
    searchPagePathName?: string;
    searchMangaSelector?: string;
    searchRatingSelector?: string;
    hasProtectedChapters?: boolean;
    protectedChapterDataSelector?: string;
    chapterEndpoint?: number;
    chapterDetailsSelector?: string;
    bypassPage?: string;
    useListParameter?: boolean;
    directoryPath?: string;
    parser?: MadaraParser;
    requestManager?: PaperbackInterceptor;
}

type Metadata = {
    page?: number;
    completed?: boolean;
};

export abstract class MadaraGeneric
    implements
        Extension,
        SearchResultsProviding,
        MangaProviding,
        ChapterProviding,
        DiscoverSectionProviding,
        SettingsFormProviding,
        CloudflareBypassRequestProviding
{
    /**
     * The Madara URL of the website. Eg. https://webtoon.xyz
     */
    readonly domain: string;

    /**
     * The readable name of the website. Eg. Toonily
     */
    readonly name: string;

    /**
     * The default content rating. Eg. Hiperdex = Adult
     */
    readonly defaultContentRating: ContentRating;

    /**
     * The language code the source's content is served in in string form.
     */
    readonly language: string;

    /**
     * If it's not possible to use postIds for certain reasons, you can disable this here.
     */
    readonly usePostIds: boolean;

    /**
     * The path used for search pagination. Used in search function.
     * Eg. for https://mangabob.com/page/2/?s&post_type=wp-manga it would be 'page'
     */
    readonly searchPagePathName: string;

    /**
     * Different Madara sources might have a slightly different selector which is required to parse out
     * each manga object while on a search result page. This is the selector
     * which is looped over. This may be overridden if required.
     */
    readonly searchMangaSelector: string;

    /**
     * The selector used for the average rating.
     */
    readonly searchRatingSelector: string;

    /**
     * Set to true if the source makes use of the manga chapter protector plugin.
     * (https://mangabooth.com/product/wp-manga-chapter-protector/)
     */
    readonly hasProtectedChapters: boolean;

    /**
     * Some sources may in the future change how to get the chapter protector data,
     * making it configurable, will make it way more flexible and open to customized installations of the protector plugin.
     */
    readonly protectedChapterDataSelector: string;

    /**
     * Some sites use the alternate URL for getting chapters through ajax
     * 0: (POST) Form data https://domain.com/wp-admin/admin-ajax.php
     * 1: (POST) Alternative Ajax page (https://domain.com/manga/manga-slug/ajax/chapters)
     * 2: (POST) Manga page (https://domain.com/manga/manga-slug)
     * 3: (GET) (DEFAULT) Manga page (https://domain.com/manga/manga-slug)
     */
    readonly chapterEndpoint: number;

    /**
     * Different Madara sources might have a slightly different selector which is required to parse out
     * each page while on a chapter page. This is the selector
     * which is looped over. This may be overridden if required.
     */
    readonly chapterDetailsSelector: string;

    /**
     * Some websites have the Cloudflare defense check enabled on specific parts of the website, these need to be loaded when using the Cloudflare bypass within the app
     */
    readonly bypassPage: string;

    /**
     * THe directory path is need to fetch Discovery Sections, however it mostly done automatically, set this when the parser fails!
     */
    readonly directoryPath: string;

    /**
     * Some sources may redirect to the manga page instead of the chapter page if adding the parameter '?style=list'
     */
    readonly useListParameter: boolean;

    parser: MadaraParser;

    requestManager: PaperbackInterceptor;

    /**
     *
     */
    constructor(params: GenericParams) {
        this.name = params.name;
        this.domain = params.domain;
        this.defaultContentRating =
            params.contentRating ?? ContentRating.EVERYONE;
        this.language = params.language ?? "🇬🇧";
        this.usePostIds = params.usePostIds ?? true;
        this.searchPagePathName = params.searchPagePathName ?? "page";
        this.searchMangaSelector =
            params.searchMangaSelector ?? "div.c-tabs-item__content";
        this.searchRatingSelector = params.searchRatingSelector ?? "span.score";
        this.hasProtectedChapters = params.hasProtectedChapters ?? false;
        this.protectedChapterDataSelector =
            params.protectedChapterDataSelector ?? "#chapter-protector-data";
        this.chapterEndpoint = params.chapterEndpoint ?? 3;
        this.chapterDetailsSelector =
            params.chapterDetailsSelector ?? "div.page-break > img";
        this.bypassPage = params.bypassPage ?? "";
        this.directoryPath = params.directoryPath ?? "";
        this.useListParameter = params.useListParameter ?? true;
        this.parser = params.parser ?? new MadaraParser();
        this.requestManager =
            params.requestManager ?? new MadaraInterceptor("main", this);
    }

    globalRateLimiter = new BasicRateLimiter("ratelimiter", {
        numberOfRequests: 20,
        bufferInterval: 1,
        ignoreImages: true,
    });

    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });

    async initialise(): Promise<void> {
        this.cookieStorageInterceptor.registerInterceptor();
        this.globalRateLimiter.registerInterceptor();
        this.requestManager?.registerInterceptor();
    }

    async getSettingsForm(): Promise<Form> {
        return new MadaraSettings(this);
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const [response, buffer] = await Application.scheduleRequest({
            url: getUsePostIds(this.usePostIds)
                ? `${this.domain}/?p=${mangaId}/`
                : `${this.domain}/temp_dirpath/${mangaId}/`,
            method: "GET",
        });
        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return this.parser.parseMangaDetails($, mangaId, this);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        let requestConfig: Request;
        let mangaId = sourceManga.mangaId;

        if (getUsePostIds(this.usePostIds)) {
            const postData = await this.convertPostIdToSlug(Number(mangaId));
            mangaId = postData.slug;
        }

        switch (this.chapterEndpoint) {
            case 0:
                requestConfig = {
                    url: `${this.domain}/wp-admin/admin-ajax.php`,
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    body: {
                        action: "manga_get_chapters",
                        manga: getUsePostIds(this.usePostIds)
                            ? mangaId
                            : await this.convertSlugToPostId(mangaId),
                    },
                };
                break;

            case 1:
                requestConfig = {
                    url: `${this.domain}/temp_dirpath/${mangaId}/ajax/chapters`,
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                };
                break;

            case 2:
                requestConfig = {
                    url: `${this.domain}/temp_dirpath/${mangaId}`,
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                };
                break;

            case 3:
                requestConfig = {
                    url: `${this.domain}/temp_dirpath/${mangaId}`,
                    method: "GET",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                };
                break;

            default:
                throw new Error("Invalid chapter endpoint!");
        }

        const [response, buffer] =
            await Application.scheduleRequest(requestConfig);
        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        return this.parser.parseChapterList($, sourceManga, this);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const mangaId = chapter.sourceManga.mangaId;
        const chapterId = chapter.chapterId;

        const url = new URL(this.domain).addPathComponent("temp_dirpath");

        if (getUsePostIds(this.usePostIds)) {
            const slugData = await this.convertPostIdToSlug(Number(mangaId));
            url.addPathComponent(slugData.slug);
        } else {
            url.addPathComponent(mangaId);
        }

        url.addPathComponent(chapterId);

        if (this.useListParameter) {
            url.setQueryItem("style", "list");
        }

        const [response, buffer] = await Application.scheduleRequest({
            url: url.toString(),
            method: "GET",
        });
        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        if (this.hasProtectedChapters) {
            return this.parser.parseProtectedChapterDetails(
                $,
                chapter,
                this.protectedChapterDataSelector,
                this,
            );
        }

        return this.parser.parseChapterDetails(
            $,
            chapter,
            this.chapterDetailsSelector,
            this,
        );
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "new_series",
                title: "New Series",
                type: DiscoverSectionType.featured,
            },
            {
                id: "recently_updated",
                title: "Recently Updated",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "currently_trending",
                title: "Currently Trending",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "most_popular",
                title: "Most Popular",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        let param = "";
        const page = metadata?.page ?? 1;

        switch (section.id) {
            case "new_series":
                param = "?m_orderby=new-manga";
                break;
            case "recently_updated":
                param = "?m_orderby=latest";
                break;
            case "currently_trending":
                param = "?m_orderby=trending";
                break;
            case "most_popular":
                param = "?m_orderby=views";
                break;

            default:
                throw new Error("Invalid sectionId provided!");
        }

        const [response, buffer] = await Application.scheduleRequest({
            url: `${this.domain}/temp_dirpath/page/${page}/${param}`,
            method: "GET",
        });
        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        const items = await this.parser.parseDiscoverSections($, section, this);

        metadata = { page: page + 1 }; // Madara doesn't support last page checking, will return 404 on website!

        return {
            items: items,
            metadata: metadata,
        };
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const [response, buffer] = await Application.scheduleRequest({
            url: `${this.domain}/?s=&post_type=wp-manga`,
            method: "GET",
        });
        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        const tagSections = await this.parser.parseSearchTags($);
        const genreTags = tagSections.find(
            (x) => x.id === "genres",
        ) as TagSection;

        return [
            {
                type: "multiselect",
                options: genreTags.tags.map((x) => ({
                    id: x.id,
                    value: x.title,
                })),
                id: genreTags.id,
                allowExclusion: false,
                title: genreTags.title,
                value: {},
                allowEmptySelection: true,
                maximum: undefined,
            },
        ];
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;

        const [response, buffer] = await this.constructSearchRequest(
            page,
            query,
        );

        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        const results = await this.parser.parseSearchResults($, this);

        const items: SearchResultItem[] = [];

        for (const result of results) {
            if (getUsePostIds(this.usePostIds)) {
                const postId = await this.slugToPostId(result.slug); // Slug is not encoded

                items.push({
                    mangaId: postId,
                    imageUrl: result.image,
                    title: result.title,
                    subtitle: result.subtitle,
                });
            } else {
                items.push({
                    mangaId: result.slug,
                    imageUrl: result.image,
                    title: result.title,
                    subtitle: result.subtitle,
                });
            }
        }

        return {
            items: items,
            metadata: { page: page + 1 }, // Madara doesn't support last page checking, will return 404 on website!
        };
    }

    async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
        // Clear all the cookies
        for (const cookie of cookies) {
            this.cookieStorageInterceptor.deleteCookie(cookie);
        }

        // Set all the cookies
        for (const cookie of cookies) {
            this.cookieStorageInterceptor.setCookie(cookie);
        }
    }

    // Utility
    constructSearchRequest(page: number, query: SearchQuery) {
        const urlBuilder = new URL(this.domain)
            .addPathComponent(this.searchPagePathName)
            .addPathComponent(page.toString())
            .setQueryItem(
                "s",
                encodeURIComponent(this.sanitizeQuery(query?.title ?? "")),
            )
            .setQueryItem("post_type", "wp-manga");

        const genreFilters = Object.keys(
            query.filters.find((x) => x.id === "genres")?.value ?? {},
        );

        if (genreFilters.length) {
            genreFilters.forEach((genre, i) =>
                urlBuilder.setQueryItem(`genre[${i}]`, genre),
            );
            urlBuilder.setQueryItem("op", "1");
        }

        return Application.scheduleRequest({
            url: urlBuilder.toString(),
            method: "GET",
        });
    }

    sanitizeQuery(query: string): string {
        return query
            .replace(/'[^ ]*/g, "") // Remove apostrophes and the following characters up to a space
            .replace(/\.+/g, "") // Remove all periods
            .replace(/["']/g, "") // Remove quotes
            .trim();
    }

    async slugToPostId(slug: string): Promise<string> {
        const postIdState = Application.getState(slug) as string;

        if (!postIdState || postIdState == null) {
            const postId = await this.convertSlugToPostId(slug);

            const existingMappedSlug = await Application.getState(postId);
            if (existingMappedSlug != "") {
                Application.setState(slug, "");
            }

            Application.setState(postId, slug);
            Application.setState(slug, postId);
        }

        const postId = Application.getState(slug) as string;

        if (!postId) throw new Error(`Unable to fetch postId for slug:${slug}`);

        return postId;
    }

    async convertPostIdToSlug(postId: number) {
        const [, buffer] = await Application.scheduleRequest({
            url: `${this.domain}/?p=${postId}`,
            method: "GET",
        });

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        let parseSlug: string;
        // Step 1: Try to get slug from og-url
        parseSlug = $('meta[property="og:url"]').attr("content") ?? "";

        // Step 2: Try to get slug from canonical
        if (!parseSlug.includes(this.domain)) {
            parseSlug = $('link[rel="canonical"]').attr("href") ?? "";
        }

        if (!parseSlug || !parseSlug.includes(this.domain)) {
            throw new Error("Unable to parse slug!");
        }

        const parseSlugArray = parseSlug.replace(/\/$/, "").split("/");

        const slug: string = parseSlugArray.slice(-1).pop() ?? "";
        const path: string = parseSlugArray.slice(-2).shift() ?? "";

        return { path, slug };
    }

    async convertSlugToPostId(slug: string): Promise<string> {
        // Credit to the MadaraDex team :-D
        const [headResponse] = await Application.scheduleRequest({
            url: `${this.domain}/temp_dirpath/${slug}`,
            method: "HEAD",
        });

        let postId;

        const postIdRegex = headResponse?.headers?.["link"]?.match(/\?p=(\d+)/);
        if (postIdRegex && postIdRegex[1]) postId = postIdRegex[1];
        if (postId && !isNaN(Number(postId))) {
            // If postId AND is a number, return the postId
            return postId;
        }

        // Move on to the alternative method of parsing
        const [, buffer] = await Application.scheduleRequest({
            url: `${this.domain}/temp_dirpath/${slug}`,
            method: "GET",
        });

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        // Step 1: Try to get postId from shortlink
        postId = $('link[rel="shortlink"]')?.attr("href")?.split("/?p=")[1];

        // Step 2: If no number has been found, try to parse from data-post
        if (isNaN(Number(postId))) {
            postId = $("a.wp-manga-action-button").attr("data-post");
        }

        // Step 3: If no number has been found, try to parse from manga script
        if (isNaN(Number(postId))) {
            const page = $.root().html();
            const match = page?.match(/manga_id["']?\s*:\s*["']?(\d+)/);
            if (match && match[1]) {
                postId = match[1]?.trim();
            }
        }

        if (!postId || isNaN(Number(postId))) {
            throw new Error(
                `Unable to fetch numeric postId for this item! (slug:${slug})`,
            );
        }

        return postId;
    }

    async getDirectoryPath(): Promise<string> {
        // Always use the override if set
        if (this.directoryPath) {
            return this.directoryPath;
        }

        const getPath = Application.getState(
            `dirpath_${this.domain}`,
        ) as string;
        // Return stored path
        if (getPath) {
            return getPath;
        }

        const [response, buffer] = await Application.scheduleRequest({
            url: `${this.domain}/?s=&post_type=wp-manga#directoryRequest`,
            method: "GET",
        });

        await this.checkResponseError(response);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        const path = this.parser.parseDirectoryPath($, this); // Returns "manga" (default) if unable to parse

        // Store parsed path else store the default (manga)
        Application.setState(path, `dirpath_${this.domain}`);
        return path;
    }

    async checkResponseError(response: Response): Promise<void> {
        const status = response.status;
        switch (status) {
            case 403:
            case 503:
                throw new CloudflareError(
                    {
                        url: this.bypassPage ? this.bypassPage : this.domain,
                        method: "GET",
                        headers: {
                            referer: `${this.domain}/`,
                            origin: `${this.domain}/`,
                            "user-agent":
                                await Application.getDefaultUserAgent(),
                        },
                    },
                    "Cloudflare detected!\nPlease do the Cloudflare bypass to continue!",
                );
            case 404:
                throw new Error(
                    `The requested page ${response.url} was not found!`,
                );
        }
    }
}
