import {checkEnum, StringType, stringUsable} from "../../public/type.js";
import {ConfigFieldTypeError} from "../errors.js";
import {VersionStage} from "../../mc/mcMods.js";
import {checkConfigEnum, checkConfigStringType} from "../checker.js";

export class PackMeta {
    constructor(id, name, version, extra = {}) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.extra = extra;
    }

    static fromObj(obj) {
        checkConfigStringType(obj.id, 'Meta', 'id', 'FileName', StringType.FILE_NAME);

        checkConfigStringType(obj.name, 'Meta', 'name');

        checkConfigStringType(obj.version, 'Meta', 'version');

        const extra = {};

        checkConfigEnum(obj.versionStage, 'Meta', 'versionStage', 'VersionStage', VersionStage, true);
        extra.versionStage = obj.versionStage;

        checkConfigStringType(obj.author, 'Meta', 'author', "", StringType.STRING, true);
        extra.author = obj.author;

        checkConfigStringType(obj.description, 'Meta', 'description', "", StringType.STRING, true);
        extra.description = obj.description;

        return new PackMeta(obj.id, obj.name, obj.version, extra);
    }
}