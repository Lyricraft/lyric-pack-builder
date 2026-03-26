
export class ModVersion{

    constructor(obj = {}){
        const {parent, id, versionNumber, name, dependencies, loaders, gameVersions, featured} = obj;

        this.parent = parent ?? null; // ModInfo
        this.id = id ?? "";
        this.versionNumber = versionNumber ?? "";
        this.name = name ?? "";
        this.dependencies = dependencies ?? []; // DependencyInfo
        this.loaders = loaders ?? []; // ModLoader
        this.gameVersions = gameVersions ?? []; // Version
        this.featured = featured ?? false;
    }

}