import {ConfigEmptyArrayError, ConfigFieldTypeError} from "./errors.js";
import {checkEnum} from "../public/type.js";

export function checkConfigArray(array, file, field, type, checkFunc, allowEmpty = false) {
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
    return true;
}

export function checkConfigEnum(str, file, field, type, enumType) {
    if (!checkEnum(enumType, str)) {
        throw new ConfigFieldTypeError(file, field, `string(${type})`, str);
    }
    return true;
}