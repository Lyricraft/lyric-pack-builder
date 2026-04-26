import {ContentReference} from "./contentReference.js";
import {stringUsable} from "../../../../../public/type.js";
import {ArgTypeError} from "../../../../../public/errors.js";
import {curseforgeContentGateway} from "../../../../../platforms/curseforge/curseforgeId.js";
import {ConfigError} from "../../../../errors.js";
import {t} from "../../../../../i18n/translate.js";

const contentReferenceMap = new Map();

export function curseforgeContentReference(str, type = "") {
    for (const [key, value] of contentReferenceMap) {
        if (key.test(str)) {
            return value(str, type);
        }
    }
    return null;
}

class CurseforgeIdContentReference extends ContentReference {
    constructor(id, type) {
        super(type);
        this.id = id; // 使用 string 存储
    }

    symbolType() {
        return 'id';
    }

    symbol() {
        return this.id;
    }
}

class CurseforgeSlugContentReference extends ContentReference {
    constructor(slug, type) {
        super(type); // type 不可为空字符串！
        this.slug = slug;
    }

    symbolType() {
        return 'slug';
    }

    symbol() {
        return this.slug;
    }
}

const idRegex = /^(0|[1-9]\d*)$/;
const slugRegex = /^[a-z][a-z\d-]*$/i;

export const CURSEFORGE_CONTENT_URL_REGEX = /curseforge\.com\/minecraft\/(mc-mods|texture-packs|shaders)\/([a-z0-9\-]+)/i;

export function curseforgeContentUrlToReference(url, type = null) {
    const match = url.match(CURSEFORGE_CONTENT_URL_REGEX);

    let urlType = curseforgeContentGateway.getKey(match[1].toLowerCase());
    if (curseforgeContentGateway.hasValue(urlType)) {
        urlType = curseforgeContentGateway.getKey(urlType);
    } else {
        return null;
    }

    const idOrSlug = match[2];

    if (stringUsable(type) && urlType !== type) {
        throw new ConfigError(t('error.configs.platformResourceReferenceTypeNotMatch',
            idOrSlug, urlType, type));
    }

    if (idRegex.test(idOrSlug)) {
        return new CurseforgeIdContentReference(idOrSlug, urlType);
    } else if (slugRegex.test(idOrSlug)) {
        return new CurseforgeSlugContentReference(idOrSlug, urlType);
    } else {
        return null;
    }
}

contentReferenceMap
    .set(idRegex, CurseforgeIdContentReference)
    .set(slugRegex, function (slug, type) {
        if (!stringUsable(type)) {
            throw new ArgTypeError('type', 'string(length>0)', type);
        }
        return new CurseforgeSlugContentReference(slug.toLowerCase(), type);
    })
    .set(CURSEFORGE_CONTENT_URL_REGEX, curseforgeContentUrlToReference());