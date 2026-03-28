import {ArgsError} from "./errors.js";

export function padZero(arg, length) {
    const str = String(arg);
    if (str.length > length)
        throw new ArgsError();
    return '0'.repeat(length - str.length) + str;
}