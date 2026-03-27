import {VersionStage, VersionStageName} from "../../mc/mcMods.js";

export class ModVersion{

    constructor(obj = {}){
        const {
            parent, id, versionNumber, versionStage, name,
            dependencies, loaders, gameVersions,
            featured,
            publishedAt,
        } = obj;

        this.parent = parent ?? null; // ModInfo
        this.id = id ?? "";
        this.versionNumber = versionNumber ?? "";
        this.versionStage = versionStage ?? new VersionStage(VersionStageName.UNKNOWN);
        this.name = name ?? "";

        this.dependencies = dependencies ?? []; // DependencyInfo
        this.loaders = loaders ?? []; // ModLoader
        this.gameVersions = gameVersions ?? []; // Version

        this.featured = featured ?? false;

        this.publishedAt = publishedAt ?? new Date(0);
    }

}