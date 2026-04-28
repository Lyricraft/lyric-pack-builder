import {BiMap} from "mnemonist";
import {PlatformResourceContent} from "../enums.js";
import {StringType, stringUsable} from "../../public/type.js";

export const ResourceFolderType = {
    BUILTIN: 'builtin',
    BUILDER: 'builder',
    LIST: 'list',
}

export function resourceFolderTypeAndIdFromString(str) {
    const split = str.split(':');
    if (split.length === 1) {
        return stringUsable(split[0], StringType.ID) ? {
            type: ResourceFolderType.LIST,
            id: split[0],
        } : null;
    } else if (split.length === 2) {
        if (split[0] === ResourceFolderType.LIST || split[1] === ResourceFolderType.BUILDER) {
            return stringUsable(split[1]) ? {
                type: split[0],
                id: split[1],
            } : null;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export class ResourceFolder {
    constructor(type, name, path) {
        this.type = type;
        this.name = name;
        this.path = path;
    }

    getFullName() {
        return `${this.type}:${this.name}`;
    }

    static createOne(type, name, path, map = null) {
        // 不做参数校验了，内部使用
        const folder = new ResourceFolder(type, name, path);

        if (map) {
            map.set(folder.getFullName(), folder);
        }

        return folder;
    }
}

export const BuiltinFolders = {
    BASE: new ResourceFolder(ResourceFolderType.BUILTIN, 'base', ''),
    CONFIG: new ResourceFolder(ResourceFolderType.BUILTIN, 'config', 'config'),
}

export const BuilderFolderNames = {
    MODS: 'mods',
    RESOURCEPACKS: 'resourcepacks',
    SHADERPACKS: 'shaderpacks',
    DATAPACKS: 'datapacks',
}

export const ContentFolders = new BiMap()
    .set(PlatformResourceContent.MOD, BuilderFolderNames.MODS)
    .set(PlatformResourceContent.RESOURCEPACK, BuilderFolderNames.RESOURCEPACKS)
    .set(PlatformResourceContent.SHADER, BuilderFolderNames.SHADERPACKS)
    .set(PlatformResourceContent.DATAPACK, BuilderFolderNames.DATAPACKS);

export const DEFAULT_FOLDER_MAP = new Map()
    .set(BuiltinFolders.BASE.getFullName(), BuiltinFolders.BASE)
    .set(BuiltinFolders.CONFIG.getFullName(), BuiltinFolders.CONFIG);

ResourceFolder.createOne(ResourceFolderType.BUILDER, BuilderFolderNames.MODS, 'mods', DEFAULT_FOLDER_MAP);
ResourceFolder.createOne(ResourceFolderType.BUILDER, BuilderFolderNames.RESOURCEPACKS, 'resourcepacks', DEFAULT_FOLDER_MAP);
ResourceFolder.createOne(ResourceFolderType.BUILDER, BuilderFolderNames.SHADERPACKS, 'shaderpacks', DEFAULT_FOLDER_MAP);
// datapacks 文件夹由用户自行定义