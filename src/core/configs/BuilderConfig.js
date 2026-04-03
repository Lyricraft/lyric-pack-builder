import {checkConfigStringType} from "./checker.js";
import {StringType} from "../public/type.js";

export class BuilderConfig {
    constructor(obj) {
        for (const key in obj) {
            this[key] = obj[key];
        }
    }

    static fromObj(obj) {
        const config = {};
    }
}