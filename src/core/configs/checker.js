import {ConfigEmptyArrayError, ConfigFieldError, ConfigFieldMissingError, ConfigFieldTypeError} from "./errors.js";
import {checkEnum, isNullOrUndefined, StringType, stringUsable} from "../public/type.js";
import {t} from "../i18n/translate.js";

/*
    注意：在必选（即默认值不可用）时，请在 defaultValue 参数使用 undefined 而非 null。null 表示默认值为 null！
 */
export function checkConfigArray(array, parent, field, defaultValue = undefined,
                                 type = "", checkFunc = null, allowEmpty = false) {
    if (defaultValue !== undefined && isNullOrUndefined(array)) {
        return defaultValue;
    }
    if (!array) {
        throw new ConfigFieldMissingError(parent, field);
    }
    if (!Array.isArray(array)) {
        throw new ConfigFieldTypeError(parent, field, `${type}[]`, array);
    }
    if (!allowEmpty && array.length === 0) {
        throw new ConfigEmptyArrayError(parent, field);
    }
    if (checkFunc) {
        for (const item of array) {
            if (!checkFunc(item)) {
                throw new ConfigFieldTypeError(parent, `${field}[*]`, type, item);
            }
        }
    }
    return array;
}

export function checkConfigField(obj, parent, field, type, checkFunc,
                                 defaultValue = undefined) {
    if (defaultValue !== undefined && isNullOrUndefined(obj)) {
        return defaultValue;
    }
    if (!obj) {
        throw new ConfigFieldMissingError(parent, field);
    }
    if (!checkFunc(obj)) {
        throw new ConfigFieldTypeError(parent, field, type, obj);
    }
    return obj;
}

export function checkConfigEnum(str, parent, field, type, enumType,
                                defaultValue = undefined) {
    return checkConfigField(str, parent, field, `string(${type})`, (obj) => checkEnum(enumType, obj), defaultValue);
}

export function checkConfigStringType(str, parent, field, defaultValue = undefined,
                                      type = "", stringType = StringType.STRING) {
    return checkConfigField(str, parent, field, `string${stringUsable(type) ? `(${type})` : ""}`,
        (obj) => stringUsable(obj, stringType), defaultValue);
}

export function checkConfigStringChars(str, parent, field, stringType, defaultValue = undefined) {
    if (defaultValue !== undefined && isNullOrUndefined(str)) {
        return defaultValue;
    }
    if (!str) {
        throw new ConfigFieldMissingError(parent, field);
    }
    if (!stringUsable(str, stringType)) {
        throw new ConfigFieldError(parent, field, t('error.configs.illegalCharacters', parent, field, str));
    }
    return str;
}

export function checkConfigInt(num, parent, field, defaultValue = undefined, min = null, max = null) {
    if (defaultValue !== undefined && isNullOrUndefined(num)) {
        return defaultValue;
    }
    if (!Number.isInteger(num)) {
        throw new ConfigFieldTypeError(parent, field, 'int', num);
    }
    if ((!isNullOrUndefined(min) && num < min) || (!isNullOrUndefined(max) && num > max)) {
        throw new ConfigFieldError(parent, field, t('error.configs.outOfRange', parent, field,
            `${isNullOrUndefined(min) ? '(' : `[${min}`},${isNullOrUndefined(max) ? ')' : `${max}}`}`));
    }
    return num;
}