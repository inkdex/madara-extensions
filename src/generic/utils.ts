/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as CryptoJS from "crypto-js";

const BASE_VERSION = "1.0.0-alpha.4";

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
  if (!baseParts[0]) {
    throw new Error(`Invalid BASE_VERSION: '${BASE_VERSION}'. Version string cannot be empty.`);
  }
  const versionNumbers = baseParts[0].split(".").map(Number);
  const isPrerelease = baseParts.length > 1;

  if (versionNumbers.length < 3) {
    throw new Error(
      `Invalid BASE_VERSION: '${BASE_VERSION}'. Expected format: 'X.Y.Z' or 'X.Y.Z-prerelease.N'`,
    );
  }

  if ("increasePrerelease" in options) {
    if (!isPrerelease) {
      throw new Error("Cannot set a prerelease number on a stable version.");
    }

    if (!baseParts[1]) {
      throw new Error(`Invalid BASE_VERSION: '${BASE_VERSION}'. Missing prerelease identifier.`);
    }

    const prereleaseParts = baseParts[1].split(".");
    if (prereleaseParts.length < 2 || isNaN(Number(prereleaseParts[1]))) {
      throw new Error(
        `Invalid prerelease format in BASE_VERSION: '${BASE_VERSION}'. Expected format: 'X.Y.Z-prerelease.N'`,
      );
    }

    const newPrereleaseNum = Number(prereleaseParts[1]) + options.increasePrerelease;
    return `${baseParts[0]}-${prereleaseParts[0]}.${newPrereleaseNum}`;
  }

  if (isPrerelease) {
    throw new Error("BASE_VERSION is a prerelease. Use increasePrerelease option instead.");
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

  const newMajor = (versionNumbers[0] ?? 0) + (options.increaseMajor || 0);
  const newMinor = (versionNumbers[1] ?? 0) + (options.increaseMinor || 0);
  const newPatch = (versionNumbers[2] ?? 0) + (options.increasePatch || 0);

  return `${newMajor}.${newMinor}.${newPatch}`;
}

type CipherParams = CryptoJS.lib.CipherParams;

const CryptoJSFormatter = {
  stringify: function (cipherParams: CipherParams) {
    const jsonObj = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
      iv: "",
      s: "",
    };
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }

    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }
    return JSON.stringify(jsonObj);
  },
  parse: function (jsonStr: string) {
    const jsonObj = JSON.parse(jsonStr);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct),
    });
    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }

    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }

    return cipherParams;
  },
};

export function decryptData(cipherText: string, key: string) {
  return JSON.parse(
    JSON.parse(
      CryptoJS.AES.decrypt(cipherText, key, {
        format: CryptoJSFormatter,
      }).toString(CryptoJS.enc.Utf8),
    ),
  );
}

export function extractVariableValues(chapterData: string): Record<string, string> {
  const variableRegex = /var\s+(\w+)\s*=\s*'([^']*)';/g;
  const variables: Record<string, string> = {};
  let match;

  // Under no circumstances directly eval (or Function), as they might go hardy harr-harr sneaky and pull an RCE
  while ((match = variableRegex.exec(chapterData)) !== null) {
    const [, variableName, variableValue] = match as unknown as [string, string, string];
    variables[variableName] = variableValue;
  }

  return variables;
}
