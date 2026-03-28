
export class TypedError extends Error {
    constructor(type, message = type, obj = {}) {
        super(message);
        this.type = type;
        this.obj = obj;
    }
}

export class ArgsError extends TypedError {
    static TYPE = 'args';

    constructor(message = 'Args Error') {
        super(ArgsError.TYPE, message);
    }
}