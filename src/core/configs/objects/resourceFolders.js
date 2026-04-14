
export const ResourceFolderType = {
    BUILTIN: 'builtin',
    BUILDER: 'builder',
    LIST: 'list',
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

export const DEFAULT_FOLDER_MAP = new Map()
    .set(BuiltinFolders.BASE.getFullName(), BuiltinFolders.BASE)
    .set(BuiltinFolders.CONFIG.getFullName(), BuiltinFolders.CONFIG);

ResourceFolder.createOne(ResourceFolderType.BUILDER, 'mods', 'mods', DEFAULT_FOLDER_MAP);
ResourceFolder.createOne(ResourceFolderType.BUILDER, 'resourcepacks', 'resourcepacks', DEFAULT_FOLDER_MAP);
ResourceFolder.createOne(ResourceFolderType.BUILDER, 'shaders', 'shaderpacks', DEFAULT_FOLDER_MAP);
// datapacks 文件夹由用户自行定义