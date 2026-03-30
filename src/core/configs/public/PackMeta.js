import {checkEnum, StringType, stringUsable} from "../../public/type.js";
import {ConfigFieldTypeError} from "../errors.js";
import {VersionStage} from "../../mc/mcMods.js";
import {checkConfigEnum, checkConfigString} from "../checker.js";

export class PackMeta {
    constructor(id, name, version, extra = {}) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.extra = extra;
    }

    static fromObj(obj) {
        checkConfigString(obj.id, 'pack', 'id', 'FileName', StringType.FILE_NAME);

        checkConfigString(obj.name, 'pack', 'name');

        checkConfigString(obj.version, 'pack', 'version');

        const extra = {};

        checkConfigEnum(obj.versionStage, 'pack', 'versionStage', 'VersionStage', VersionStage, true);
        extra.versionStage = obj.versionStage;

        checkConfigString(obj.author, 'pack', 'author', "", StringType.STRING, true);
        extra.author = obj.author;

        checkConfigString(obj.description, 'pack', 'description', "", StringType.STRING, true);
        extra.description = obj.description;

        return new PackMeta(obj.id, obj.name, obj.version, extra);
    }
}