import {VersionReference} from "./versionReference.js";
import {ConfigError} from "../../../../errors.js";
import {t} from "../../../../../i18n/translate.js";
import {
    CURSEFORGE_CONTENT_URL_REGEX,
    curseforgeContentUrlToReference
} from "../contentReference/curseforgeContentReference.js";

const versionReferenceMap = new Map();

export function curseforgeVersionReference(str, contentReference = null) {
    for (const [key, value] of versionReferenceMap) {
        if (key.test(str)) {
            return value(str, contentReference);
        }
    }
    return null;
}

class CurseforgeIdVersionReference extends VersionReference {
    constructor(id, contentReference = null) {
        super(contentReference);
        this.id = id;
    }

    requireContentReference() {
        return true;
    }
}

class CurseforgeDownloadUrlReference extends VersionReference {
    constructor(downloadUrl, contentReference = null) {
        super(contentReference);
        this.downloadUrl = downloadUrl;
    }

    requireContentReference() {
        return false;
    }
}

export const CURSEFORGE_DOWNLOAD_URL_REGEX = /media\.forgecdn\.net\/files\/(\d{3})(\d+)\/([^/]+)$/;

versionReferenceMap
    .set(/^(0|[1-9]\d*)$/, CurseforgeIdVersionReference)
    .set(CURSEFORGE_CONTENT_URL_REGEX, function (url, contentReference = null) {
        // 检查是不是 version url，并获取 version 信息。
        const match = url.match(/\/(files|download)\/(0|[1-9]\d*)/);
        if (!match) {
            return null;
        }
        const fileId = match[2];

        const urlContentReference = curseforgeContentUrlToReference(url);
        if (contentReference && !urlContentReference.checkMatch(contentReference)) {
            throw new ConfigError(t('error.configs.platformResourceReferenceContentNotMatch',
                url, urlContentReference.symbolType(), urlContentReference.symbol(), contentReference.symbol()));
        }
        return new CurseforgeIdVersionReference(fileId, contentReference??urlContentReference);
    })
    .set(CURSEFORGE_DOWNLOAD_URL_REGEX, function (url, contentReference = null) {
        // const match = url.match(CURSEFORGE_DOWNLOAD_URL_REGEX)
        // const id = match[1] + match[2];
        return new CurseforgeIdVersionReference(url, contentReference);
    });