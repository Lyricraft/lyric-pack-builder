import {checkEnum} from "../../public/type.js";
import {ModLoader, VersionStage, VersionStageName} from "../../mc/mcMods.js";
import {Version, VERSION_PATTERN, VersionRange} from "../../objects/version.js";

/*
    观察数个样本发现，Modrinth上模组 versionNumber 的格式很不统一。其大体上还是有一定规律，但并不能保证稳定。
    此类通过 parse，尽量分析 ModVersionNumber 的构成。只是分析使用，不要用作存储等需求稳定、统一的地方。

    在混沌未定的宇宙中寻找平稳的轨迹，那就是科学之理；
    在浮沉飘摇的人生中寻找安定的一隅，那便是家与归处。
 */

export class ModVersionNumber {
    parse(str){
        this.text = str;
        this.segments = str.trim().split(/[-+]+/);
        this.version = null; // Version
        this.versionStage = null; // VersionStage
        this.mcVersion = null; // Version
        this.loader = ""; //ModLoader
        let versionFound = false;
        for (const segment of this.segments){
            if (checkEnum(ModLoader, segment)){
                this.loader = segment;
                continue;
            }
            if (checkEnum(VersionStageName, segment)){
                this.versionStage = new VersionStage(segment);
                continue;
            }
            if (segment.startsWith("mc")){
                 try {
                     this.mcVersion = Version.fromString(segment.replace(/^mc/, ''));
                 } catch(e) {}
                continue;
            }
            if (VERSION_PATTERN.test(segment)){
                let maybeVersion;
                try {
                    maybeVersion = Version.fromString(segment);
                } catch(e) {
                    continue;
                }
                if (versionFound) {
                    // 找到了第二个版本，这下好了，咱没法判断哪一个是真版本了。姑且当作没解析出来罢。
                    this.version = null;
                    continue;
                }
                this.version = maybeVersion;
                versionFound = true;
            }
        }
    }
}

export const CANNOT_PARSE_VERSION_NUMBER_ERROR = 'cannotParseVersionNumber';