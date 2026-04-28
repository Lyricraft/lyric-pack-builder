import {ModrinthVersionedContentReference} from './ModrinthVersionedContentReference.js'
import {CurseforgeVersionedContentReference} from './CurseforgeVersionedContentReference.js'
import {VersionedContentReferenceClasses} from "./VersionedContentReference.js";
import {ArgTypeError} from "../../../../../public/errors.js";
import {PubPlatform} from "../../../../../mc/mcMods.js";

VersionedContentReferenceClasses
    .set(PubPlatform.MODRINTH, ModrinthVersionedContentReference)
    .set(PubPlatform.CURSEFORGE, CurseforgeVersionedContentReference);

export function versionedContentReferenceFrom (platform, obj) {

    const cls = VersionedContentReferenceClasses.get(platform);

    if (!cls) {
        throw new ArgTypeError('platform', 'PubPlatform', platform);
    }

    return new cls(obj);
}