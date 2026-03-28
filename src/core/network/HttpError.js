import {TypedError} from "../public/errors.js";

export class HttpError extends TypedError {
    static TYPE = 'http';

    constructor(message = 'HTTP Error', status = 400) {
        super(HttpError.TYPE, message);
        this.status = status;
    }
}