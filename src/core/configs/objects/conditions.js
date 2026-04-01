import {ConfigError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {Version, VersionRange} from "../../objects/versions.js";
import {checkEnum, isPlainObject, StringType, stringUsable} from "../../public/type.js";
import {ModLoader, PackFormat} from "../../mc/mcMods.js";
import {checkConfigField} from "../checker.js";


const conditionMap = new Map();

export function extendConditionMap() {
    return new Map(conditionMap);
}

/*
    mcVersion: Version
 */
export function conditionContext(mcVersion, modLoader, packFormat, groups = [], options = [], resources = []) {
    return {
        mcVersion, modLoader, packFormat, groups, options, resources
    }
}

export class Condition {
    constructor(type, obj) {
        this.type = type;
        this.arg = obj[type];
    }

    static from(obj, map = conditionMap, strict = false) {
        if (!obj || typeof obj !== "object") {
            throw new ConfigError(t('error.configs.conditionNotAnObject', obj), "condition");
        }

        let used = null;
        for (const key in obj) {
            if (map.has(key)) {
                if (strict) {
                    if (used) {
                        throw new ConfigError(t('error.configs.multipleConditionTypes', obj), "condition");
                    }
                    used = new (map.get(key))(obj, map);
                } else {
                    return new (map.get(key))(obj, map)
                }
            }
        }
        if (used) {
            return used;
        }
        throw new ConfigError(t('error.configs.invalidConditionType', JSON.stringify(obj)), "condition");
    }

    static fromArray(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return Condition.always();
        }
        if (array.length === 1) {
            return Condition.from(checkConfigField(array[0],
                'conditions', 'item', 'object(Condition)', (obj) => isPlainObject(obj)));
        }
        return Condition.all(checkConfigField(array, 'conditions', 'array', 'object(Condition)[]',
            (arr) => arr.every((obj) => isPlainObject(obj))));
    }

    test(context, tracker = null) {
        return false;
    }

    static always() {
        return new BoolCondition({bool: true});
    }

    static never() {
        return new BoolCondition({bool: false});
    }

    static all(conditions) {
        return new AndCondition({and: conditions});
    }

    static any(conditions) {
        return new OrCondition({or: conditions});
    }
}

class BoolCondition extends Condition {
    constructor(obj) {
        super('bool', obj);
        if (typeof this.arg !== 'boolean') {
            throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'bool', this.arg), this.type);
        }
    }

    test(context, tracker = null) {
        return !!this.arg;
    }
}
conditionMap.set('bool', BoolCondition)

class NotCondition extends Condition {
    constructor(obj, map = conditionMap) {
        super('not', obj);
        if (Array.isArray(this.arg)) {
            this.arg = new AndCondition({and: this.arg});
        }
        if (this.arg && typeof this.arg === 'object') {
            this.arg = Condition.from(this.arg, map);
            return;
        }
        throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'Condition / []', this.arg), this.type);
    }

    test(context, tracker = null) {
        return !this.arg.test(context, tracker);
    }
}
conditionMap.set('not', NotCondition);

class AndCondition extends Condition {
    constructor(obj, map = conditionMap) {
        super('and', obj);
        if (!Array.isArray(this.arg)) {
            throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'Condition[]', this.arg), this.type);
        }
        for (let i = 0; i < this.arg.length; i++) {
            if (!this.arg[i] || typeof this.arg[i] !== 'object') {
                throw new ConfigError(t('error.configs.invalidConditionArgs', `${this.type}[]`, 'Condition', this.arg), this.type);
            }
            this.arg[i] = Condition.from(this.arg[i], map);
        }
    }

    test(context, tracker = null) {
        for (const item of this.arg)
            if (!item.test(context, tracker)) return false;
        return true;
    }
}
conditionMap.set('and', AndCondition);

class OrCondition extends Condition {
    constructor(obj, map = conditionMap) {
        super('or', obj);
        if (!Array.isArray(this.arg)) {
            throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'Condition[]', this.arg), this.type);
        }
        for (let i = 0; i < this.arg.length; i++) {
            if (!this.arg[i] || typeof this.arg[i] !== 'object') {
                throw new ConfigError(t('error.configs.invalidConditionArgs', `${this.type}[]`, 'Condition', this.arg), this.type);
            }
            this.arg[i] = Condition.from(this.arg[i], map);
        }
    }

    test(context, tracker = null) {
        for (const item of this.arg)
            if (item.test(context, tracker)) return true;
        return false;
    }
}
conditionMap.set('or', OrCondition);

