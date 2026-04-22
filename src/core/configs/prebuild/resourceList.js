import {regularFileExists} from "../../public/fileSystem.js";
import path from "path";
import {
    ConfigError,
    ConfigFieldTypeError,
    ConfigFileMissingError
} from "../errors.js";
import {deepClone, deepMerge, isPlainObject, StringType, stringUsable} from "../../public/type.js";
import {t} from "../../i18n/translate.js";
import {getRandomIntId} from "../../public/calculate.js";
import {checkConfigArray, checkConfigField, checkConfigStringChars, checkConfigStringType} from "../checker.js";
import {Condition, DEFAULT_CONDITION_MAP} from "../objects/conditions.js";
import {parseInnerObj} from "../parser.js";

// 如果能一次做到极致的完美，那为什么还有经年累月的修复与优化呢？
// 与其原地踱步，不如先把纠结抛诸脑后，先去铺就前面的路。

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
        // TODO: 写解析内联资源并对象化的逻辑
    }
}

ResourceLike.fromField = function(field) {
    let resourceLike;
    if (stringUsable(field)) {
        resourceLike = new ResourceReference(field);
    } else if (isPlainObject(field)) {
        let id;
        if (stringUsable(field.id)) {
            checkConfigStringChars(field.id, 'Option', 'resources[id=?].id', StringType.FILE_NAME);
            id = `inline:${field.id}`;
        } else {
            id = `inline:resource_${getRandomIntId()}`;
        }
        resourceLike = new InlineResource(id, field);
    } else {
        throw new ConfigFieldTypeError('Option', 'resources[id=?]', 'string(ResourceConfigPath) / object(InlineResourceObj)', field);
    }

    return resourceLike;
}

export class ResourceOption {
    constructor(id, condition, resources, conDependencies = {}) {
        this.id = id;
        this.condition = condition;
        this.resources = resources; // Resource[]
        this.conDependencies = conDependencies;
    }

    static fromObj(obj){
        let id;
        if (obj.id) {
            id = checkConfigStringChars(obj.id, 'Option', 'id', StringType.FILE_NAME);
        } else {
            id = `option_${getRandomIntId()}`;
        }

        let conDependencies = {} ;
        let condition = parseInnerObj(obj.conditions, 'Option', 'condition',
            (str) => Condition.fromString(str, DEFAULT_CONDITION_MAP, conDependencies), null);
        if (!condition) {
            condition = Condition.always();
            conDependencies = {};
        }

        checkConfigArray(obj.resources, 'Option', 'resources', undefined, 'string(ResourceConfigPath) / object(InlineResourceObj) []', null, false); // 不为空、不可选
        const resources = [];
        for (const resourceObj of obj.resources) {
            resources.push(parseInnerObj(resourceObj, 'Option', 'resources', (field) => ResourceLike.fromField(field)));
        }

        return new ResourceOption(id, condition, resources, conDependencies);
    }
}

export class ResourceGroup {
    constructor(id, options, required) {
        this.id = id;
        this.options = options; // Map<ResourceOption>
        this.required = required;

        // 将所有 options 的条件依赖合并到此处的条件依赖
        this.conDependencies = {};
        for (const option of this.options.values()) {
            if (!option.conDependencies) {
                continue;
            }
            for (const [key, value] of Object.entries(option.conDependencies)) {
                if (!this.conDependencies[key]) {
                    this.conDependencies[key] = deepClone(value);
                } else {
                    if (Array.isArray(value)) {
                        this.conDependencies[key] = [...new Set([...this.conDependencies[key], ...value])];
                    } else {
                        this.conDependencies[key] = deepMerge(this.conDependencies[key], value);
                    }
                }
            }
        }
    }

