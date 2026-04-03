import {ConfigEmptyArrayError, ConfigFieldError, ConfigFieldMissingError, ConfigFieldTypeError} from "./errors.js";
import {checkEnum, isNullOrUndefined, StringType, stringUsable} from "../public/type.js";
import {t} from "../i18n/translate.js";

export function checkConfigArray(array, parent, field, type, checkFunc = null, allowEmpty = false, optional = false) {
    if (optional && !array) {
        return null;
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

export function checkConfigField(obj, parent, field, type, checkFunc, optional = false, defaultValue = null) {
    if (optional && !obj) {
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

export function checkConfigEnum(str, parent, field, type, enumType, optional = false) {
    return checkConfigField(str, parent, field, `string(${type})`, (obj) => checkEnum(enumType, obj), optional);
}

export function checkConfigStringType(str, parent, field, type = "", stringType = StringType.STRING, optional = false) {
    return checkConfigField(str, parent, field, `string${stringUsable(type) ? `(${type})` : ""}`,
        (obj) => stringUsable(obj, stringType), optional);
}

export function checkConfigStringChars(str, parent, field, stringType, optional = false) {
    if (optional && !str) {
        return null;
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
    if (defaultValue && isNullOrUndefined(num)) {
        return null;
    }
    if (!Number.isInteger(num)) {
        throw new ConfigFieldTypeError(parent, field, 'int', num);
    }
    if ((!isNullOrUndefined(min) && num < min) || (!isNullOrUndefined(max) && num > max)) {
        throw new ConfigFieldError(parent, field, t('error.configs.outOfRange', parent, field,
            `${isNullOrUndefined(min) ? '(' : `[${min}`},${isNullOrUndefined(max) ? ')' : `${max}}`}`));
    }
}