class McVersionCondition extends Condition {
    constructor(obj) {
        super('mcVersion', obj);
        if (!Array.isArray(this.arg)) {
            this.arg = new Array(this.arg);
        }
        for (let i = 0; i < this.arg.length; i++) {
            try {
                this.arg[i] = VersionRange.fromString(this.arg[i]);
            } catch (e) {
                throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'VersionRange / []', this.arg), this.type);
            }
        }
    }

    test(context, tracker = null) {
        if (!context.mcVersion) {
            return false;
        }
        if (tracker && !tracker.mcVersion) {
            tracker.mcVersion = context.mcVersion.toString();
        }
        for (const range of this.arg) {
            if (range.fit(context.mcVersion)) return true;
        }
        return false;
    }
}
conditionMap.set('mcVersion', McVersionCondition);

class ModLoaderCondition extends Condition {
    constructor(obj) {
        super('modLoader', obj);
        if (!Array.isArray(this.arg)) {
            this.arg = new Array(this.arg);
        }
        for (const item of this.arg) {
            if (!checkEnum(ModLoader, item)) {
                throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'ModLoader / []', this.arg), this.type);
            }
        }
    }

    test(context, tracker = null) {
        if (!context.modLoader) {
            return false;
        }
       if (tracker && !tracker.modLoader) {
           tracker.modLoader = context.modLoader;
       }
        return this.arg.includes(context.modLoader);
    }
}
conditionMap.set('modLoader', ModLoaderCondition);

class PackFormatCondition extends Condition {
    constructor(obj) {
        super('packFormat', obj);
        if (!Array.isArray(this.arg)) {
            this.arg = new Array(this.arg);
        }
        for (const item of this.arg) {
            if (!checkEnum(PackFormat, item)) {
                throw new ConfigError(t('error.configs.invalidConditionArgs', this.type, 'PackFormat / []', this.arg), this.type);
            }
        }
    }

    test(context, tracker = null) {
        if (!context.packFormat) {
            return false;
        }
        if (tracker && !tracker.packFormat) {
            tracker.packFormat = context.packFormat;
        }
        return this.arg.includes(context.packFormat);
    }
}
conditionMap.set('packFormat', PackFormatCondition);

class ReferenceCondition extends Condition {
    constructor(type, obj) {
        super(type, obj);
        if (!Array.isArray(this.arg)) {
            this.arg = new Array(this.arg);
        }
        for (const item of this.arg) {
            this.checkArg(item);
        }
        this.allFit = !!obj.allFit;
    }

    test(context, tracker = null) {
        if (tracker?.dependency && !tracker.dependency[this.type]) {
            tracker.dependency[this.type] = [];
        }

        for (const item of this.arg) {
            if (tracker?.dependency && !tracker.dependency[this.type].includes(item)) {
                tracker.dependency[this.type].push(item);
            }

            const result = this.testOne(item, context);
            if (this.allFit) {
                if (!result) return false;
            } else {
                if (result) return true;
            }
        }
        return this.allFit;
    }

    checkArg(arg) {
        // To be overridden
    }

    testOne(item, context) {
        // To be overridden
    }
}

class GroupCondition extends ReferenceCondition {
    constructor(obj) {
        super('group', obj);
    }

    checkArg(arg) {
        if (!stringUsable(arg, StringType.FILE_NAME)) {
            throw new ConfigError(t('error.configs.invalidConditionArgs', `${this.type}[*]`, 'GroupId', this.arg), this.type);
        }
    }

    testOne(item, context) {
        return (context.groups?.includes(item));
    }
}
conditionMap.set('group', GroupCondition);

class OptionCondition extends ReferenceCondition {
    constructor(obj) {
        super('option', obj);
    }

    checkArg(arg) {
        if (!stringUsable(arg, StringType.FILE_NAME) || !/^[^.]+\.[^.]+$/.test(arg)) {
            throw new ConfigError(t('error.configs.invalidConditionArgs', `${this.type}[*]`, 'OptionPath', this.arg), this.type);
        }
    }

    testOne(item, context) {
        return (context.options?.includes(item));
    }
}
conditionMap.set('option', OptionCondition);

class ResourceCondition extends ReferenceCondition {
    constructor(obj) {
        super('resource', obj);
    }

    checkArg(arg) {
        if (!stringUsable(arg.replace(/^inline:/, ""), StringType.FILE_PATH)) {
            // resourcePath 可能以 inline: 开头，其余情况不应存在冒号
            throw new ConfigError(t('error.configs.invalidConditionArgs', `${this.type}[*]`, 'ResourcePath', this.arg), this.type);
        }
    }

    testOne(item, context) {
        return (context.resources?.includes(item));
    }
}
conditionMap.set('resource', ResourceCondition);