import {ModSideSupport} from "../../mc/mcMods.js";

export class ModInfo{

    constructor(obj = {}){
        const {platform, type, id, slug, title, clientSide, serverSide, loaders, gameVersions} = obj;

        this.platform = platform ?? null; // PubPlatform
        this.type = type ?? null; // McContent
        this.id = id ?? "";
        this.slug = slug ?? "";
        this.title = title ?? "";
        this.clientSide =  clientSide ?? ModSideSupport.UNKNOWN;
        this.serverSide = serverSide ?? ModSideSupport.UNKNOWN;
        this.loaders = loaders ?? []; // ModLoader
        this.gameVersions = gameVersions ?? []; // Version
    }

}