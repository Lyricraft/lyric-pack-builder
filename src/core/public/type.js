export const StringType = {
    STRING: 'string',
    FILE_NAME: 'fileName',
    PATH: 'path',
    FILE_PATH: 'filePath',
}
export function stringUsable(str, type = StringType.STRING) {
    if (typeof str !== 'string' || str.length < 1) {
        return false;
    }
    if (type === StringType.STRING) {
        return true;
    }
    if (type === StringType.FILE_NAME) {
        return !/[\/\\:*?"<>|]/.test(str);
    }
    if (type === StringType.PATH) {
        return !/[\\/:<>|"?*]|\/\//.test(str);
    }
    if (type === StringType.FILE_PATH) {
        return !/[\\:*?"<>|]|[\/\\]$/.test(str);
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

    for (const key of Object.keys(active)) {
        const activeValue = active[key];
        const templateValue = template[key];

        if (isPlainObject(activeValue) && isPlainObject(templateValue)) {
            deepMerge(templateValue, activeValue);
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

export class BiMap {
    constructor() {
        this.forward = new Map(); // key → value
        this.backward = new Map(); // value → key
    }

    // 设置键值对（值重复时覆盖旧键）
    set(key, value) {
        // 先删除旧值关联
        if (this.backward.has(value)) {
            this.forward.delete(this.backward.get(value));
        }
        this.forward.set(key, value);
        this.backward.set(value, key);
        return this;
    }

    // 正向查找：key → value
    get(key) {
        return this.forward.get(key);
    }

    // 反向查找：value → key
    getKey(value) {
        return this.backward.get(value);
    }

    // 删除键
    delete(key) {
        const value = this.forward.get(key);
        if (value !== undefined) {
            this.forward.delete(key);
            this.backward.delete(value);
            return true;
        }
        return false;
    }

    // 删除值
    deleteValue(value) {
        const key = this.backward.get(value);
        if (key !== undefined) {
            this.backward.delete(value);
            this.forward.delete(key);
            return true;
        }
        return false;
    }

    has(key) {
        return this.forward.has(key);
    }

    hasValue(value) {
        return this.backward.has(value);
    }

    clear() {
        this.forward.clear();
        this.backward.clear();
    }

    get size() {
        return this.forward.size;
    }
}
