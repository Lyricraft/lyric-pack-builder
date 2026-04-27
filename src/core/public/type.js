export const StringType = {
    STRING: 'string',
    FILE_NAME: 'fileName',
    PATH: 'path',
    FILE_PATH: 'filePath',
    ID: 'id',
}

const stringTestMap = new Map()
    .set(StringType.FILE_NAME, /^[^/*?:"<>|]+$/)
    // 所有文件系统路径均只能用正斜杠
    .set(StringType.PATH, /^(?!.*\/\/)[^/*?:"<>|]+(?:\/[^/*?:"<>|]+)*$/)
    .set(StringType.FILE_PATH, /^(?!.*\/\/)[^/*?:"<>|]+(?:\/[^/*?:"<>|]+)*$/)
    // 由字母、数字、下划线、连字符组成。以字母或下划线开头，不能以连字符结尾
    .set(StringType.ID, /^[A-Za-z_][A-Za-z0-9_-]*(?<!-)$/)
;

export function stringUsable(str, type = StringType.STRING) {
    if (typeof str !== 'string' || str.length < 1 || str === '\0') {
        return false;
    }
    if (type === StringType.STRING) {
        return true;
    }

    const regex = stringTestMap.get(type);
    if (regex) {
        return regex.test(str);
    }

    return false;
}

export function isPlainObject(value) {
    return value !== null && typeof value === 'object'
        && !Array.isArray(value);
}

export function deepClone(value) {
    if (Array.isArray(value)) {
        return value.map((item) => deepClone(item));
    }

    if (isPlainObject(value)) {
        const cloned = {};
        for (const key of Object.keys(value)) {
            cloned[key] = deepClone(value[key]);
        }
        return cloned;
    }

    return value;
}

export function deepMerge(template, active) {
    if (!isPlainObject(active) || !isPlainObject(template)) {
        return template;
    }

    return deepMergeLoop(deepClone(template), active);
}

function deepMergeLoop(template, active) {

    for (const key of Object.keys(active)) {
        const activeValue = active[key];
        const templateValue = template[key];

        if (isPlainObject(activeValue) && isPlainObject(templateValue)) {
            deepMergeLoop(templateValue, activeValue);
            continue;
        }

        template[key] = deepClone(activeValue);
    }

    return template;
}

export function checkEnum(enumObj, value) {
    for (const key in enumObj) {
        if (enumObj[key] === value) {
            return true;
        }
    }
    return false;
}

export function getStrictType(obj) {
    if (obj === null) return 'Null';
    if (obj === undefined) return 'Undefined';
    // 基础类型返回标签，对象返回构造函数
    return typeof obj !== 'object'
        ? Object.prototype.toString.call(obj)
        : obj.constructor;
}

export function isStrictSameType(a, b) {
    return getStrictType(a) === getStrictType(b);
}

export function isNullOrUndefined(obj) {
    return obj === null || obj === undefined;
}

/*
    标准化对象，主要用于对对象取哈希前的预处理。输入任意可转化为 JSON 的类型，输出 JSON 字符串

    处理时，所有 真·对象 都会被转化为数组，数组每个成员为 ['键', 值]。这样转化而来的数组会被排序，以消除对象属性顺序对哈希的影响。
    原先即为数组的对象之顺序会被保留，除非将 sortArrays 设为 true，此时所有数组都会被排序。
    本函数为深处理。
 */

export function normalize(obj, sortArrays = false) {
    const toSortKey = (value) => {
        const serialized = JSON.stringify(value);
        return serialized === undefined ? String(value) : serialized;
    };

    const canonicalize = (value) => {
        if (Array.isArray(value)) {
            const normalizedArray = value.map((item) => canonicalize(item));
            if (sortArrays) {
                normalizedArray.sort((a, b) => {
                    const aKey = toSortKey(a);
                    const bKey = toSortKey(b);
                    if (aKey < bKey) return -1;
                    if (aKey > bKey) return 1;
                    return 0;
                });
            }
            return normalizedArray;
        }

        if (isPlainObject(value)) {
            return Object.keys(value)
                .sort()
                .map((key) => [key, canonicalize(value[key])]);
        }

        return value;
    };

    return JSON.stringify(canonicalize(obj));
}
