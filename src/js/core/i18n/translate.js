import {stringUsable} from "../public/type.js";
import {languages} from "./languages.js";

const defaultLanguage = 'zh_cn';

// 急着写，写得乱，不如想好慢慢写。

export function t(key, ...args){
    let lang = process.env.LANG;
    if (!stringUsable(lang)){
        lang = defaultLanguage;
    }
    if (!languages.has(lang)){
        throw new Error(`[i18n] 不支持的语言 / Invalid language: ${lang}`);
    }
    return translate(key, lang, ...args);
}

function translate(key, lang, ...args){
    if (!stringUsable(key)){
        throw new Error(translate('error.translate.invalidKey', lang, key));
    }
    let message = languages.get(lang)[key];
    if (!message){
        // 没有找到这个键
        if (lang === defaultLanguage){
            throw new Error(`[i18n] 无效的翻译键名 / Invalid translate key: ${lang}`);
        }
        return translate(key, defaultLanguage, ...args);
    }
    message = message.replace(/\$/g, () => {
        if (args.length === 0){
            throw new Error(translate('error.translate.missingArgs', lang, key));
        }
        const arg = args.shift();
        if (!stringUsable(arg)){
            throw new Error(translate('error.translate.invalidArgs', lang, key));
        }
        return arg;
    })
    if (args.length > 0){
        throw new Error(translate('error.translate.extraArgs', lang, key));
    }
    return message;
}

function getSystemLanguage() {
    const envLang =
        process.env.LANG ||
        process.env.LC_ALL ||
        process.env.LANGUAGE;

    if (!envLang){
        return defaultLanguage;
    }

    const lang = envLang.split('.')[0];

    return lang;
}

function setLanguage(lang){
    process.env.LANG = lang;
}

function getLanguage(){
    return process.env.LANG || defaultLanguage;
}