import {StringType, stringUsable} from "../../public/type.js";
import {ArgTypeError} from "../../public/errors.js";
import path from "path";

export class LocalFileSelection {
    constructor(path, wildcard) {
        this.path = path;
        this.wildcard = wildcard;
    }

    static fromString(str) {
        let wildcard = false;
        if (str.endsWith('*')) {
            wildcard = true;
            str = str.replace(/\*$/, '');
        }
        if (!stringUsable(str, StringType.FILE_PATH)) {
            throw new ArgTypeError('path', 'string(FilePathWithWildcard)', str);
        }
        return new LocalFileSelection(str, wildcard);
    }

    suggestedFilename() {
        return path.basename(this.path);
    }
}