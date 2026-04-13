import {checkEnum} from "../public/type.js";

export const McContent = {
    MOD: 'mod',
    MODPACK: 'modpack',
    RESOURCEPACK: 'resourcepack',
    SHADER: 'shader',
    SAVE: 'save',
    DATAPACK: 'datapack',
}

export const PubPlatform = {
    MODRINTH: 'modrinth',
    CURSEFORGE: 'curseforge',
}

export const PackFormat = {
    MODRINTH: 'modrinth',
    CURSEFORGE: 'curseforge',
    MCBBS: 'mcbbs',
}

export const ModSide = {
    SERVER: 'server',
    CLIENT: 'client',
}

// 看到下面这些肯定有人要吐了。
// 可是我觉得很神圣呀！

export const ModSideRequirement = {
    SERVER: ModSide.SERVER,
    CLIENT: ModSide.CLIENT,
    BOTH: 'both',
}

export const ModSideOption = {
    SERVER: ModSideRequirement.SERVER,
    CLIENT: ModSideRequirement.CLIENT,
    BOTH: ModSideRequirement.BOTH,
    AUTO: 'auto',
}

export const ModSideSupport = {
    REQUEST: 'request',
    OPTIONAL: 'optional',
    UNSUPPORTED: 'unsupported',
    UNKNOWN: 'unknown',
}

export const ModLoader = {
    NEOFORGE: 'neoforge',
    FORGE: 'forge',
    FABRIC: 'fabric',
    QUILT: 'quilt',
}

export const VersionStageName = {
    ALPHA: 'alpha',
    BETA: 'beta',
    RELEASE: 'release',
    UNKNOWN: 'unknown',
}

const versionStageLevels = {
    [VersionStageName.RELEASE]: 0,
    [VersionStageName.BETA]: 50,
    [VersionStageName.ALPHA]: 60,
    [VersionStageName.UNKNOWN]: 100,
}

export class VersionStage{
    constructor(name) {
        this.name = checkEnum(VersionStageName, name) ? name : VersionStageName.UNKNOWN;
    }

    level(){
        return versionStageLevels[this.name];
    }

    toString() {
        return this.name;
    }
}