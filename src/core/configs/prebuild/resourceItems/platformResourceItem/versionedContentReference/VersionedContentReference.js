import {parseInnerObj} from "../../../../parser.js";
import {VersionSelection} from "../../../../objects/VersionSelection.js";
import {ConfigError} from "../../../../errors.js";
import {t} from "../../../../../i18n/translate.js";
import {ArgTypeError} from "../../../../../public/errors.js";

export const VersionedContentReferenceTypes = new Map();

export class VersionedContentReference {

    constructor(obj) {
        this.contentReference = parseInnerObj(obj.link, "", 'link',
            (str) => this.parseContentReference(str), null);

        this.versionSelection = parseInnerObj(obj, "", '.',
            (obj2) => VersionSelection.fromObj(obj2,
                this.parseVersionReference));

        // 检查是否需要 contentReference 而没有
        if (this.versionSelection.versions) {
            for (const version of this.versionSelection.versions) {
                if (version.version.requireContentReference() && !version.version.content) {
                    throw new ConfigError(t('error.configs.platformResourceVersionReferenceLacksContent',
                        JSON.stringify(version.version)));
                }
            }
        }
    }

    parseContentReference(str) {
        // to be overridden
    }

    parseVersionReference(str) {
        // to be overridden
    }

    static from (platform, obj) {

        const parser = VersionedContentReferenceTypes.get(platform);

        if (!parser) {
            throw new ArgTypeError('platform', 'PubPlatform', platform);
        }

        return(parser(obj));
    }
}