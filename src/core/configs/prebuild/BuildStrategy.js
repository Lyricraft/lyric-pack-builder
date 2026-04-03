import {checkConfigArray, checkConfigEnum} from "../checker.js";
import {AutoVersionChoice, DEFAULT_AUTO_VERSION_CHOICE} from "../objects/VersionChoice.js";

export const DependencyStrategy = {
    SKIP: 'skip',
    FIX: 'fix',
    WARN: 'warn',
    STOP: 'stop',
}

export class BuildStrategy {
    constructor(options) {
        for (const key in options) {
            this[key] = options[key];
        }
    }

    static fromObj(obj) {
        const options = {};

        options.dependencies =
            checkConfigEnum(obj.dependencies, 'Strategy', 'dependencies', 'DependencyStrategy', DependencyStrategy)

        options.autoVersionChoice =
            checkConfigEnum(obj.autoVersionChoice, 'Strategy', 'autoVersionChoice', 'AutoVersionChoice', AutoVersionChoice, DEFAULT_AUTO_VERSION_CHOICE);

        return new BuildStrategy(options);
    }
}