    static fromObj (obj){
        let options = new Map();
        let id;

        // 简写形式：直接填 resources，不填 groups
        if (Object.hasOwn(obj, 'resources')) {
            if (Object.hasOwn(obj, 'groups')) {
                throw new ConfigError(t('error.configs.varietyDefine', 'Group', 'resources', 'groups'), `resources[id=${obj.id??'?'}]`);
            }
            let optionId;
            if (obj.id) {
                id = optionId
                    = checkConfigStringChars(obj.id, 'Group', 'option', StringType.FILE_NAME);
            } else {
                const randomId = getRandomIntId();
                id = `group_${randomId}`
                optionId = `option_${randomId}`;
            }

            const option = deepClone(obj);
            option.id = optionId;
            options.set(optionId, parseInnerObj(option, 'Group', `options[id=${optionId}]`,
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
            checkConfigArray(obj.options, 'Group', 'options', undefined, 'object(ResourceOption)', null, false); // 检查保证不为空
            for (const optionObj of obj.options) {
                const option = parseInnerObj(optionObj, 'Group', `options[id=${optionObj?.id??'?'}]`,
                    (optionObj) => ResourceOption.fromObj(optionObj));
                // 防止重复 id
                if (options.has(option.id)) {
                    throw new ConfigError(t('error.configs.duplicateId', 'Option', option.id), `options[id=${option.id}]`);
                }
                options.set(option.id, option);
            }
        }

        let required = checkConfigField(obj.required, 'Option', 'required', 'bool', (bool) => typeof bool === 'boolean', true);

        return new ResourceGroup(id, options, required);
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
        this.groups = groups; // Map<string, Group>
    }

    groupArray() {
        return this.groups.values();
    }

    static fromArray(array) {

        // array 必须是非空数组
        checkConfigArray(array, 'ResourceList', 'groups', undefined, 'object(Group)', null, false);

        // 先把所有 groups 解析了
        const unsortedGroupMap = new Map();
        for (const groupObj of array) {
            let group;
            // 是简写的 resource 引用？
            if (typeof groupObj === 'string') {
                checkConfigStringType(groupObj, 'ResourceList', 'groups[id=?]', undefined,
                    'string(ResourceId)', StringType.FILE_PATH);
                group = ResourceGroup.fromObj({resources: [groupObj]});
            } else {
                // 其余情况都必须是对象
                checkConfigField(groupObj, 'ResourceList', 'groups[id=?]', 'object(Group)',
                    (arg) => isPlainObject(arg));
                // 是不是直接写的内联 resource？（使用是否含有 type 判别）
                if (Object.hasOwn(groupObj, 'type')) {
                    group = ResourceGroup.fromObj({resources: [groupObj]});
                } else {
                    // 最后还有两种情况，一种是完整形式，一种是将 resource 和 option 简写成一层，
                    // 都可以直接交给 ResourceGroup.fromObj 来处理。
                    group = parseInnerObj(groupObj, 'ResourceList', `groups[id=${groupObj?.id??'?'}]`,
                        (arg) => ResourceGroup.fromObj(arg));
                }
            }
            // 防止重复 id
            if (unsortedGroupMap.has(group.id)) {
                throw new ConfigError(t('error.configs.duplicateId', 'Group', group.id), `groups[id=${group.id}]`)
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
    const dependencies = group.conDependencies;

    // 判断自指、不存在，以及放入依赖
    // 组
    if (dependencies.groups) {
        for (const groupDependencyId of dependencies.groups) {
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
    if (dependencies.options) {
        // 所有 options 依赖都会同时保存为 groups 依赖，因此到这里时已经检查了相关循环和自指，并处理好依赖。
        // 所以这里只需要检查 options 是否存在即可
        for (const optionDependencyPath of dependencies.options) {
            // 检查 group 是否已依赖
            const dependencyIndex = groupArray.findIndex(item => item.id === optionDependencyPath[0]);
            if (dependencyIndex > -1) {
                // 找到，判断其是否存在
                if (!groupArray[dependencyIndex].options.has(optionDependencyPath[1])) { // 注意 options 是 Map
                    // 不存在，抛出错误
                    throw new ConfigError(t('error.configs.conditionDependencyNotFound', group.id, 'Option', optionDependencyPath.join('.')), `groups[${group.id}].options[*].conditions`);
                }
            } else {
                // 一般情况不会到此分支，除非我的逻辑中存在漏洞。
                // 为避免出乎意料的问题，保险起见，抛出错误。
                throw new ConfigError(t('error.configs.conditionDependencyCannotSort', group.id, 'Option', optionDependencyPath.join('.'), chain));
            }
        }
    }
    // 资源
    if (dependencies.resources) {
        for (const resourceDependencyId of dependencies.resources) {
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