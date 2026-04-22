import {ConfigError, ConfigFieldError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {VersionRange} from "../../objects/versions.js";
import {checkEnum, StringType, stringUsable} from "../../public/type.js";
import {ModLoader, PackFormat} from "../../mc/mcMods.js";
import {checkConfigStringType} from "../checker.js";
import {StringExpressionParser} from "../../utils/StringExpressionParser.js";

// 在这一刻，我明白了：原来屎山，并不一定是丑陋的。

export const DEFAULT_CONDITION_MAP = new Map();

export function extendConditionMap() {
    return new Map(DEFAULT_CONDITION_MAP);
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

    static fromString(str, conditionMap = DEFAULT_CONDITION_MAP, dependencies = null) {
        checkConfigStringType(str, 'condition', '.', undefined, 'string(ConditionExpression)');
        str = str.trim();
        checkConfigStringType(str, 'condition', '.', undefined, 'string(ConditionExpression)');
        const exp = new StringExpressionParser(str);

        // 事实上，一个条件表达式可以看作只有一个关键字，其余都是嵌套。
        // 所以在将一个关键字与其参数解析完后，表达式理应已结束。

        const result = expNextCondition(exp, conditionMap, dependencies);
        if (stringUsable(exp.nextValidChar())) {
            // 表达式该结束未结束
            throw new ConfigFieldError("", 'condition',  t('error.configs.expEndNeeded', 'Condition', exp.nowChar()));
        }
        return result;
    }

}

class BoolCondition extends Condition {
    constructor(bool) {
        super();
        this.bool = bool;
    }

    test(context, factors = null) {
        return !!this.bool;
    }
}

class NotCondition extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }

    test(context, factors = null) {
        for (const item of this.conditions)
            if (!item.test(context, factors)) return true;
        return false;
    }
}

class AndCondition extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }

    test(context, factors = null) {
        for (const item of this.conditions)
            if (!item.test(context, factors)) return false;
        return true;
    }
}

class OrCondition extends Condition {
    constructor(conditions) {
        super();
        this.conditions = conditions;
    }

    test(context, factors = null) {
        for (const item of this.conditions)
            if (item.test(context, factors)) return true;
        return false;
    }
}

function expNextCondition(exp, conditionMap, dependencies) {

    // 读关键字
    exp.nextValidChar();
    if (exp.isEnded()) {
        throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedEnd', 'Condition', 'Keyword'));
    }
    if (!exp.isKeywordBeginning()) {
        // 不是关键字
        throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedChar', 'Condition', 'Keyword', exp.nowChar()));
    }
    const keyword = exp.back().nextKeyword();
    if (!stringUsable(keyword)) {
        // 关键字不完整
        throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedEnd', 'Condition', 'Keyword'));
    }

    if (keyword === 'TRUE' || keyword === 'FALSE') {
        return new BoolCondition(keyword === 'TRUE');
    } else if (keyword === 'and' || keyword === 'or' || keyword === 'not') {
        const nestedConditions = [];
        if (exp.nextValidChar() !== '(') {
            // 期待 ( 却不是
            throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedChar', 'Condition', '(', exp.nowChar()));
        }
        while (true) {
            const next = exp.nextValidChar();
            if (!exp.isKeywordBeginning()) {
                // 期待关键字但不是
                throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedChar', 'Condition', 'Keyword', exp.nowChar()));
            }
            exp.back();
            nestedConditions.push(expNextCondition(exp, conditionMap, dependencies));

            const afterNext = exp.nextValidChar();
            if (afterNext === "") {
                // 缺失 )
                throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedEnd', 'Condition', ')', 'Keyword'));
            }
            if (afterNext === ")") {
                break;
            }
            if (afterNext !== ",") {
                // 期待 , 或 ) 但都不是
                throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedChar', 'Condition', ', / )', afterNext));
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
            const endedRegex = /[,\s\])]/;
            if (next === "[") {
                const args = [];
                while (true) {
                    exp.nextValidChar();
                    const arg = exp.back().nextArg(endedRegex, false, StringExpressionParser.QUOTES_REGEX);

                    if (!stringUsable(arg)) {
                        // 缺失参数
                        throw new ConfigFieldError("", 'condition',  t('error.configs.expLackArg', 'Condition', 'ConditionArg'));
                    }
                    args.push(arg);

                    const afterNext = exp.nextValidChar();
                    if (afterNext === ']') {
                        break;
                    }
                    if (afterNext !== ',') {
                        // 期待 ] 或 , 但都不是
                        throw new ConfigFieldError("", 'condition', t('error.configs.expUnexpectedChar', 'Condition', ', / ]', exp.nowChar()));
                    }
                }

                let allFit = false;
                if (!exp.isEnded()) {
                    if (exp.nextChar() === '!') {
                        allFit = true;
                    } else {
                        exp.back();
                    }
                }

                return new (conditionMap.get(keyword))(args, allFit, dependencies)
            } else {
                const arg =
                    exp.back().nextArg(endedRegex, true, StringExpressionParser.QUOTES_REGEX);
                if (!stringUsable(arg)) {
                    // 缺失参数
                    throw new ConfigFieldError("", 'condition',  t('error.configs.expLackArg', 'Condition', 'ConditionArg'));
                }
                return new (conditionMap.get(keyword))([arg], false, dependencies)
            }
        } else {
            // 无法识别的条件类型
            throw new ConfigFieldError("", 'condition',  t('error.configs.conditionInvalidType', keyword));
        }
    }
}

class ArrayArgCondition extends Condition {
    constructor(array, allFit, dependencies) {
        super();
        this.array = [];
        for (const item of array) {
            this.array.push(this.transformOneArg(item, dependencies));
        }
        this.allFit = allFit;
    }

