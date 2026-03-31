import {TypedError} from "../public/errors.js";
import {t} from "../i18n/translate.js";
import {stringUsable} from "../public/type.js";

export class ConfigError extends TypedError {
    static TYPE = 'config';

    constructor(message, field = "", file = "") {
        super(ConfigError.TYPE, message);
        this.field= field;
        this.file = file;
    }
}

export class ConfigFileMissingError extends ConfigError {
    constructor(file) {
        super(t('error.configs.fileMissing', file), file);
    }
}

export class ConfigFileInnerError extends ConfigError {
    constructor(file, e) {
        super(t('error.configs.fileInnerMsg', file, e.message), e.fieldPath, file);
    }
}

export class ConfigFieldInnerError extends ConfigError {
    constructor(parent, field, e) {
        super(t('error.configs.fieldInnerMsg', parent, field, e.message), `${field}.${e.field}`);
    }
}

export class ConfigFieldMissingError extends  ConfigError {
    constructor(parent, field) {
        super(t('error.configs.fieldMissing', parent, field), field);
    }
}

export class ConfigFieldTypeError extends ConfigError {
    constructor(parent, field, type, value) {
        super(t('error.configs.fieldType', parent, field, type, value), field);
    }
}

export class ConfigEmptyArrayError extends ConfigError {
    constructor(parent, field) {
        super(t('error.configs.emptyArray', parent, field), field);
    }
}

export class ConfigFieldError extends ConfigError {
    constructor(parent, field, msg) {
        super(t('error.configs.fieldMsg', parent, field, msg), field);
    }
}