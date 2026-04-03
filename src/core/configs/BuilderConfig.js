import {checkConfigInt, checkConfigStringType, optionalConfigField} from "./checker.js";
import {StringType} from "../public/type.js";

export class BuilderConfig {
    constructor(obj) {
        for (const key in obj) {
            this[key] = obj[key];
        }
    }

    static fromObj(obj) {
        const config = {};
        config.modrinthRequestInterval
            = checkConfigInt(obj.modrinthRequestInterval, 'builder.yml', 'modrinthRequestInterval',
            1000, 0, 60*1000);
        config.curseforgeRequestInterval
            = checkConfigInt(obj.curseforgeRequestInterval, 'builder.yml', 'curseforgeRequestInterval',
            1000, 0, 60*1000);
    }
}