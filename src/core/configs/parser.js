import {
    ConfigFieldInnerError,
    ConfigFieldMissingError,
    ConfigFileInnerError,
    ConfigFileMissingError
} from "./errors.js";
import fs from "node:fs/promises";
import {regularFileExists} from "../public/fileSystem.js";
import {FileSystemError} from "../public/errors.js";
import yaml from "yaml";
import path from "path";

export function parseInnerObj(obj, parent, field, parseFunc, optional = false) {
    if (optional && !obj) {
        return null;
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

export async function parseFileYaml(filePath, options = 'utf-8') {
    if (path.extname(filePath) === '.yaml' || path.extname(filePath) === '.yml') {
        if (await regularFileExists(filePath)) {
            return await parseFileYamlByPath(filePath, options);
        } else {
            throw new ConfigFileMissingError(filePath);
        }
    } else {
        const ymlPath = path.resolve(`${filePath}.yml`);
        if (await regularFileExists(ymlPath)) {
            return await parseFileYamlByPath(ymlPath, options);
        }
        const yamlPath = path.resolve(`${filePath}.yaml`);
        if (await regularFileExists(yamlPath)) {
            return await parseFileYamlByPath(yamlPath, options);
        }
        throw new ConfigFileMissingError(filePath);
    }
}

async function parseFileYamlByPath(filePath, options = 'utf-8') {
    let file;
    try {
        file = await fs.readFile(filePath, options);
    } catch (e) {
        throw new FileSystemError(t('error.fileSystem.failToReadFileMsg', filePath));
    }
    try {
        return yaml.parse(file);
    } catch (e) {
        throw new ConfigFileInnerError(filePath, e);
    }
}