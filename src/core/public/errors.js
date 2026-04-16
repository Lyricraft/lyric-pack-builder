
export class TypedError extends Error {
    constructor(type, message = type, obj = {}) {
        super(message);
        this.type = type;
        // ↓尽量避免使用
        for (const key in obj) {
            if (key === 'type') {
                continue;
            }
            this[key] = obj[key];
        }
    }
}

export class ArgsError extends TypedError {
    static TYPE = 'args';

    constructor(message = 'Args Error') {
        super(ArgsError.TYPE, message);
    }
}

export class ArgTypeError extends TypedError {
    static TYPE = 'argType';

    constructor(argName, expectedType, actualValue) {
        super(ArgsError.TYPE, `arg '${argName}' is expected to be ${expectedType}, got ${actualValue}`);
        this.argName = argName;
        this.expectedType = expectedType;
        this.actualValue = actualValue;
    }
}

export class FileSystemError extends TypedError {
    static TYPE = 'fileSystem';

    constructor(message, path) {
        super(FileSystemError.TYPE, message);
        this.path = path;
    }
}