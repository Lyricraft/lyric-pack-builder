import {ConfigEmptyArrayError, ConfigFieldMissingError, ConfigFieldTypeError} from "./errors.js";
import {checkEnum, StringType, stringUsable} from "../public/type.js";

export function checkConfigArray(array, file, field, type, checkFunc, allowEmpty = false, optional = false) {
    if (optional && !array) {
        return null;
    }
    if (!array) {
        throw new ConfigFieldMissingError(file, field);
    }
    if (!Array.isArray(array)) {
        throw new ConfigFieldTypeError(file, field, `${type}[]`, array);
    }
    if (!allowEmpty && array.length === 0) {
        throw new ConfigEmptyArrayError(file, field);
    }
    for (const item of array) {
        if (!checkFunc(item)) {
            throw new ConfigFieldTypeError(file, `${field}[*]`, type, item);
        }
    }
    return array;
}

export function checkConfigField(obj, file, field, type, checkFunc, optional = false) {
    if (optional && !obj) {
        return null;
    }
    if (!obj) {
        throw new ConfigFieldMissingError(file, field);
    }
    if (!checkFunc(obj)) {
        throw new ConfigFieldTypeError(file, field, type, obj);
    }
    return obj;
}

export function checkConfigEnum(str, file, field, type, enumType, optional = false) {
    return checkConfigField(str, file, field, `string(${type})`, (obj) => checkEnum(enumType, obj), optional);
}

export function checkConfigString(str, file, field, type = "", stringType = StringType.STRING, optional = false) {
    return checkConfigField(str, file, field, `string${stringUsable(type) ? `(${type})` : ""}`,
        (obj) => stringUsable(obj, stringType), optional);
}