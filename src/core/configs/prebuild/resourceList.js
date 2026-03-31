import {regularFileExists} from "../../public/fileSystem.js";
import path from "path";
import {
    ConfigError,
    ConfigFieldTypeError,
    ConfigFileMissingError
} from "../errors.js";
import {deepClone, isPlainObject, StringType, stringUsable} from "../../public/type.js";
import {t} from "../../i18n/translate.js";
import {getRandomIntId} from "../../public/calculate.js";
import {checkConfigArray, checkConfigField, checkConfigInnerParse, checkConfigStringChars} from "../checker.js";
import {Condition} from "../objects/conditions.js";

export class ResourceLike {
    constructor(id, type) {
        this.id = id;
    }

    async check(resourceDirPath) {
        return false;
        // To be overridden
    }

    async get(resourceDirPath, cache = null) {
        if (!cache) {
            return this.fetch(resourceDirPath);
        }

        if (cache[this.id]) {
            return cache[this.id];
        } else {
            const resource = await this.fetch(resourceDirPath);
            cache[this.id] = resource;
            return resource;
        }
    }

    async fetch(resourceDirPath) {
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

    async fetch(resourceDirPath) {
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

    async fetch(resourceDirPath) {
        // TODO：写解析内联资源并对象化的逻辑
    }
}

ResourceLike.fromField = async function(field, resourceDirPath) {
    let resourceLike;
    if (stringUsable(field)) {
        resourceLike = new ResourceReference(field);
    } else if (isPlainObject(field)) {
        let id;
        if (stringUsable(field.id)) {
            checkConfigStringChars(field.id, 'Option', 'resources[*].id', StringType.FILE_NAME);
            id = `inline:${field.id}`;
        } else {
            id = `inline:resource_${getRandomIntId()}`;
        }
        resourceLike = new InlineResource(id, field);
    } else {
        throw new ConfigFieldTypeError('Option', 'resources[*]', 'string(ResourceConfigPath) / object(InlineResourceObj)', field);
    }

    await resourceLike.check(resourceDirPath);

    return resourceLike;
}

export class ResourceOption {
    constructor(id, condition, resources) {
        this.id = id;
        this.condition = condition;
        this.resources = resources;
    }

    static fromObj(obj){
        let id;
        if (obj.id) {
            id = checkConfigStringChars(obj.id, 'Option', 'id', StringType.FILE_NAME);
        } else {
            id = `option_${getRandomIntId()}`;
        }

        let condition = checkConfigInnerParse(obj.conditions, 'Option', 'conditions',
            (array) => Condition.fromArray(array), true);
        if (!condition) {
            condition = Condition.always();
        }

        const resources = checkConfigInnerParse(obj.resources, 'Option', 'resources',
            (field) => ResourceLike.fromField(field));
        checkConfigArray(resources, 'Option', 'resources', 'object(ResourceLike)');

        return new ResourceOption(id, condition, resources);
    }
}

export class ResourceGroup {
    constructor(id, options, required) {
        this.id = id;
        this.options = options;
        this.required = required;
    }

    static fromObj (obj){
        let options = new Map();
        let id;

        if (Object.hasOwn(obj, 'option')) {
            let id, optionId;
            if (obj.option) {
                id = optionId
                    = checkConfigStringChars(obj.option, 'Group', 'option', StringType.FILE_NAME);
            } else {
                const randomId = getRandomIntId();
                id = `group_${randomId}`
                optionId = `option_${randomId}`;
            }

            const option = deepClone(obj);
            option.id = optionId;
            options.set(optionId, checkConfigInnerParse(option, 'Group', 'options[*]',
                (optionObj) => ResourceOption.fromObj(optionObj)));
        } else {
            if (obj.id) {
                id = checkConfigStringChars(obj.id, 'Option', 'id', StringType.FILE_NAME);
            } else {
                id = `group_${getRandomIntId()}`;
            }
        }

        // 如果不等于零，说明是简写的，已经处理好 option 了，这里直接跳过。
        if (options.size === 0) {
            checkConfigArray(obj.options, 'Group', 'options', 'object(ResourceOption)'); // 检查保证不为空
            for (const optionObj of obj.options) {
                const option = checkConfigInnerParse(optionObj, 'Group', 'options[*]',
                    (optionObj) => ResourceOption.fromObj(optionObj));
                // 防止重复 id
                if (options.has(option.id)) {
                    throw new ConfigError(t('error.configs.duplicateId', 'Option', option.id), 'options[*]')
                }
                options.set(option.id, option);
            }
        }

        let required = checkConfigField(obj.required, 'Option', 'required', 'bool', (bool) => typeof bool === 'boolean', true, false);

        return new ResourceOption(id, options, required);
    }
}

class OptionPath{
    constructor(groupId, optionId){
        this.groupId = groupId;
        this.optionId = optionId;
    }

    toString(){
        return`${this.groupId}.${this.optionId}`;
    }

    fromString(str){
        // 从条件对象来，不做值校验了
        const segments = str.split(',');
        this.groupId = segments[0];
        this.optionId = segments[1];
    }
}

export class ResourceList {
    constructor(groups) {
        this.groups = groups;
    }

    static fromArray(array) {

        // array 必须是非空数组
        checkConfigArray(array, 'ResourceList', 'groups', 'object(Group)');

        // 先把所有 groups 解析了
        const unsortedGroupsMap = new Map();
        for (const groupObj of array) {
            // 必须是对象
            checkConfigField(groupObj, 'ResourceList', 'groups[*]', 'object(Group)',
                (arg) => isPlainObject(arg));
            // 解析并检查
            const group = checkConfigInnerParse(groupObj, 'ResourceList', 'groups[*]',
                (arg) => ResourceGroup.fromObj(arg));
            // 存入映射表
            unsortedGroupsMap.set(group.id, group);
        }

        // 将使用到的 ResourceLike 的 id 提取出来
        const resourceLikesMap = new Map(); // resourceId -> groupId[]
        for (const groupId of unsortedGroupsMap) {
            const group = unsortedGroupsMap[groupId];
            for (const option of group) {
                for (const resourceLike of option) {
                    if (!resourceLikesMap.has(resourceLike.id)) {
                        // 没有就创建个成员
                        resourceLikesMap.set(resourceLike.id, [groupId]);
                    } else {
                        // 有了就压进去
                        resourceLikesMap.get(resourceLike.id).push(groupId);
                    }
                }
            }
        }

        // 按照条件依赖关系给
        const groupsIdArray = [];
        const stack = []; // 这次咱们用栈模拟


    }
}

