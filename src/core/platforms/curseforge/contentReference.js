import {ContentReference} from "../objects/contentReference.js";
import {stringUsable} from "../../public/type.js";
import {ArgTypeError} from "../../public/errors.js";
import {curseforgeContentGateway} from "./curseforgeId.js";

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
}

class CurseforgeSlugContentReference extends ContentReference {
    constructor(slug, type) {
        super(type); // type 不可为空字符串！
        this.slug = slug;
    }
}

const idRegex = /^(0|[1-9]\d*)$/;
const slugRegex = /^[a-z][a-z\d-]*$/i;
const urlRegex = /curseforge\.com\/minecraft\/(mc-mods|texture-packs|shaders)\/([a-z0-9\-]+)/i;


contentReferenceMap
    .set(idRegex, CurseforgeIdContentReference)
    .set(slugRegex, function (slug, type) {
        if (!stringUsable(type)) {
            throw new ArgTypeError('type', 'string(length>0)', type);
        }
        return new CurseforgeSlugContentReference(slug.toLowerCase(), type);
    })
    .set(urlRegex, function (str, type0) {
        const match =  str.match(urlRegex);
        const type = curseforgeContentGateway.getKey(match[1].toLowerCase());
        const idOrSlug = match[2].toLowerCase();
        if (idRegex.test(idOrSlug)) {
            return new CurseforgeIdContentReference(idOrSlug, type);
        } else if (slugRegex.test(idOrSlug)) {
            return new CurseforgeSlugContentReference(idOrSlug, type);
        } else {
            return null;
        }
    });