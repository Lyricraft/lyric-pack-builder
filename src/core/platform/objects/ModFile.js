import {checkEnum} from "../../public/type.js";
import {ArgsError} from "../../public/errors.js";

export const ModFileHashType = {
    SHA1 : 'sha1',
    SHA256: 'sha256',
    SHA512: 'sha512',
    MD5: 'md5',
}

export class ModFile {
    constructor(id, url, name, size) {
        this.id = id;
        this.url = url;
        this.name = name;
        this.size = size;
        this.hashes = {};
    }

    setHash(hashType, value) {
        if (!checkEnum(ModFileHashType, hashType)) {
            throw new ArgsError('invalid hashType');
        }
        this.hashes[hashType] = value;
        return this;
    }
}