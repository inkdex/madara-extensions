/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { PaperbackInterceptor, type Request, type Response } from "@paperback/types";
import { MadaraGeneric } from "./Madara";

export class MadaraInterceptor extends PaperbackInterceptor {
  source: MadaraGeneric;
  promise: Promise<string> | undefined;

  constructor(id: string, source: MadaraGeneric) {
    super(id);
    this.source = source;
  }

  override async interceptRequest(request: Request): Promise<Request> {
    // If it's NOT a directoryRequest
    if (!request.url.includes("#directoryRequest")) {
      if (!this.promise) {
        // If it's NOT a directoryRequest
        if (!request.url.includes("#directoryRequest")) {
          if (!this.promise) {
            this.promise = this.source.getDirectoryPath();
          }

          try {
            const directoryPath = await this.promise;
            request.url = request.url.replace("temp_dirpath", directoryPath);
          } catch (error: unknown) {
            this.promise = undefined;
            throw error;
          }
        }

        request.url = request.url.replace("#directoryRequest", "");
      }

      try {
        const directoryPath = await this.promise!;
        request.url = request.url.replace("temp_dirpath", directoryPath);
      } catch (error: unknown) {
        this.promise = undefined;
        throw error;
      }
    }

    request.url = request.url.replace("#directoryRequest", "");

    request.headers = {
      ...request.headers,
      "user-agent": this.source.userAgent ?? (await Application.getDefaultUserAgent()),
      referer: `${this.source.domain}/`,
      origin: `${this.source.domain}/`,
      ...((request.url.includes("wordpress.com") || request.url.includes("wp.com")) && {
        Accept: "image/avif,image/webp,*/*",
      }),
    };

    request.cookies = {
      ...request.cookies,
      "toonily-mature": "1",
      "wpmanga-adault": "1",
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
