import {regularFileExists} from "../../public/fileSystem.js";
import path from "path";
import {ConfigFieldError, ConfigFieldTypeError, ConfigFileMissingError} from "../errors.js";
import {isPlainObject, StringType, stringUsable} from "../../public/type.js";
import {t} from "../../i18n/translate.js";
import {getRandomIntId} from "../../public/calculate.js";

export class ResourceGroup {
    constructor(id) {

    }
}

export class ResourceOption {

}

export class ResourceLike {
    constructor(id, type) {
        this.id = id;
    }

    async check(resourceDirPath) {
        return false;
        // To be overridden
    }

    async get(resourceDirPath) {
        return null;
        // To be overridden
    }
}

export class ResourceReference extends ResourceLike {
    constructor(id) {
        super(id);
    }

    async check(resourceDirPath) {
        const filePath = path.join(resourceDirPath, this.id);
        if (!await regularFileExists(filePath)) {
            throw new ConfigFileMissingError(filePath);
        }
        return true;
    }

    async get(resourceDirPath) {
        // TODO: 写从文件获取资源定义的逻辑
    }
}

export class InlineResource extends ResourceLike {
    constructor(id, obj) {
        super(id);
        this.obj = obj;
    }

    async check(resourceDirPath) {
        return true;
    }

    async get(resourceDirPath) {
        // TODO：写解析内联资源并对象化的逻辑
    }
}

ResourceLike.fromField = function(field, resourceDirPath) {
    let resourceLike;
    if (stringUsable(field)) {
        resourceLike = new ResourceReference(field);
    } else if (isPlainObject(field)) {
        let id;
        if (stringUsable(field.id)) {
            if (!stringUsable(field.id, StringType.FILE_NAME)) {
                throw new ConfigFieldError('Option', 'resources[*].id', t('error.configs.illegalCharacters', "", 'id', field.id));
            }
            id = `inline:${field.id}`;
        } else {
            id = `inline:resource_${getRandomIntId(10)}`;
        }
        resourceLike = new InlineResource(id, field);
    } else {
        throw new ConfigFieldTypeError('Option', 'resources[*]', 'string(ResourceConfigPath) / object(InlineResourceObj)', field);
    }
    return resourceLike;
}

export class ResourceList {
    constructor(groups, ) {
        this.groups = groups;
    }
}