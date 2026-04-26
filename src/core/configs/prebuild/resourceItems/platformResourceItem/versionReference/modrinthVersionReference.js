import {VersionReference} from "./versionReference.js";
import {
    MODRINTH_CONTENT_URL_REGEX,
    modrinthContentReference,
    modrinthProjectUrlToReference
} from "../contentReference/modrinthContentReference.js";
import {ConfigError} from "../../../../errors.js";
import {t} from "../../../../../i18n/translate.js";

const versionReferenceMap = new Map();

export function modrinthVersionReference(str, contentReference = null) {
    for (const [key, value] of versionReferenceMap) {
        if (key.test(str)) {
            return value(str, contentReference);
        }
    }
    return null;
}

class ModrinthIdVersionReference extends VersionReference {
    constructor(id, contentReference = null) {
        super(contentReference);
        this.id = id;
    }
}

class ModrinthVersionNumberVersionReference extends VersionReference {
    constructor(versionNumber, contentReference = null) {
        super(contentReference);
        this.versionNumber = versionNumber;
    }
}

class ModrinthDownloadUrlVersionReference extends VersionReference {
    constructor(downloadUrl, contentReference = null) {
        super(contentReference);
        this.downloadUrl = downloadUrl;
    }
}

export const MODRINTH_DOWNLOAD_URL_REGEX = /cdn\.modrinth\.com\/data\/([^/]+)\/versions\/([^/]+)\/([^/]+)$/;

versionReferenceMap
    .set(/[A-Za-z0-9]{8}/, ModrinthIdVersionReference)
    .set(/^[a-zA-Z0-9!@$()`.+,_"\-']{1,32}$/, ModrinthIdVersionReference)
    .set(MODRINTH_CONTENT_URL_REGEX, function (url, contentReference = null) {
        // 检查是不是 version url，并获取 version 信息。
        const match = url.match(/\/version\/([^/?#]+)/);
        if (!match) {
            return null;
        }
        const versionSymbol = match[1];

        const urlContentReference = modrinthProjectUrlToReference(url);
        if (contentReference && !urlContentReference.checkMatch(contentReference)) {
            throw new ConfigError(t('error.configs.platformResourceReferenceContentNotMatch',
                url, urlContentReference.symbolType(), urlContentReference.symbol(), contentReference.symbol()));
        }
        return modrinthVersionReference(versionSymbol, contentReference??urlContentReference);
    })
    .set(MODRINTH_DOWNLOAD_URL_REGEX, function (url, contentReference = null) {
        const projectIdLike = url.match(MODRINTH_DOWNLOAD_URL_REGEX)[1];

        let urlContentReference;
        try {
            urlContentReference = modrinthContentReference(projectIdLike);
        } catch(e) {
            urlContentReference = null;
        }

        if (contentReference && urlContentReference && !urlContentReference.checkMatch(contentReference)) {
            throw new ConfigError(t('error.configs.platformResourceReferenceContentNotMatch',
                url, urlContentReference.symbolType(), urlContentReference.symbol(), contentReference.symbol()));
        }

        return new ModrinthDownloadUrlVersionReference(url, contentReference??urlContentReference);
    });