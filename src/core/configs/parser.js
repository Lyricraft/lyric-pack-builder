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

export async function parseFileYaml(path, options = 'utf-8') {
    if (!await regularFileExists(path)) {
        throw new ConfigFileMissingError(path);
    }
    let file;
    try {
        file = await fs.readFile(path, options);
    } catch (e) {
        throw new FileSystemError(t('error.fileSystem.failToReadFileMsg', path));
    }
    try {
        return yaml.parse(file);
    } catch (e) {
        throw new ConfigFileInnerError(path, e);
    }
}