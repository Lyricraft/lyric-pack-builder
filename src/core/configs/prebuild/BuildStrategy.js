import {checkConfigArray, checkConfigEnum} from "../checker.js";
import {AutoVersionChoice, DEFAULT_AUTO_VERSION_CHOICE} from "../objects/VersionChoice.js";

export const DependencyStrategy = {
    SKIP: 'skip',
    FIX: 'fix',
    WARN: 'warn',
    STOP: 'stop',
}

const STRATEGY = 'strategy';

export class BuildStrategy {
    constructor(options) {
        for (const key in options) {
            this[key] = options[key];
        }
    }

    static fromObj(obj) {
        const options = {};

        checkConfigEnum(obj.dependencies, STRATEGY, 'dependencies', 'DependencyStrategy', DependencyStrategy)
        options.dependencies = obj.dependencies;

        checkConfigEnum(obj.autoVersionChoice, STRATEGY, 'autoVersionChoice', 'AutoVersionChoice', AutoVersionChoice, true);
        options.autoVersionChoice = obj.autoVersionChoice??DEFAULT_AUTO_VERSION_CHOICE;

        return new BuildStrategy(options);
    }
}