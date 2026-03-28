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

export const ModSide = {
    SERVER: 'server',
    CLIENT: 'client',
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