import {checkConfigArray, checkConfigEnum} from "../checker.js";

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

        checkConfigEnum(obj.dependencies, 'strategy', 'dependencies', 'DependencyStrategy', DependencyStrategy)
        options.dependencies = obj.dependencies;

        return new BuildStrategy(options);
    }
}