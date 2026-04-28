import {ConfigFieldError, ConfigFieldMissingError, ConfigFieldTypeError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {isNullOrUndefined, StringType, stringUsable} from "../../public/type.js";
import {checkConfigStringType} from "../checker.js";
import {BuiltinFolders, DEFAULT_FOLDER_MAP} from "./resourceFolder.js";
import path from "path";
import {TypedError} from "../../public/errors.js";

export class ResourceDir {
    constructor(folder, dir) {
        this.folder = folder;
        this.dir = dir;
    }

    static fromFolderAndMap(folder, folderMap, dir = "") {
        return folderMap.has(folder) ? new ResourceDir(folder, dir) : null;
    }

    fullDir() {
        return path.join(this.folder ? this.folder.path : BuiltinFolders.BASE.path, this.dir);
    }
}

export class ResourceLocation {

    constructor(resourceDir, fileName) {
        this.resourceDir = resourceDir;
        this.fileName = fileName;
    }

    static fromPath(p, folderMap) {
        const {folder, restPath} = getFolderAndPath(p, folderMap);
        if (restPath.length === 0) {
            throw new ConfigFieldTypeError('ResourceLocation', 'path', 'string(ResourcePath)', restPath);
        }
        return new ResourceLocation(new ResourceDir(folder, path.dirname(p)), path.basename(p));
    }

    static fromDirAndRename(dir, folderMap, rename = null) {
        if (!isNullOrUndefined(rename) && !stringUsable(rename, StringType.FILE_NAME)) {
            throw new ConfigFieldTypeError('ResourceLocation', 'rename', 'string(FileName)', rename);
        }
        const {folder, restDir} = getFolderAndPath(dir, folderMap);
        return new ResourceLocation(new ResourceDir(folder, restDir), rename);
    }

    static fromObj(obj, folderMap, defaultResourceLocation = null) {
        if (Object.hasOwn(obj, 'path')) {
            checkConfigStringType(obj.path, 'ResourceLocation', 'path');

            if (Object.hasOwn(obj, 'dir')) {
                throw new ConfigFieldError('ResourceLocation', "",
                    t('error.configs.varietyDefine', 'ResourceLocation', 'path', 'dir'));
            }
            if (Object.hasOwn(obj, 'rename')) {
                throw new ConfigFieldError('ResourceLocation', "",
                    t('error.configs.varietyDefine', 'ResourceLocation', 'path', 'rename'));
            }
            return ResourceLocation.fromPath(obj.path, folderMap);
        } else {
            let dir = obj.dir;
            if (isNullOrUndefined(dir)) {
                if (!defaultResourceLocation || !defaultResourceLocation.resourceDir) {
                    throw new ConfigFieldMissingError('ResourceLocation', 'path / dir');
                }
                dir = defaultResourceLocation.fullDir();
            } else {
                checkConfigStringType(dir, 'ResourceLocation', 'dir');
            }

            let name = obj.rename;
            if (isNullOrUndefined(name)) {
                if (!defaultResourceLocation || !defaultResourceLocation.fileName) {
                    throw new ConfigFieldMissingError('ResourceLocation', 'rename');
                }
                name = defaultResourceLocation.fileName;
            }

            return ResourceLocation.fromDirAndRename(dir, folderMap, name);
        }
    }

    fullPath(defaultResourceLocation = null) {
        return path.join(this.resourceDir.fullDir(), this.fileName);
    }
}

/*
    返回值：{ResourceFolder folder, string path}
 */
function getFolderAndPath(str, folderMap) {
    const obj = {folder: null, path: null};

    if (str.includes(':')) {
        let [folderName, restPath] = str.split('/', 2);
        if (restPath === undefined) restPath = "";

        if (!stringUsable(restPath, StringType.FILE_PATH)) {
            throw new ConfigFieldError('ResourceLocation', 'path',
                t('error.configs.invalidResourceDir', str));
        }

        obj.folder = folderMap.get(folderName);
        if (!obj.folder) {
            throw new ConfigFieldError('ResourceLocation', 'path',
                t('error.configs.invalidResourceFolder', str));
        }

        return obj;
    } else {
        obj.folder = BuiltinFolders.BASE;

        if (!stringUsable(str, StringType.FILE_PATH)) {
            throw new ConfigFieldError('ResourceLocation', 'path',
                t('error.configs.invalidResourceDir', str));
        }

        return obj;
    }
}