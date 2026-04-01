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
        this.resources = resources; // Resource[]
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
        this.options = options; // Map<ResourceOption>
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

    static fromString(str){
        // 从条件对象来，不做值校验了
        const segments = str.split('.');
        return new OptionPath(segments[0], segments[1]);
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
        const unsortedGroupMap = new Map();
        for (const groupObj of array) {
            // 必须是对象
            checkConfigField(groupObj, 'ResourceList', 'groups[*]', 'object(Group)',
                (arg) => isPlainObject(arg));
            // 解析并检查
            const group = checkConfigInnerParse(groupObj, 'ResourceList', 'groups[*]',
                (arg) => ResourceGroup.fromObj(arg));
            // 防止重复 id
            if (unsortedGroupMap.has(group.id)) {
                throw new ConfigError(t('error.configs.duplicateId', 'Group', group.id), 'groups[*]')
            }
            // 存入映射表
            unsortedGroupMap.set(group.id, group);
        }

        // 将使用到的 ResourceLike 的 id 提取出来
        const resourceLikeMap = new Map(); // resourceId -> groupId[]
        for (const groupId of unsortedGroupMap.keys()) {
            const group = unsortedGroupMap.get(groupId);
            for (const option of group.options.values()) { // group.options 是 Map
                for (const resourceLike of option.resources) { // option.resources 是 Array
                    if (!resourceLikeMap.has(resourceLike.id)) {
                        // 没有就创建个成员
                        resourceLikeMap.set(resourceLike.id, [groupId]);
                    } else {
                        // 有了就压进去
                        resourceLikeMap.get(resourceLike.id).push(groupId);
                    }
                }
            }
        }

        // 按照条件依赖关系给排序
        const groupArray = []; // 实际上是倒序
        while (unsortedGroupMap.size > 0) {
            const key = unsortedGroupMap.keys().next().value; // 拿到第一个键
            moveGroupToSortingList(key, 0, groupArray, unsortedGroupMap, resourceLikeMap, []); // 加到第一个（物理）
        }

        // 倒序放入新 Map
        const groupMap = new Map();
        for (let i = groupArray.length - 1; i >= 0; i--) {
            groupMap.set(groupArray[i].id, groupArray[i]);
        }

        // 大功告成
        return new ResourceList(groupMap);
    }
}

