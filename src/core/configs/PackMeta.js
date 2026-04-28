import {checkEnum, StringType, stringUsable} from "../public/type.js";
import {ConfigFieldTypeError} from "./errors.js";
import {VersionStage} from "../mc/mcMods.js";
import {checkConfigEnum, checkConfigStringType} from "./checker.js";

export class PackMeta {
    constructor(id, name, version, extra = {}) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.extra = extra;
    }

    static fromObj(obj) {
        checkConfigStringType(obj.id, 'Meta', 'id', undefined, 'FileName', StringType.FILE_NAME);

        checkConfigStringType(obj.name, 'Meta', 'name');

        checkConfigStringType(obj.version, 'Meta', 'version');

        const extra = {};

        extra.versionStage = checkConfigEnum(obj.versionStage, 'Meta', 'versionStage', 'VersionStage', VersionStage);

        extra.author = checkConfigStringType(obj.author, 'Meta', 'author', undefined, "", StringType.STRING);

        extra.description = checkConfigStringType(obj.description, 'Meta', 'description', undefined, "", StringType.STRING);

        return new PackMeta(obj.id, obj.name, obj.version, extra);
    }
}