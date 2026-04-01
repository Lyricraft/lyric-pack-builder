import {t} from "../i18n/translate.js";
import {stringUsable} from "../public/type.js";
import {CompareResult} from "../public/calculate.js";

// 想想你造过的轮子，用用你造过的轮子。

export const VERSION_PATTERN = /^\d+(\.\d+)*$/;

export class Version {
    constructor(...args) {
        if (args.length <= 1){
            throw new Error(t('error.versionType.constructorArgsTooShort', args.join('.')));
        }
        this.versionArray = [];
        for (const arg of args) {
            if (!Number.isInteger(arg)) {
                throw new Error(t('error.versionType.invalidConstructorArgs', args.join('.')));
            }
            this.versionArray.push(arg);
        }
    }

    toString() {
        let str = '';
        for (let i = this.versionArray.length - 1; i >= 0; i--) {
            if (this.versionArray[i] === 0 && str.length === 0) {
                if (i >= 1) continue;
                else str = this.versionArray[i];
            }
            str = this.versionArray[i] + (str.length === 0 ? '' : '.') + str;
        }
        return str;
    }

    static fromString(str) {
        if (!stringUsable(str) || !VERSION_PATTERN.test(str)){
            throw new Error(t('error.versionType.invalidVersionString', str));
        }
        const versionArray = str.split('.');
        for (const i in versionArray) {
            versionArray[i] = parseInt(versionArray[i]);
        }
        return new Version(...versionArray);
    }

    static compare(v1, v2){
        for (let i = 0; i < Math.max(v1.versionArray.length, v2.versionArray.length); i++) {
            const d = (v1.versionArray[i] || 0) - (v2.versionArray[i] || 0);
            if (d !== 0){
                return new CompareResult(d);
            }
        }
        return new CompareResult(0);
    }
}

export class VersionRange {
    constructor(left, right, includeLeft, includeRight) {
        this.left = left;
        this.right = right;
        this.includeLeft = includeLeft;
        this.includeRight = includeRight;

        if (left !== null && !(left instanceof Version)) {
            throw new Error(t('error.versionRangeType.invalidConstructorVersionArg', 'left', left));
        }
        if (right !== null && !(right instanceof Version)) {
            throw new Error(t('error.versionRangeType.invalidConstructorVersionArg', 'right', right));
        }
        if (left === null && includeLeft) {
            throw new Error(t('error.versionRangeType.includesInfiniteEndpoint', 'left'));
        }
        if (right === null && includeRight) {
            throw new Error(t('error.versionRangeType.includesInfiniteEndpoint', 'right'));
        }

        // 仅在双侧都有限时做大小关系校验
        if (left !== null && right !== null) {
            const compareResult = Version.compare(left, right);
            if (compareResult.equal()) {
                if (!includeLeft || !includeRight) {
                    throw new Error(t('error.versionRangeType.invalidInterval', VersionRange.#stringify(left, right, includeLeft, includeRight)));
                }
                return;
            }
            if (compareResult.greater()) {
                throw new Error(t('error.versionRangeType.invalidInterval', VersionRange.#stringify(left, right, includeLeft, includeRight)));
            }
        }
    }

    toString() {
        // 先判断是不是单版本
        if (this.left && this.right && Version.compare(this.left, this.right).equal()) {
            return this.left.toString();
        }
        // 是多版本
        return VersionRange.#stringify(this.left, this.right, this.includeLeft, this.includeRight);
    }

    static #stringify(left, right, includeLeft, includeRight) {
        return ((includeLeft ? '[' : '(')
            + (left ? left.toString() : '') + ','
            + (right ? right.toString() : '')
            + (includeRight ? ']' : ')'));
    }

    static fromString(str) {
        if (!stringUsable(str)){
            throw new Error(t('error.versionRangeType.invalidRangeString', str));
        }
        // 先判断是不是单版本
        if (str.includes(',')) {
            // 是多版本。无穷只能由空端点表示，不支持 null 字面量
            const rangePattern = /^([\[(])\s*(\d+(?:\.\d+)*)?\s*,\s*(\d+(?:\.\d+)*)?\s*([\])])$/;
            const match = str.match(rangePattern);
            if (!match) {
                throw new Error(t('error.versionRangeType.invalidRangeString', str));
            }
            const includeLeft = match[1] === '[';
            const left = match[2] ? this.#constructAVersion(match[2], str) : null;
            const right = match[3] ? this.#constructAVersion(match[3], str) : null;
            const includeRight = match[4] === ']';
            return new VersionRange(left, right, includeLeft, includeRight);
        } else {
            // 是单版本
            const v = this.#constructAVersion(str);
            return new VersionRange(v, v, true, true);
        }
    }

    static #constructAVersion(str, fullRange = str){
        try {
            return Version.fromString(str);
        } catch (e) {
            throw new Error(t('error.versionRangeType.invalidRangeStringMsg', fullRange, e.message));
        }
    }

    fit(currentVersion) {
        if (!(currentVersion instanceof Version)) {
            throw new Error(t("error.versionRangeType.notAVersion", currentVersion));
        }

        if (this.left !== null) {
            const leftCompare = Version.compare(currentVersion, this.left);
            if (leftCompare.less()) {
                return false;
            }
            if (leftCompare.equal() && !this.includeLeft) {
                return false;
            }
        }
        if (this.right !== null) {
            const rightCompare = Version.compare(currentVersion, this.right);
            if (rightCompare.greater()) {
                return false;
            }
            if (rightCompare.equal() && !this.includeRight) {
                return false;
            }
        }
        return true;
    }

    getAllInRange(versions) {

        // 传入的 versions 应该是一个按递减顺序排布的版本字符串数组
        // 只在特定处调用，不作参数校验

        const inRangeVersions = [];

        for (const versionStr of versions) {
            if (!stringUsable(versionStr)) {
                continue;
            }

            const parsedVersion = Version.fromString(versionStr);

            if (this.right !== null) {
                const rightCompare = Version.compare(parsedVersion, this.right);
                if (rightCompare.greater() || (rightCompare.equal() && !this.includeRight)) {
                    // versions 为降序，当前版本过新，后续可能进入区间，继续扫描
                    continue;
                }
            }

            if (this.left !== null) {
                const leftCompare = Version.compare(parsedVersion, this.left);
                if (leftCompare.less() || (leftCompare.equal() && !this.includeLeft)) {
                    // versions 为降序，当前版本已低于下界，后续只会更低，可提前结束
                    break;
                }
            }

            inRangeVersions.push(versionStr);
        }

        return inRangeVersions;
    }
}