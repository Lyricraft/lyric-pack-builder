import {Version, VERSION_PATTERN} from "../objects/version.js";
import {padZero} from "../public/string.js";
import {stringUsable} from "../public/type.js";
import {ArgsError} from "../public/errors.js";
import {t} from "../i18n/translate.js";

/*
    由于 Modrinth 等资源平台上存在着提供给非正式版的资源，为保证 MC 版本号能正确解析，用这些类来存储和处理平台上获取的 MC 版本。
    而由于 LPB 只支持面向正式版 MC 制作整合包，内部提到 MC 版本时只用 Version 即可。要注意转换。
 */

export const McVersionStage = {
    RELEASE: 'release',
    RC: 'rc',
    PRE_RELEASE: 'preRelease',
    SNAPSHOT: 'snapshot',
}

export class McVersion {
    constructor(stage, common = false) {
        this.stage = stage; // McVersionStage
        this.common = common;
        this.version = null;
    }

    isRelease() {
        return (this.stage === McVersionStage.RELEASE);
    }

    versionIsEmpty() {
        return !this.version;
    }

    getVersion() {
        return this.version ?? null;
    }

    isCommon() {
        return this.common;
    }

    toString() {
        return "";
    }

    static parseString(str) {
        if (VERSION_PATTERN.test(str)) {
            return new ReleaseMcVersion(Version.fromString(str));
        }
        let stage = "";
        if (/rc/i.test(str)) {
            stage = McVersionStage.RC;
        }
        if (/pre/i.test(str)) {
            stage = McVersionStage.PRE_RELEASE;
        }
        if (/snapshot/i.test(str)) {
            stage = McVersionStage.SNAPSHOT;
        }
        if (stringUsable(stage)) {
            const segments = str.split('-');
            let version, subNum;
            for (const segment of segments) {
                if (segment.includes('.') && VERSION_PATTERN.test(segment)) {
                    version = Version.fromString(segment);
                    continue;
                }
                if (/^(rc|pre|snapshot)/i.test(segment)) {
                    const maybeSub = segment.replace(/^(rc|pre|snapshot)/i, "");
                    if (stringUsable(maybeSub) && /^\d+$/.test(maybeSub)) {
                        subNum = parseInt(maybeSub);
                    }
                }
                if (/^\d+$/.test(segment)) {
                    subNum = segment;
                }
            }
            if (!version || !subNum) {
                throw new Error(t('error.type.invalidMcVersion', str));
            }
            return new SubNumMcVersion(version, stage, subNum);
        }
        if (str[2] === 'w') {
            return new OldSnapshotMcVersion(parseInt(str.substring(0, 2)), parseInt(str.substring(3, 5)), str.substring(5));
        }
        throw new Error(t('error.type.invalidMcVersion', str));
    }
}

export class ReleaseMcVersion extends McVersion {
    constructor(version) {
        super(McVersionStage.RELEASE, true);
        this.version = version;
    }

    toString() {
        return this.version.toString();
    }
}

export class SubNumMcVersion extends McVersion {
    constructor(version, stage, subNum) {
        if (stage === McVersionStage.RELEASE) {
            throw new ArgsError();
        }
        super(stage, true);
        this.version = version;
        this.subNum = subNum;
    }

    toString() {
        let string = this.version.toString();
        switch (this.stage) {
            case McVersionStage.RC:
                string = `${string}-rc-${this.subNum}`
                break;
            case McVersionStage.PRE_RELEASE:
                string = `${string}-pre-${this.subNum}`
                break;
            case McVersionStage.SNAPSHOT:
                string = `${string}-snapshot-${this.subNum}`;
                break;
        }
        return string;
    }
}

export class OldSnapshotMcVersion extends McVersion {
    constructor(year, week, subSym) {
        super(McVersionStage.SNAPSHOT, false);
        this.year = year;
        this.week = week;
        this.subSym = subSym;
    }

    toString() {
        return `${padZero(this.year, 2)}w${padZero(this.week, 2)}${this.subSym}`;
    }
}