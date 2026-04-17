import {ContentReference} from "../objects/contentReference.js";

const contentReferenceMap = new Map();

export function modrinthContentReference(str, type = "") {
    for (const [key, value] of contentReferenceMap) {
        if (key.test(str)) {
            return value(str, type);
        }
    }
    return null;
}

class ModrinthSlugOrIdContentReference extends ContentReference {
    constructor(slugOrId, type) {
        super(type);
        this.slugOrId = slugOrId;
    }
}

const urlRegex = /modrinth\.com\/(mod|datapack|shader|resourcepack)\/([a-z0-9\-]+)/i;

contentReferenceMap
    .set(/^[a-z0-9\-]{2,64}$/i, (str, type) =>
        new ModrinthSlugOrIdContentReference(str.toLowerCase(), type))
    .set(urlRegex, function (str, type) {
        const match =  str.match(urlRegex);
        return new ModrinthSlugOrIdContentReference(match[2], match[1].toLowerCase());
    });