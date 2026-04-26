import {ContentReference} from "./contentReference.js";
import {stringUsable} from "../../../../../public/type.js";
import {ConfigError} from "../../../../errors.js";
import {t} from "../../../../../i18n/translate.js";

const contentReferenceMap = new Map();

export function modrinthContentReference(str, type = "") {
    for (const [key, value] of contentReferenceMap) {
        if (key.test(str)) {
            return value(str, type);
        }
    }
    return null;
}

class ModrinthIdOrSlugContentReference extends ContentReference {
    // 留给后面写查找逻辑
}

class ModrinthIdContentReference extends ModrinthIdOrSlugContentReference {
    constructor(id, type) {
        super(type);
        this.id = id;
    }

    symbolType() {
        return 'id';
    }

    symbol() {
        return this.id;
    }
}

class ModrinthSlugContentReference extends ModrinthIdOrSlugContentReference {
    constructor(slug, type) {
        super(type);
        this.slug = slug;
    }

    symbolType() {
        return 'slug';
    }

    symbol() {
        return this.slug;
    }
}

export const MODRINTH_CONTENT_URL_REGEX = /modrinth\.com\/(mod|datapack|shader|resourcepack)\/([a-z0-9\-]+)/i;

export function modrinthProjectUrlToReference(url, type = null) {
    const match =  url.match(MODRINTH_CONTENT_URL_REGEX);
    const urlType = match[1].toLowerCase();
    if (stringUsable(type) && urlType !== type) {
        throw new ConfigError(t('error.configs.platformResourceReferenceTypeNotMatch',
            match[2], urlType, type));
    }
    return modrinthContentReference(match[2], urlType);
}

contentReferenceMap
    .set(/^[A-Za-z0-9]{8}$/, ModrinthIdContentReference)
    .set(/^[a-z0-9-]+$/, ModrinthSlugContentReference)
    .set(MODRINTH_CONTENT_URL_REGEX, modrinthProjectUrlToReference);