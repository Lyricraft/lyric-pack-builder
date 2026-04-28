import {VersionedContentReference} from "./VersionedContentReference.js";
import {curseforgeContentReference} from "../contentReference/curseforgeContentReference.js";
import {curseforgeVersionReference} from "../versionReference/curseforgeVersionReference.js";

export class CurseforgeVersionedContentReference extends VersionedContentReference {
    parseContentReference(str) {
        return curseforgeContentReference(str);
    }

    parseVersionReference(str) {
        return curseforgeVersionReference(str);
    }
}
