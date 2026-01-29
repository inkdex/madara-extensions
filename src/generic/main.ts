/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  ContentRating,
  type Cookie,
  CookieStorageInterceptor,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  DiscoverSectionType,
  type Extension,
  Form,
  type MangaProviding,
  type PagedResults,
  PaperbackInterceptor,
  type Request,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SourceManga,
  type TagSection,
  URL,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { MadaraInterceptor } from "./network";
import { MadaraParser } from "./parsers";
import { getUsePostIds, MadaraSettings } from "./forms";

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
  userAgent?: string;
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
   * The directory path is need to fetch Discovery Sections, however it mostly done automatically, set this when the parser fails!
   */
  readonly directoryPath: string;

  /**
   * Some sources may redirect to the manga page instead of the chapter page if adding the parameter '?style=list'
   */
  readonly useListParameter: boolean;

  /**
   * Allows providing a custom user agent without replacing the whole interceptor.
   */
  readonly userAgent?: string;

  parser: MadaraParser;

  requestManager: PaperbackInterceptor;

  /**
   *
   */
  constructor(params: GenericParams) {
    this.name = params.name;
    this.domain = params.domain;
    this.defaultContentRating = params.contentRating ?? ContentRating.EVERYONE;
    this.language = params.language ?? "🇬🇧";
    this.usePostIds = params.usePostIds ?? true;
    this.searchPagePathName = params.searchPagePathName ?? "page";
    this.searchMangaSelector = params.searchMangaSelector ?? "div.c-tabs-item__content";
    this.searchRatingSelector = params.searchRatingSelector ?? "span.score";
    this.hasProtectedChapters = params.hasProtectedChapters ?? false;
    this.protectedChapterDataSelector =
      params.protectedChapterDataSelector ?? "#chapter-protector-data";
    this.chapterEndpoint = params.chapterEndpoint ?? 3;
    this.chapterDetailsSelector = params.chapterDetailsSelector ?? "div.page-break > img";
    this.bypassPage = params.bypassPage ?? "";
    this.directoryPath = params.directoryPath ?? "";
    this.useListParameter = params.useListParameter ?? true;
    this.parser = params.parser ?? new MadaraParser();
    this.requestManager = params.requestManager ?? new MadaraInterceptor("main", this);
    this.userAgent = params.userAgent;
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
    const [_response, buffer] = await Application.scheduleRequest({
      url: getUsePostIds(this.usePostIds)
        ? `${this.domain}/?p=${mangaId}/`
        : `${this.domain}/temp_dirpath/${mangaId}/`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return this.parser.parseMangaDetails($, mangaId, this);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    let requestConfig: Request;
    const mangaId = await this.getPostAndSlug(sourceManga.mangaId);

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
            manga: mangaId.postId,
          },
        };
        break;

      case 1:
        requestConfig = {
          url: `${this.domain}/temp_dirpath/${mangaId.slug}/ajax/chapters`,
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        };
        break;

      case 2:
        requestConfig = {
          url: `${this.domain}/temp_dirpath/${mangaId.slug}`,
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        };
        break;

      case 3:
        requestConfig = {
          url: `${this.domain}/temp_dirpath/${mangaId.slug}`,
          method: "GET",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        };
        break;

      default:
        throw new Error("Invalid chapter endpoint!");
    }

    const [_response, buffer] = await Application.scheduleRequest(requestConfig);

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    return this.parser.parseChapterList($, sourceManga, this);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const mangaId = await this.getPostAndSlug(chapter.sourceManga.mangaId);
    const chapterId = chapter.chapterId;

    const url = new URL(this.domain).addPathComponent("temp_dirpath");
    url.addPathComponent(mangaId.slug);

    url.addPathComponent(chapterId);

    if (this.useListParameter) {
      url.setQueryItem("style", "list");
    }

    const [_response, buffer] = await Application.scheduleRequest({
      url: url.toString(),
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    if (this.hasProtectedChapters) {
      return this.parser.parseProtectedChapterDetails(
        $,
        chapter,
        this.protectedChapterDataSelector,
        this,
      );
    }

    return this.parser.parseChapterDetails($, chapter, this.chapterDetailsSelector, this);
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

    const [_response, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/temp_dirpath/page/${page}/${param}`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const items = await this.parser.parseDiscoverSections($, section, this);

    metadata = { page: page + 1 }; // Madara doesn't support last page checking, will return 404 on website!

    return {
      items: items,
      metadata: metadata,
    };
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    const [_response, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/?s=&post_type=wp-manga`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const tagSections = await this.parser.parseSearchTags($);
    const genreTags = tagSections.find((x) => x.id === "genres") as TagSection;

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

    const [_response, buffer] = await this.constructSearchRequest(page, query);

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const results = await this.parser.parseSearchResults($, this);

    const items: SearchResultItem[] = [];

    for (const result of results) {
      if (getUsePostIds(this.usePostIds)) {
        items.push({
          mangaId: (await this.getPostAndSlug(result.slug)).postId,
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
    for (const cookie of cookies) {
      if (
        cookie.name.startsWith("cf") ||
        cookie.name.startsWith("_cf") ||
        cookie.name.startsWith("__cf")
      ) {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  // Utility
  constructSearchRequest(page: number, query: SearchQuery) {
    const urlBuilder = new URL(this.domain)
      .addPathComponent(this.searchPagePathName)
      .addPathComponent(page.toString())
      .setQueryItem("s", this.sanitizeQuery(query?.title ?? ""))
      .setQueryItem("post_type", "wp-manga");

    const genreFilters = Object.keys(query.filters.find((x) => x.id === "genres")?.value ?? {});

    if (genreFilters.length) {
      genreFilters.forEach((genre, i) => urlBuilder.setQueryItem(`genre[${i}]`, genre));
      urlBuilder.setQueryItem("op", "1");
    }

    return Application.scheduleRequest({
      url: urlBuilder.toString(),
      method: "GET",
    });
  }

  // convert smart quotes (iOS uses them by default)
  sanitizeQuery(query: string): string {
    return query.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  }

  async getPostAndSlug(mangaId: string) {
    const isPostId = !isNaN(Number(mangaId));
    let postId: number = 0;
    let slug: string = "";

    if (!isPostId) {
      if (getUsePostIds()) {
        // If provided mangaId is NOT a postId, but a slug AND we care about having the postId
        const slugInput = mangaId.toString();

        // Fetch postId for slug
        postId = Application.getState(slugInput) as number;

        // If unable to fetch postId, turn slug into postId
        if (!postId) {
          postId = await this.convertSlugToPostId(slugInput);
        }

        slug = slugInput;
      }
    } else {
      // If mangaId IS a postId
      const postIdInput = Number(mangaId);

      // Fetch slug for postId
      slug = Application.getState(postIdInput.toString()) as string;

      // If unable to fetch slug, turn postId into slug
      if (!slug) {
        slug = (await this.convertPostIdToSlug(postIdInput)).slug;
      }

      postId = postIdInput;
    }

    // We only need to store these if we actually care about them
    if (getUsePostIds()) {
      Application.setState(postId.toString(), slug);
      Application.setState(slug, postId.toString());
    }

    return {
      postId: postId.toString(),
      slug: slug,
    };
  }

  async convertPostIdToSlug(postId: number) {
    const [, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/?p=${postId}`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    let parseURL: string;
    // Step 1: Try to get slug from og-url
    parseURL = $('meta[property="og:url"]').attr("content") ?? "";

    // Step 2: Try to get slug from canonical
    if (!parseURL.includes(this.domain)) {
      parseURL = $('link[rel="canonical"]').attr("href") ?? "";
    }

    if (!parseURL.includes(this.domain)) {
      throw new Error(`Unable to parse slug for postId: ${postId}!`);
    }

    const URLSplit = parseURL.replace(/\/$/, "").split("/");

    const slug: string = URLSplit.slice(-1).pop() ?? "";
    const path: string = URLSplit.slice(-2).shift() ?? "";

    if (!slug) {
      throw new Error(`Unable to fetch slug for this item! postId: ${postId}`);
    }

    return { path, slug };
  }

  async convertSlugToPostId(slug: string): Promise<number> {
    // Credit to the MadaraDex team :-D
    const [headResponse] = await Application.scheduleRequest({
      url: `${this.domain}/temp_dirpath/${slug}`,
      method: "HEAD",
    });

    const postIdRegex = headResponse?.headers?.["link"]?.match(/\?p=(\d+)/);
    const postIdMatch = postIdRegex?.[1] ? Number(postIdRegex[1]) : NaN;
    if (!isNaN(postIdMatch)) {
      return postIdMatch;
    }

    // Move on to the alternative method of parsing
    const [, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/temp_dirpath/${slug}`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    // Step 1: Try to get postId from shortlink
    const postId_1 = $('link[rel="shortlink"]')?.attr("href")?.split("/?p=")[1];
    if (postId_1) {
      const postId = Number(postId_1);
      if (!isNaN(postId)) {
        return postId;
      }
    }

    // Step 2: If no number has been found, try to parse from data-post
    const postId_2 = $("a.wp-manga-action-button")?.attr("data-post");
    if (postId_2) {
      const postId = Number(postId_2);
      if (!isNaN(postId)) {
        return postId;
      }
    }

    // Step 3: If no number has been found, try to parse from manga script
    const page = $.root().html();
    const match = page?.match(/manga_id["']?\s*:\s*["']?(\d+)/);
    if (match?.[1]) {
      const postId = Number(match[1]);
      if (!isNaN(postId)) {
        return postId;
      }
    }

    throw new Error(`Unable to fetch numeric postId for this item! slug:${slug}`);
  }

  async getDirectoryPath(): Promise<string> {
    // Always use the override if set
    if (this.directoryPath) {
      return this.directoryPath;
    }

    const getPath = Application.getState(`dirpath_${this.domain}`) as string;
    // Return stored path
    if (getPath) {
      return getPath;
    }

    const [_response, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/?s=&post_type=wp-manga#directoryRequest`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const path = this.parser.parseDirectoryPath($, this); // Returns "manga" (default) if unable to parse

    // Store parsed path else store the default (manga)
    Application.setState(path, `dirpath_${this.domain}`);
    return path;
  }
}
