import {VersionStage, VersionStageName} from "../../mc/mcMods.js";
import {ModVersionNumber} from "./ModVersionNumber.js";

export class ModVersion{

    constructor(obj = {}){
        const {
            parent, id, versionNumber, versionStage, name,
            dependencies, loaders, gameVersions,
            files,
            featured,
            publishedAt,
        } = obj;

        this.parent = parent ?? null; // ModInfo
        this.id = id ?? "";
        this.versionNumber = versionNumber ?? new ModVersionNumber("");
        this.versionStage = versionStage ?? new VersionStage(VersionStageName.UNKNOWN);
        this.name = name ?? "";

        this.dependencies = dependencies ?? []; // DependencyInfo[]
        this.loaders = loaders ?? []; // ModLoader[]
        this.gameVersions = gameVersions ?? []; // McVersion[]

        this.files = files ?? []; // ModFile[]

        this.featured = featured ?? false;

        this.publishedAt = publishedAt ?? new Date(0);
    }

}