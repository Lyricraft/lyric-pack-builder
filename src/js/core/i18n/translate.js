import {stringUsable} from "../public/type.js";
import {getTranslation, languages} from "./languages.js";

// 急着写，写得乱，不如想好慢慢写。

export function t(key, ...args){
    if (!stringUsable(key)){
        throw new Error(`[i18n] 无效的翻译键名 / Invalid translate key: ${key}`);
    }
    let message = getTranslation(key);
    if (!message){
        throw new Error(`[i18n] 无效的翻译键名 / Invalid translate key: ${key}`);
    }
    message = message.replace(/\$/g, () => {
        if (args.length === 0){
            throw new Error(`[i18n] 键的翻译参数不足 / Missing translate args for key: ${key}`);
        }
        const arg = args.shift();
        if (!stringUsable(arg)){
            throw new Error(`[i18n] 键的翻译参数无效 / Invalid translate args for key: ${key}`);
        }
        return arg;
    })
    if (args.length > 0){
        throw new Error(`[i18n] 键存在未使用的多余参数 / Extra translate args for key: ${key}`);
    }
    return message;
}