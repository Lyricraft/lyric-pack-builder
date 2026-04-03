import {ConfigEmptyArrayError, ConfigFieldError, ConfigFieldTypeError} from "../errors.js";
import {VersionRange} from "../../objects/versions.js";
import {t} from "../../i18n/translate.js";
import {checkConfigArray} from "../checker.js";
import {checkEnum} from "../../public/type.js";
import {ModLoader, PackFormat} from "../../mc/mcMods.js";

export class PackTarget {
    constructor(mcVersions, loaders, formats) {
        this.mcVersions = mcVersions; // McVersion[]
        this.loaders = loaders; // ModLoader[]
        this.formats = formats; // PackFormat[]
    }

    static fromObj(obj, versionsList) {
        // Minecraft 版本
        if (!Array.isArray(obj.mcVersions)) {
            throw new ConfigFieldTypeError('Target', 'mcVersions', 'string(VersionRange)[]', obj.mcVersions);
        }
        const versionRanges = [];
        const mcVersions = [];
        for (const versionRange of obj.mcVersions) {
            try {
                versionRanges.push(VersionRange.fromString(versionRange));
            } catch (e) {
                throw new ConfigFieldTypeError('Target', 'mcVersions[*]', 'string(VersionRange)', obj.mcVersions, e);
            }
            this.mcVersions = [...new Set([...this.mcVersions, ...versionRange.getAllInRange(versionsList)])];
        }
        if (versionRanges.length === 0) {
            throw new ConfigEmptyArrayError('Target', 'mcVersions');
        }
        if (this.mcVersions.length === 0) {
            throw new ConfigFieldError('Target', 'mcVersions', t('error.configs.noVersionInRange'));
        }

        // 加载器
        checkConfigArray(obj.loaders, 'Target', 'loaders', undefined, 'string(ModLoader)',
            (item) => checkEnum(ModLoader, item), false);

        // 整合包格式
        checkConfigArray(obj.formats, 'Target', 'formats', undefined, 'string(PackFormat)',
            (item) => checkEnum(PackFormat, item), false);

        return new PackTarget(mcVersions, obj.loaders, obj.formats);
    }
}