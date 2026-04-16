import {ContentReference} from "../objects/contentReference.js";

const contentReferenceMap = new Map();

export function modrinthContentReference(str) {
    for (const [key, value] of Object.entries(contentReferenceMap)) {
        if (key.test(str)) {
            return value(str);
        }
    }
    return null;
}

class ModrinthSlugOrIdContentReference extends ContentReference {
    constructor(str) {
        super();
        this.slugOrId = str;
    }
}

const urlRegex = /modrinth\.com\/(mod|datapack|shader|resourcepack|project)\/([a-z0-9\-]+)/i;

contentReferenceMap
    .set(/^[a-z0-9\-]{2,64}$/i, ModrinthSlugOrIdContentReference)
    .set(urlRegex, str => new ModrinthSlugOrIdContentReference(str.match(urlRegex)[2]));