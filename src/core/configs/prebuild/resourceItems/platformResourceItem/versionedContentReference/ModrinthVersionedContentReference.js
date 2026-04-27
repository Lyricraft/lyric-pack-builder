import {VersionedContentReference, VersionedContentReferenceTypes} from "./VersionedContentReference.js";
import {modrinthContentReference} from "../contentReference/modrinthContentReference.js";
import {modrinthVersionReference} from "../versionReference/modrinthVersionReference.js";
import {PubPlatform} from "../../../../../mc/mcMods.js";

class ModrinthVersionedContentReference extends VersionedContentReference {
    parseContentReference(str) {
        return modrinthContentReference(str);
    }

    parseVersionReference(str) {
        return modrinthVersionReference(str);
    }
}
VersionedContentReferenceTypes.set(PubPlatform.MODRINTH, ModrinthVersionedContentReference);