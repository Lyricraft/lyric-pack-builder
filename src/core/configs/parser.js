import {
    ConfigFieldInnerError,
    ConfigFieldMissingError,
    ConfigFileInnerError,
    ConfigFileMissingError
} from "./errors.js";
import fs from "node:fs/promises";
import {regularFileExists} from "../public/fileSystem.js";
import {ArgTypeError, FileSystemError} from "../public/errors.js";
import yaml from "yaml";
import path from "path";
import {t} from "../i18n/translate.js";
import {checkEnum} from "../public/type.js";

export function parseInnerObj(obj, parent, field, parseFunc, defaultValue = undefined) {
    if (defaultValue !== undefined && !obj) {
        return defaultValue;
    }
    if (!obj) {
        throw new ConfigFieldMissingError(parent, field);
    }

    let result;
    try {
        result = parseFunc(obj);
    } catch (e) {
        throw new ConfigFieldInnerError(parent, field, e);
    }

    return result;
}

export const ConfigFileFormat = {
    YAML: 'yaml',
    JSON: 'json',
}

export async function parseFileConfig(filePath, options = 'utf-8') {
    if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
        if (await regularFileExists(filePath)) {
            return await parseFileConfigByPath(filePath, ConfigFileFormat.YAML, options);
        } else {
            throw new ConfigFileMissingError(filePath);
        }
    } else if (filePath.endsWith('.json')) {
        if (await regularFileExists(filePath)) {
            return await parseFileConfigByPath(filePath, ConfigFileFormat.JSON, options);
        } else {
            throw new ConfigFileMissingError(filePath);
        }
    } else {
        const ymlPath = path.join(`${filePath}.yml`);
        if (await regularFileExists(ymlPath)) {
            return await parseFileConfigByPath(ymlPath, ConfigFileFormat.YAML, options);
        }
        const yamlPath = path.join(`${filePath}.yaml`);
        if (await regularFileExists(yamlPath)) {
            return await parseFileConfigByPath(yamlPath, ConfigFileFormat.YAML, options);
        }
        const jsonPath = path.join(`${filePath}.json`);
        if (await regularFileExists(jsonPath)) {
            return await parseFileConfigByPath(jsonPath, ConfigFileFormat.JSON, options);
        }
        throw new ConfigFileMissingError(filePath);
    }
}

async function parseFileConfigByPath(filePath, configFileFormat, options = 'utf-8') {
    if (!checkEnum(ConfigFileFormat, configFileFormat)) {
        throw new ArgTypeError('configFileFormat', 'ConfigFileFormat', configFileFormat);
    }
    let file;
    try {
        file = await fs.readFile(filePath, options);
    } catch (e) {
        throw new FileSystemError(t('error.fileSystem.failToReadFileMsg', filePath));
    }
    try {
        if (configFileFormat === ConfigFileFormat.YAML) {
            return yaml.parse(file);
        } else {
            return JSON.parse(file);
        }
    } catch (e) {
        throw new ConfigFileInnerError(filePath, e);
    }
}