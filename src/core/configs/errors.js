import {TypedError} from "../public/errors.js";
import {t} from "../i18n/translate.js";

export const ConfigErrorSubType = {
    FILE: "file",
    FIELD: "field",
}

export class ConfigError extends TypedError {
    static TYPE = 'config';

    constructor(message, subType, filePath = "", fieldPath = "") {
        super(ConfigError.TYPE, message);
        this.subType = subType;
        this.filePath = filePath;
        this.fieldPath = fieldPath;
    }
}

export class ConfigFieldMissingError extends  ConfigError {
    constructor(file, field) {
        super(ConfigErrorSubType.FIELD, t('error.configs.fieldMissing', file, field), file, field);
    }
}

export class ConfigFieldTypeError extends ConfigError {
    constructor(file, field, type, value) {
        super(ConfigErrorSubType.FIELD, t('error.configs.fieldType', file, field, type, value), file, field);
    }
}

export class ConfigEmptyArrayError extends ConfigError {
    constructor(file, field) {
        super(ConfigErrorSubType.FIELD, t('error.configs.emptyArray', file, field), file, field);
    }
}

export class ConfigFieldError extends ConfigError {
    constructor(file, field, msg) {
        super(ConfigErrorSubType.FIELD, t('error.configs.fieldMsg', file, field, msg), file, field);
    }
}