    test(context, factors = null) {
        this.prepareTest(context, factors);

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

    transformOneArg(arg, dependencies = null) {
        // To be overridden
    }

    prepareTest(context, factors = null) {
        // To be overridden
    }

    testOne(item, context, factors = null) {
        // To be overridden
    }
}

class McVersionCondition extends ArrayArgCondition {

    constructor(array, allFit, dependencies = null) {
        if (allFit) {
            // 不能使用 allFIt 要抛错
            throw new ConfigError(t('error.configs.conditionNotSupportAllFit', 'mcVersion'), '.')
        }
        super(array, allFit, dependencies);
    }

    transformOneArg(arg, dependencies = null) {
        let versionRange;
        try {
            versionRange = VersionRange.fromString(arg);
        } catch (e) {
            throw new ConfigError(t('error.configs.conditionInvalidArgs', 'mcVersion', 'string(VersionRange)', arg), '.');
        }
        return versionRange;
    }

    prepareTest(context, factors = null) {
        if (factors && !factors.mcVersion) {
            factors.mcVersion = context.mcVersion;
        }
    }

    testOne(item, context, factors = null) {
        return item.fit(context.mcVersion);
    }
}
DEFAULT_CONDITION_MAP.set('mcVersion', McVersionCondition);

class ModLoaderCondition extends ArrayArgCondition {

    constructor(array, allFit, dependencies) {
        if (allFit) {
            // 不能使用 allFit 要抛错
            throw new ConfigError(t('error.configs.conditionNotSupportAllFit', 'modLoader'), '.')
        }
        super(array, allFit, dependencies);
    }

    transformOneArg(arg, dependencies = null) {
        if (!checkEnum(ModLoader, arg)) {
            throw new ConfigError(t('error.configs.conditionInvalidArgs', 'modLoader', 'string(ModLoader)', arg), '.');
        }
        return arg;
    }

    prepareTest(context, factors = null) {
        if (factors && !factors.mcVersion) {
            factors.mcVersion = context.mcVersion;
        }
    }

    testOne(item, context, factors = null) {
        return context.modLoader === item;
    }
}
DEFAULT_CONDITION_MAP.set('modLoader', ModLoaderCondition);

class PackFormatCondition extends ArrayArgCondition {
    constructor(array, allFit, dependencies = null) {
        if (allFit) {
            // 不能使用 allFIt 要抛错
            throw new ConfigError(t('error.configs.conditionNotSupportAllFit', 'packFormat'), '.')
        }
        super(array, allFit, dependencies);
    }

    transformOneArg(arg, dependencies = null) {
        if (!checkEnum(PackFormat, arg)) {
            throw new ConfigError(t('error.configs.conditionInvalidArgs', 'PackFormat', 'string(PackFormat)', arg), '.');
        }
        return arg;
    }

    prepareTest(context, factors = null) {
        if (factors && !factors.packFormat) {
            factors.packFormat = context.packFormat;
        }
    }

    testOne(item, context, factors = null) {
        return context.packFormat === item;
    }
}
DEFAULT_CONDITION_MAP.set('packFormat', PackFormatCondition);

class OptionCondition extends ArrayArgCondition {

    transformOneArg(arg, dependencies = null) {
        if (!stringUsable(arg)) {
            throw new ConfigError(t('error.configs.conditionInvalidArgs', 'option', 'string(OptionPath)', arg), '.');
        }

        let optionPath;
        if (arg.includes('.')) {
            const split = arg.split('.');
            if (split.length !== 2 || !stringUsable(split[0], StringType.ID) || !stringUsable(split[1], StringType.ID)) {
                throw new ConfigError(t('error.configs.conditionInvalidArgs', 'option', 'string(OptionPath)', arg), '.');
            }
            optionPath = [split[0], split[1]];
        } else {
            if (!stringUsable(arg, StringType.ID)) {
                throw new ConfigError(t('error.configs.conditionInvalidArgs', 'option', 'string(OptionPath)', arg), '.');
            }
            optionPath = [arg];
        }

        if (dependencies) {
            if (!dependencies.groups) {
                dependencies.groups = [];
            }
            if (!dependencies.groups.includes(optionPath[0])) {
                dependencies.groups.push(optionPath[0]);
            }

            if (optionPath.length === 2) {
                if (!dependencies.options) {
                    dependencies.options = [];
                }
                if (!dependencies.options.includes(optionPath)) {
                    dependencies.options.push(optionPath);
                }
            }
        }

        return optionPath;
    }

    testOne(item, context, factors = null) {
        // context.options 中存的是 OptionPath 对象，且 group 的值唯一
        for (const optionPath of context.options) {
            if (optionPath.group === item.group) {
                if (!stringUsable(item.option)) {
                    return true;
                } else {
                    return optionPath.option === item.option;
                }
            }
        }
        return false;
    }
}
DEFAULT_CONDITION_MAP.set('option', OptionCondition);

class ResourceCondition extends ArrayArgCondition {

    transformOneArg(arg, dependencies = null) {
        if (!stringUsable(arg.replace(/^inline:/, ""), StringType.FILE_PATH)) {
            // resourcePath 可能以 inline: 开头，其余情况不应存在冒号
            throw new ConfigError(t('error.configs.conditionInvalidArgs', `resource`, 'string(ResourcePath)', arg), '.');
        }

        if (dependencies) {
            if (!dependencies.resources) {
                dependencies.resources = [];
            }
            if (!dependencies.resources.includes(arg)) {
                dependencies.resources.push(arg);
            }
        }

        return arg;
    }

    testOne(item, context, factors = null) {
        return (context.resources?.includes(item));
    }
}
DEFAULT_CONDITION_MAP.set('resource', ResourceCondition);

