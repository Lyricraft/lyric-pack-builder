import {checkConfigArray, checkConfigEnum} from "../checker.js";
import {AutoVersionSelection, DEFAULT_AUTO_VERSION_SELECTION} from "../objects/VersionSelection.js";

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
            checkConfigEnum(obj.autoVersionChoice, 'Strategy', 'autoVersionChoice', 'AutoVersionChoice', AutoVersionSelection, DEFAULT_AUTO_VERSION_SELECTION);

        return new BuildStrategy(options);
    }
}