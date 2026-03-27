
export class TypedError extends Error {
    constructor(message, type, obj = {}) {
        super(message);
        this.type = type;
        this.obj = obj;
    }
}