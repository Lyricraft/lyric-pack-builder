import {VersionedContentReference} from "./VersionedContentReference.js";
import {modrinthContentReference} from "../contentReference/modrinthContentReference.js";
import {modrinthVersionReference} from "../versionReference/modrinthVersionReference.js";

export class ModrinthVersionedContentReference extends VersionedContentReference {
    parseContentReference(str) {
        return modrinthContentReference(str);
    }

    parseVersionReference(str) {
        return modrinthVersionReference(str);
    }
}
