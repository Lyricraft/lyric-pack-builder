import {checkConfigArray, checkConfigStringType} from "../../checker.js";
import {Condition} from "../../objects/conditions.js";
import {isPlainObject, StringType, stringUsable} from "../../../public/type.js";
import {ConfigFieldTypeError} from "../../errors.js";
import {ResourceFolder, resourceFolderTypeAndIdFromString} from "../../objects/resourceFolder.js";
import {parseInnerObj} from "../../parser.js";
import {t} from "../../../i18n/translate.js";

class FolderDefine {
    constructor(type, id) {
        this.type = type;
        this.id = id;
        this.paths = [];
    }

    addAPath(path, condition) {
        this.paths.push({path, condition});
    }

    static singlePath(type, id, path) {
        const folderDefine = new FolderDefine(type, id);
        folderDefine.addAPath(path, Condition.always());
        return folderDefine;
    }

    getPath(context, factors = null) {
        for (const item of this.paths) {
            if (item.condition.test(context, factors)) {
                return item.path;
            }
        }
        throw new Error(t('error.build.noConditionHit', `path of folder ${this.type}:${this.id}`));
        // TODO: 改为专门的错误类型
    }
}

export class FolderList {
    constructor(folderDefines) {
        this.folderDefines = folderDefines;
    }

    static from(array, map) {
        const folderDefines = [];

        checkConfigArray(array, 'list.yml', 'folders');
        for (const item of array) {
            let folderDefine;
            if (isPlainObject(item)) {
                checkConfigStringType(item.id, 'list.yml', 'folders[?].id');
                const typeAndId = resourceFolderTypeAndIdFromString(item.id);
                if (!typeAndId) {
                    throw ConfigFieldTypeError('list.yml', 'folders[?].id',
                        'string(FolderId)', item);
                }
                folderDefine = new FolderDefine(typeAndId.type, typeAndId.id);

                checkConfigArray(item.paths, 'list.yml', 'folders[?].paths',
                    undefined, 'object', (item2) => isPlainObject(item2));
                for (const pathItem of item.paths) {
                    checkConfigStringType(pathItem.path, 'list.yml', 'folders[?].paths[?].path',
                        undefined, 'string(FilePath)', StringType.FILE_PATH);
                    parseInnerObj(pathItem.condition,  'list.yml', 'folders[?].paths[?].condition',
                        Condition.fromString, Condition.always);
                    folderDefine.addAPath(pathItem.path, pathItem.condition);
                }
            } else if (stringUsable(item)) {
                const split = item.split('>');
                if (split.length !== 2) {
                    throw ConfigFieldTypeError('list.yml', 'folders[?]',
                        'FolderDefine[] / string(FolderDefineExp)', item);
                }
                const typeAndId = resourceFolderTypeAndIdFromString(split[0]);
                if (!typeAndId) {
                    throw ConfigFieldTypeError('list.yml', 'folders[?]',
                        'FolderDefine[] / string(FolderDefineExp)', item);
                }
                if (!stringUsable(split[1], StringType.PATH)) {
                    throw ConfigFieldTypeError('list.yml', 'folders[?]',
                        'FolderDefine[] / string(FolderDefineExp)', item);
                }
                folderDefine = FolderDefine.singlePath(typeAndId.type, typeAndId.id, split[1]);
            } else {
                throw ConfigFieldTypeError('list.yml', 'folders[?]',
                    'FolderDefine[] / string(FolderDefineExp)', item);
            }

            folderDefines.push(folderDefine);
        }

        return new FolderList(folderDefines);
    }

    exportToMap(map, conditionContext, conditionFactors = null) {
        for (const item of this.folderDefines) {
            ResourceFolder.createOne(item.type, item.id, item.getPath(conditionContext, conditionFactors), map);
        }
    }
}