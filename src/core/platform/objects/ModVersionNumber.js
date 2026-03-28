import {checkEnum} from "../../public/type.js";
import {ModLoader, VersionStage, VersionStageName} from "../../mc/mcMods.js";
import {Version, VERSION_PATTERN, VersionRange} from "../../objects/version.js";
import {ModVersion} from "./ModVersion.js";

/*
    观察数个样本发现，Modrinth上模组 versionNumber 的格式很不统一。其大体上还是有一定规律，但并不能保证稳定。
    此类尽量分析 ModVersionNumber 的构成，如果未能解析，则 version 为 null。仍可访问 text 获取原始字符串。

    在混沌未定的宇宙中寻找平稳的轨迹，那就是科学之理；
    在浮沉飘摇的人生中寻找安定的一隅，那便是家与归处。
 */

export class ModVersionNumber {

    constructor(text, version = null) {
        this.text = text;
        this.version = version; // Version
    }

    static parseString(str) {
        const segments = str.trim().split(/[-+_ ]+/);
        let version = null;
        let versionFound = false;
        for (const segment of segments) {
            if (VERSION_PATTERN.test(segment)) {
                let maybeVersion;
                try {
                    maybeVersion = Version.fromString(segment);
                } catch (e) {
                    continue;
                }
                if (versionFound) {
                    // 找到了第二个版本，这下好了，咱没法判断哪一个是真版本了。姑且当作没解析出来罢。
                    version = null;
                    continue;
                }
                version = maybeVersion;
                versionFound = true;
            }
        }
        return new ModVersionNumber(str, version);
    }

}