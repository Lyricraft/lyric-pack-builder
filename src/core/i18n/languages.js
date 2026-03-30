import fs from "node:fs/promises";
import path from "path";
import {stringUsable} from "../public/type.js";
import {fileURLToPath} from "node:url";

/*
    定义语言时注意：
        正文部分以 $ 作参数占位符。
 */

const mainPath = path.dirname(process.argv[1]); // 入口脚本路径

const defaultLanguage = 'zh_cn';
let language = defaultLanguage;

const defaultLanguageObj = await loadLanguageFromFile(defaultLanguage);
let languageObj = defaultLanguageObj;

try{
    await setLanguage(getSystemLanguage());
} catch(e){
    await setLanguage(defaultLanguage);
}

async function loadLanguageFromFile(lang){
    const filePath = path.join(mainPath, 'lang', `${lang}.json`);
    let file;
    try {
        file = await fs.readFile(filePath, 'utf8');
    } catch (e) {
        throw new Error(`[i18n] 无法加载语言文件 / Cannot load language file: ${filePath}\n${e.message}`);
    }
    let obj;
    try {
        obj = JSON.parse(file);
    } catch (e) {
        throw new Error(`[i18n] 解析语言文件时出现异常 / Cannot parse language file: ${filePath}\n${e.message}`);
    }
    return obj;
}

export async function setLanguage(lang){
    if (!stringUsable(lang)){
        throw new Error(`[i18n] 无效的语言名称 / Invalid language: ${lang}`);
    }
    if (lang === language){
        return;
    }
    if (lang === defaultLanguage) {
        languageObj = defaultLanguageObj;
        language = defaultLanguage;
        return;
    }
    languageObj = await loadLanguageFromFile(lang);
    language = lang;
}

export function getLanguage() {
    return language;
}

export function getTranslation(key){
    if (!stringUsable(key)){
        throw new Error(`[i18n] 无效的翻译键名 / Invalid translate key: ${key}`);
    }
    let translation = languageObj[key];
    if (translation) {
        if (!stringUsable(translation)){
            throw new Error(`[i18n] 语言文件可能已损坏 / Language file may be corrupted: ${language}\n${translation}`);
        }
        return translation;
    }
    translation = defaultLanguageObj[key];
    if (translation) {
        if (!stringUsable(translation)){
            throw new Error(`[i18n] 语言文件可能已损坏 / Language file may be corrupted: ${defaultLanguage}\n${translation}`);
        }
        return translation;
    }
    throw new Error(`[i18n] 无效的翻译键名 / Invalid translate key: ${key}`);
}

function getSystemLanguage() {
    const envLang =
        process.env.LANG ||
        process.env.LC_ALL ||
        process.env.LANGUAGE;

    if (!envLang){
        return defaultLanguage;
    }

    return envLang.split('.')[0];
}