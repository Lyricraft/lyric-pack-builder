import {checkEnum} from "../public/type.js";

export const McContent = {
    MOD: 'mod',
    MODPACK: 'modpack',
    RESOURCEPACK: 'resourcepack',
    SHADER: 'shader',
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

export const VersionStage = {
    ALPHA: 'alpha',
    BETA: 'beta',
    RELEASE: 'release',
}

const versionStageLevels = {
    [VersionStage.RELEASE]: 0,
    [VersionStage.BETA]: 50,
    [VersionStage.ALPHA]: 60,
}
export function getVersionStageLevel(versionStage) {
    if (!checkEnum(versionStageLevels, versionStage)) {
        return 100;
    }
    return versionStageLevels[versionStage];
}