function moveGroupToSortingList(key, index, groupArray, unsortedGroupMap, resourceLikeMap, chain) {
    // chain 中所有成员均为 group id

    // 先移动到指定位置
    const group = unsortedGroupMap.get(key);
    groupArray.splice(index, 0, group);
    unsortedGroupMap.delete(key);

    // 查找各种依赖
    const tracker = {dependency: {}};
    for (const option of group.options.values()) {
        option.condition.test({}, tracker);
    }

    // 判断自指、不存在，以及放入依赖
    // 组
    if (tracker.dependency.group) {
        for (const groupDependencyId of tracker.dependency.group) {
            // 检查是否自指
            if (groupDependencyId === group.id) {
                throw new ConfigError(t('error.configs.conditionSelfDependency', group.id, 'Group', groupDependencyId), `groups[${group.id}].options[*].conditions`);
            }
            // 检查是否循环依赖
            if (chain.includes(groupDependencyId)) {
                throw new ConfigError(t('error.configs.conditionCircularDependency', group.id, chain), `groups[${group.id}].options[*].conditions`);
            }
            // 检查是否已依赖
            const dependencyIndex = groupArray.findIndex(item => item.id === groupDependencyId);
            if (dependencyIndex > -1) {
                // 找到，判断其位置
                if (dependencyIndex > index) {
                    // 正常已依赖，可以处理下一个
                } else {
                    // 一般情况不会到此分支，除非我的逻辑中存在漏洞。
                    // 为避免出乎意料的问题，保险起见，抛出错误。
                    throw new ConfigError(t('error.configs.conditionDependencyCannotSort', group.id, 'Group', groupDependencyId, chain));
                }
            } else {
                // 检查是否存在
                if (unsortedGroupMap.has(groupDependencyId)) {
                    // 存在，递归调用依赖
                    moveGroupToSortingList(groupDependencyId, index + 1, groupArray, unsortedGroupMap, resourceLikeMap, [...chain, group.id]);
                } else {
                    // 不存在，抛出错误
                    throw new ConfigError(t('error.configs.conditionDependencyNotFound', group.id, 'Group', groupDependencyId), `groups[${group.id}].options[*].conditions`);
                }
            }
        }
    }
    // 选项
    if (tracker.dependency.option) {
        for (const optionDependencyId of tracker.dependency.option) {
            // 解析 option ID
            const optionDependencyPath = OptionPath.fromString(optionDependencyId);
            // 检查是否自指
            if (optionDependencyPath.groupId === group.id) {
                throw new ConfigError(t('error.configs.conditionSelfDependency', group.id, 'Option', optionDependencyId), `groups[${group.id}].options[*].conditions`);
            }
            // 检查是否循环依赖
            if (chain.includes(optionDependencyPath.groupId)) {
                throw new ConfigError(t('error.configs.conditionCircularDependency', group.id, chain), `groups[${group.id}].options[*].conditions`);
            }
            // 检查 group 是否已依赖
            const dependencyIndex = groupArray.findIndex(item => item.id === optionDependencyPath.groupId);
            if (dependencyIndex > -1) {
                // 找到，判断其位置
                if (dependencyIndex > index) {
                    // 检查 option 是否存在
                    if (!groupArray[dependencyIndex].options.has(optionDependencyPath.optionId)) { // 注意 options 是 Map
                        // 不存在，抛出错误
                        throw new ConfigError(t('error.configs.conditionDependencyNotFound', group.id, 'Option', optionDependencyId), `groups[${group.id}].options[*].conditions`);
                    }
                    // 正常已依赖，可以处理下一个
                } else {
                    // 一般情况不会到此分支，除非我的逻辑中存在漏洞。
                    // 为避免出乎意料的问题，保险起见，抛出错误。
                    throw new ConfigError(t('error.configs.conditionDependencyCannotSort', group.id, 'Option', optionDependencyId, chain));
                }
            } else {
                // 检查 group 和 option 是否都存在
                if (unsortedGroupMap.has(optionDependencyPath.groupId) && unsortedGroupMap.get(optionDependencyPath.groupId).options.has(optionDependencyPath.optionId)) {
                    // 存在，递归调用依赖
                    moveGroupToSortingList(optionDependencyPath.groupId, index + 1, groupArray, unsortedGroupMap, resourceLikeMap, [...chain, group.id]);
                } else {
                    // 不存在，抛出错误
                    throw new ConfigError(t('error.configs.conditionDependencyNotFound', group.id, 'Option', optionDependencyId), `groups[${group.id}].options[*].conditions`);
                }
            }
        }
    }
    // 资源
    if (tracker.dependency.resource) {
        for (const resourceDependencyId of tracker.dependency.resource) {
            // 检查是否存在
            if (!resourceLikeMap.has(resourceDependencyId)) {
                throw new ConfigError(t('error.configs.conditionDependencyNotFound', group.id, 'Resource', resourceDependencyId), `groups[${group.id}].options[*].conditions`);
            }
            // 遍历每一个 group
            for (const groupDependencyId of resourceLikeMap.get(resourceDependencyId)) {
                // 检查是否循环依赖
                if (chain.includes(groupDependencyId)) {
                    throw new ConfigError(t('error.configs.conditionCircularDependency', group.id, chain), `groups[${group.id}].options[*].conditions`);
                }
                // 检查是否已依赖
                const dependencyIndex = groupArray.findIndex(item => item.id === groupDependencyId);
                if (dependencyIndex > -1) {
                    // 找到，判断其位置
                    if (dependencyIndex > index) {
                        // 正常已依赖，可以处理下一个
                    } else {
                        // 一般情况不会到此分支，除非我的逻辑中存在漏洞。
                        // 为避免出乎意料的问题，保险起见，抛出错误。
                        throw new ConfigError(t('error.configs.conditionDependencyCannotSort', group.id, 'Group', groupDependencyId, chain));
                    }
                } else {
                    // 递归调用依赖
                    moveGroupToSortingList(groupDependencyId, index + 1, groupArray, unsortedGroupMap, resourceLikeMap, [...chain, group.id]);
                }
            }
        }
    }
}