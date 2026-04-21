import {ConfigError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {Version, VersionRange} from "../../objects/versions.js";
import {checkEnum, isPlainObject, StringType, stringUsable} from "../../public/type.js";
import {ModLoader, PackFormat} from "../../mc/mcMods.js";
import {checkConfigField, checkConfigStringType} from "../checker.js";
import {StringExpressionParser} from "../../utils/stringExpressionParser.js";
import {all} from "axios";


const defaultConditionMap = new Map();

export function extendConditionMap() {
    return new Map(defaultConditionMap);
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

    constructor() {
    }

    test(context, factors = null) {
        return false;
    }

    static always() {
        return new BoolCondition(true);
    }

    static never() {
        return new BoolCondition(false);
    }

    static all(conditions) {
        return new AndCondition({and: conditions});
    }

    static any(conditions) {
        return new OrCondition({or: conditions});
    }

    static fromString(str, conditionMap = defaultConditionMap, dependency = null) {
        checkConfigStringType(str, 'condition', '.', undefined, 'string(ConditionExpression)');
        str = str.trim();
        checkConfigStringType(str, 'condition', '.', undefined, 'string(ConditionExpression)');
        const exp = new StringExpressionParser(str);

        // 事实上，一个条件表达式可以看作只有一个关键字，其余都是嵌套。
        // 所以在将一个关键字与其参数解析完后，表达式理应已结束。

        const result = expNextCondition(exp, conditionMap, dependency);
        if (exp.nextValidChar() !== "") {
            // 表达式该结束未结束
        }
        return result;
    }

}

class BoolCondition extends Condition {
    constructor(bool) {
        super();
        this.bool = bool;
    }

    test(context, tracker = null) {
        return !!this.bool;
    }
}

class NotCondition extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }

    test(context, tracker = null) {
        for (const item of this.arg)
            if (!item.test(context, tracker)) return true;
        return false;
    }
}

class AndCondition extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }

    test(context, tracker = null) {
        for (const item of this.arg)
            if (!item.test(context, tracker)) return false;
        return true;
    }
}

class OrCondition extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }

    test(context, tracker = null) {
        for (const item of this.arg)
            if (item.test(context, tracker)) return true;
        return false;
    }
}

function expNextCondition(exp, conditionMap, dependency) {

    // 读关键字
    exp.nextValidChar();
    if (exp.isEnded() || !exp.isKeywordBeginning()) {
        // 不是关键字
    }
    const keyword = exp.back().nextKeyword();
    if (!stringUsable(keyword)) {
        // 关键字不完整
    }

    exp.back();
    if (keyword === 'TRUE' || keyword === 'FALSE') {
        return new BoolCondition(keyword === 'TRUE');
    } else if (keyword === 'and' || keyword === 'or' || keyword === 'not') {
        const nestedConditions = [];
        if (exp.nextValidChar() !== '(') {
            // 期待 ( 却不是
        }
        while (true) {
            const next = exp.nextValidChar();
            if (!exp.isKeywordBeginning()) {
                // 期待关键字但不是
            }
            exp.back()
            nestedConditions.push(expNextCondition(exp, conditionMap, dependency));

            const afterNext = exp.nextValidChar();
            if (next === "") {
                // 缺失 )
            }
            if (next === ")") {
                break;
            }
            if (next !== ",") {
                // 期待 , 或 ) 但都不是
            }
        }

        if (keyword === 'and') {
            return new AndCondition(nestedConditions);
        } else if (keyword === 'or') {
            return new OrCondition(nestedConditions);
        } else {
            return new NotCondition(nestedConditions);
        }
    } else {
        if (conditionMap.has(keyword)) {
            const next = exp.nextValidChar();
            const endedRegex = /[,\s\]]/;
            if (next === "[") {
                const args = [];
                while (true) {
                    const arg = exp.nextArg(endedRegex, false, StringExpressionParser.QUOTES_REGEX);
                    exp.back();

                    if (!stringUsable(arg)) {
                        // 缺失参数
                    }
                    args.push(arg);

                    const afterNext = exp.nextValidChar();
                    if (afterNext === ']') {
                        break;
                    }
                    if (afterNext !== ',') {
                        // 期待 ] 或 , 但都不是
                    }
                }

                let allFit = false;
                if (!exp.isEnded()) {
                    if (exp.nextChar() === '!') {
                        allFit = true;
                    }
                    exp.back();
                }

                return new (conditionMap.get(keyword))(args, allFit, dependency)
            } else {
                const arg =
                    exp.back().nextArg(endedRegex, true, StringExpressionParser.QUOTES_REGEX);
                if (!stringUsable(arg)) {
                    // 缺失参数
                }
                exp.back();
                return new (conditionMap.get(keyword))([arg], false, dependency)
            }
        } else {
            // 无法识别的条件类型
        }
    }
}

class ArrayArgCondition extends Condition {
    constructor(array, allFit, dependency) {
        super();
        this.array = [];
        for (const item of array) {
            this.array.push(this.transformOneArg(item, dependency));
        }
        this.allFit = allFit
    }

    test(context, factors = null) {
        for (const item of this.array) {

            const result = this.testOne(item, context, factors);
            if (this.allFit) {
                if (!result) return false;
            } else {
                if (result) return true;
            }
        }
        return this.allFit;
    }

    transformOneArg(arg, dependency = null) {
        // To be overridden
    }

    prepareTest(factors = null) {
        // To be overridden
    }

    testOne(item, context, factors = null) {
        // To be overridden
    }
}

class McVersionCondition extends ArrayArgCondition {

    constructor(array, allFit, dependency) {
        if (allFit) {
            // 不能使用 allFIt 要抛错
        }
        super(array, allFit, dependency);
    }

    transformOneArg(arg, dependency = null) {
        let versionRange;
        try {
            versionRange = VersionRange.fromString(arg);
        } catch (e) {
            throw new ConfigError(t('error.configs.invalidConditionArgs', '', 'string(VersionRange)', this.arg), '.');
        }
        return versionRange;
    }

    prepareTest(factors = null) {
        if (factors && !factors.mcVersion) {
            factors.mcVersion = new Map();
        }
    }

    testOne(item, context, factors = null) {
        const result = item.fit(context.mcVersion);

        if (factors) {
            const versionRangeString = item.toString();
            if (!factors.mcVersion.has(versionRangeString)) {
                factors.mcVersion.set(versionRangeString, result);
            }
        }

        return result;
    }
}
defaultConditionMap.set('mcVersion', McVersionCondition);

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
defaultConditionMap.set('modLoader', ModLoaderCondition);

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
defaultConditionMap.set('packFormat', PackFormatCondition);

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
defaultConditionMap.set('group', GroupCondition);

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
defaultConditionMap.set('option', OptionCondition);

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
defaultConditionMap.set('resource', ResourceCondition);

