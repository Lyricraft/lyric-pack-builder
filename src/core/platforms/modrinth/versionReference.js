import {VersionReference} from "../objects/versionReference.js";
import {MODRINTH_CONTENT_URL_REGEX, modrinthProjectUrlToReference} from "./contentReference.js";
import {ConfigError} from "../../configs/errors.js";
import {t} from "../../i18n/translate.js";

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
        if (contentReference && urlContentReference.checkMatch(contentReference)) {
            throw new ConfigError(t('error.configs.platformResourceReferenceContentNotMatch',
                url, urlContentReference.symbolType(), urlContentReference.symbol(), contentReference.symbol()));
        }
        return modrinthVersionReference(versionSymbol, urlContentReference);
    });
// TODO: 添加对文件直链的支持