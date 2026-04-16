import {ConfigFieldError, ConfigFieldMissingError, ConfigFieldTypeError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {isNullOrUndefined, StringType, stringUsable} from "../../public/type.js";
import {checkConfigStringType} from "../checker.js";
import {BuiltinFolders, DEFAULT_FOLDER_MAP} from "./resourceFolder.js";
import path from "path";
import {TypedError} from "../../public/errors.js";

export class ResourceLocationIncompleteError extends TypedError {
    static TYPE = 'resourceLocationIncomplete';

    static LackOf = {
        DIR: 'dir',
        FILE_NAME: 'fileName',
    }

    constructor(lackOf) {
        super(ResourceLocationIncompleteError.TYPE,
            lackOf === ResourceLocationIncompleteError.LackOf.DIR ?
                t('error.configs.resourceLocationLacksDir') : t('error.configs.resourceLocationLacksFILE_NAME'));
        this.lackOf = lackOf;
    }
}

export class ResourceLocation {

    /*
        未定义的 dir 请使用 null，空字符串表示就是目前目录
     */
    constructor(folder, dir, fileName) {
        this.folder = folder;
        this.dir = dir;
        this.fileName = fileName;
    }

    static fromPath(p, folderMap) {
        const {folder, restPath} = getFolderAndPath(p, folderMap);
        if (restPath.length === 0) {
            throw new ConfigFieldTypeError('ResourceLocation', 'path', 'string(ResourcePath)', restPath);
        }
        return new ResourceLocation(folder, path.dirname(p), path.basename(p));
    }

    static fromDirAndRename(dir, folderMap, rename = null) {
        if (!isNullOrUndefined(rename) && !stringUsable(rename, StringType.FILE_NAME)) {
            throw new ConfigFieldTypeError('ResourceLocation', 'rename', 'string(FileName)', rename);
        }
        const {folder, restPath} = getFolderAndPath(dir, folderMap);
        return new ResourceLocation(folder, restPath, rename);
    }

    static fromObj(obj, folderMap, defaultDir = null) {
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
                if (!defaultDir) {
                    throw new ConfigFieldMissingError('ResourceLocation', 'path / dir');
                }
                dir = defaultDir;
            } else {
                checkConfigStringType(dir, 'ResourceLocation', 'dir');
            }
            return ResourceLocation.fromDirAndRename(dir, folderMap, obj.rename??null);
        }
    }

    checkIntegrity(defaultResourceLocation = null) {
        if (!(stringUsable(this.dir) || this.dir === "")) {
            if (!defaultResourceLocation || !(stringUsable(defaultResourceLocation.dir) || this.dir === "")) {
                throw new ResourceLocationIncompleteError(ResourceLocationIncompleteError.LackOf.DIR);
            }
        }
        if (!stringUsable(this.fileName)) {
            if (!defaultResourceLocation || !stringUsable(defaultResourceLocation.dir)) {
                throw new ResourceLocationIncompleteError(ResourceLocationIncompleteError.LackOf.FILE_NAME);
            }
        }
        return this;
    }

    fullPath(defaultResourceLocation = null) {
        this.checkIntegrity();
        return path.join(this.folder ? this.folder.path : BuiltinFolders.BASE.path,
            (stringUsable(this.dir) || this.dir === "") ? this.dir : defaultResourceLocation.dir,
            stringUsable(this.fileName ? this.fileName : defaultResourceLocation.fileName));
    }
}

/*
    返回值：{folder, path}
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