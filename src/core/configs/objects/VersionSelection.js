import {checkConfigEnum, checkConfigStringType} from "../checker.js";
import {ConfigFieldError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {stringUsable} from "../../public/type.js";
import {Condition} from "./conditions.js";
import {parseInnerObj} from "../parser.js";

export const AutoVersionSelection = {
    LATEST: 'latest',
    STABLE: 'stable',
    STABLE_REQUIRED: 'stableRequired',
    MOST_STABLE: 'mostStable',
    STATIC: 'static',
}

export const DEFAULT_AUTO_VERSION_SELECTION = AutoVersionSelection.LATEST;

export class VersionSelection {
    constructor(versions, selection) {
        this.versions = versions;
        this.selection = selection;
    }

    static fromObj(obj, versionParserFunc = (str) => str, defaultSelection = DEFAULT_AUTO_VERSION_SELECTION) {
        const selection = checkConfigEnum(obj.selection, "VersionSelection", 'selection', 'string(AutoVersionSelection)', AutoVersionSelection, defaultSelection);

        if (obj.selection === AutoVersionSelection.STATIC && !obj.version) {
            throw new ConfigFieldError("VersionSelection", 'version', t('error.configs.selectionMissingWithStaticSelection'));
        }

        let versions;
        if (obj.version) {
            versions = [];
            for (const key in obj.version) {
                checkConfigStringType(key, "VersionSelection", 'version#key');

                if (!obj.version[key] || !stringUsable(obj.version[key])) {
                    throw new ConfigFieldError("VersionSelection", 'version#value', t('error.configs.invalidVersionCondition', obj.version[key]));
                }

                let condition;
                try {
                    condition = Condition.fromString(obj.version[key]);
                } catch (e) {
                    throw new ConfigFieldError("VersionSelection", 'version#value', t('error.configs.invalidVersionConditionMsg', e.message));
                }

                versions.push({
                    version: parseInnerObj(key, 'VersionSelection', 'version#key', versionParserFunc),
                    condition,
                })
            }
        }

        return new VersionSelection(versions, selection);
    }
}