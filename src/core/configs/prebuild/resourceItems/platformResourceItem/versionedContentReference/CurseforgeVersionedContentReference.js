import {VersionedContentReference, VersionedContentReferenceTypes} from "./VersionedContentReference.js";
import {curseforgeContentReference} from "../contentReference/curseforgeContentReference.js";
import {curseforgeVersionReference} from "../versionReference/curseforgeVersionReference.js";
import {PubPlatform} from "../../../../../mc/mcMods.js";

class CurseforgeVersionedContentReference extends VersionedContentReference {
    parseContentReference(str) {
        return curseforgeContentReference(str);
    }

    parseVersionReference(str) {
        return curseforgeVersionReference(str);
    }
}
VersionedContentReferenceTypes.set(PubPlatform.CURSEFORGE, CurseforgeVersionedContentReference);