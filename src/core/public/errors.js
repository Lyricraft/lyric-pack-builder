
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