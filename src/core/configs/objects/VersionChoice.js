import {checkConfigEnum, checkConfigString} from "../checker.js";
import {ConfigFieldError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {stringUsable} from "../../public/type.js";
import {Condition} from "./conditions.js";

export const AutoVersionChoice = {
    LATEST: 'latest',
    STABLE: 'stable',
    STABLE_REQUIRED: 'stableRequired',
    MOST_STABLE: 'mostStable',
    STATIC: 'static',
}

export class VersionChoice {
    constructor(version, choice) {
        this.version = version;
        this.choice = choice;
    }

    static fromObj(obj, defaultChoice = AutoVersionChoice.LATEST) {
        checkConfigEnum(obj.choice, "", 'choice', 'string(AutoVersionChoice)', AutoVersionChoice, true);
        if (!obj.choice) {
            obj.choice = defaultChoice;
        }

        if (obj.choice === AutoVersionChoice.STATIC && !obj.version) {
            throw new ConfigFieldError("", 'version', t('error.configs.choiceMissingWithStaticChoice'));
        }

        let version;
        if (obj.version) {
            version = {};
            for (const key in obj.version) {
                checkConfigString(key, "", 'version#key');

                if (!obj.version[key] || typeof obj.version[key] !== 'object') {
                    throw new ConfigFieldError("", 'version#value', t('error.configs.invalidVersionCondition', obj.version[key]));
                }

                let condition;
                try {
                    condition = Condition.from(obj.version[key]);
                } catch (e) {
                    throw new ConfigFieldError("", 'version#value', t('error.configs.invalidVersionConditionMsg', e.message));
                }

                version[key] = condition;
            }
        }

        return new VersionChoice(version, obj.choice);
    }
}