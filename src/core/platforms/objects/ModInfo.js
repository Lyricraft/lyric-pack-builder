import {ModSideSupport} from "../../mc/mcMods.js";

export class ModInfo{

    constructor(obj = {}){
        const {
            platform, type, id, slug, title,
            clientSide, serverSide,
            loaders, gameVersions,
            publishedAt, updatedAt,
        } = obj;
        // 写成这样了，构造的时候直接复制过去用，多方便呐。

        this.platform = platform ?? null; // PubPlatform
        this.type = type ?? null; // McContent
        this.id = id ?? "";
        this.slug = slug ?? "";
        this.title = title ?? "";

        this.clientSide =  clientSide ?? ModSideSupport.UNKNOWN;
        this.serverSide = serverSide ?? ModSideSupport.UNKNOWN;

        this.loaders = loaders ?? []; // ModLoader[]
        this.gameVersions = gameVersions ?? []; // McVersion[]

        this.publishedAt = publishedAt ?? 0; // int 毫秒时间戳
        this.updatedAt = updatedAt ?? 0; // int 毫秒时间戳
    }

}