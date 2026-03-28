import {checkEnum} from "../../public/type.js";
import {ArgsError, TypedError} from "../../public/errors.js";
import {CANNOT_PARSE_VERSION_NUMBER_ERROR} from "./ModVersionNumber.js";
import {Version} from "../../objects/version.js";

// 暂且不过多写类型检验了，调用的时候注意下就好。

export class ModVersionCollection {
    constructor(array = []) {
        this.array = array; // ModVersion[]
    }

    isEmpty() {
        return this.array.length === 0;
    }

    filter(criteriaObj){

        for(const key in criteriaObj){
            if (!checkEnum(ModVersionCollectionFilterCriteria, key)){
                throw new ArgsError();
            }
            if (Array.isArray(criteriaObj[key])){
                continue;
            }
            if (criteriaObj[key]){
                criteriaObj[key] = Array.of(criteriaObj[key]);
            } else {
                throw new ArgsError();
            }
        }

        const newArray = this.array.filter(item => {
            let toRemove = false;
            for(const crit in criteriaObj) {
                let fit = false;
                for (const arg of criteriaObj[crit]) {
                    if (filterHandlers[crit](item, arg)) {
                        fit = true;
                        break;
                    }
                }
                if (!fit) {
                    toRemove = true;
                    break;
                }
            }
            return !toRemove;
        })

        return new ModVersionCollection(newArray);
    }

    /*
        默认降序，将 asc 设为 true 升序。

        needSecure 是为 VERSION_NUMBER 排序方式准备的。本来解析不到 真·版本号，该项目会被放到最末尾，无论升序还是降序。
        设为 true 后会立即抛错，type 为 CANNOT_PARSE_VERSION_NUMBER_ERROR。(定义在 ModVersionNumber.js 中) 。
     */
    sort(field, asc = false, needSecure = false) {
        if (!checkEnum(ModVersionCollectionSortField, field)){
            throw new ArgsError();
        }
        if (field === ModVersionCollectionSortField.VERSION_NUMBER && needSecure) {
            if (!this.#checkAllVersionNumbers()) {
                throw new TypedError(CANNOT_PARSE_VERSION_NUMBER_ERROR);
            }
        }

        return new ModVersionCollection(this.array.sort((a, b) => sortHandlers[field](a, b, asc)));
    }

    /*
        我认为这是现阶段按版本排序的最稳妥的方法了。
     */
    sortByVersionNumber(asc = false) {
        if (this.#checkAllVersionNumbers()) {
            return this.sort(ModVersionCollectionSortField.VERSION_NUMBER, asc);
        } else {
            return this.sort(ModVersionCollectionSortField.PUBLISHED_AT, asc);
        }
    }

    /*
        默认取最大项，将 min 设为 true 取最小项。

        解析不到 真·版本号，该项目将尽量不会被选出。如果 needSecure，则立即抛出上述错误。
     */
    getMax(field, min = false, needSecure = false) {
        if (this.array.length === 0) return null;
        if (!checkEnum(ModVersionCollectionSortField, field)){
            throw new ArgsError();
        }
        if (field === ModVersionCollectionSortField.VERSION_NUMBER && needSecure) {
            if (!this.#checkAllVersionNumbers()) {
                throw new TypedError(CANNOT_PARSE_VERSION_NUMBER_ERROR);
            }
        }

        return this.array.reduce((prev, current) => {
            if (sortHandlers[field](prev, current, min) > 0) {
                return current;
            } else {
                return prev;
            }
        });
    }

    /*
        同理。使用自动降级。
     */
    getLatest(min = false) {
        if (this.#checkAllVersionNumbers()) {
            return this.getMax(ModVersionCollectionSortField.VERSION_NUMBER, min);
        } else {
            return this.getMax(ModVersionCollectionSortField.PUBLISHED_AT, min);
        }
    }

    #checkAllVersionNumbers() {
        for (const item of this.array) {
            if (!item.versionNumber.version) {
                return false;
            }
        }
        return true;
    }
}

/*
    使用筛选，请以筛选条件为键，参数为值。
 */
export const ModVersionCollectionFilterCriteria = {
    LOADER : 'loader', // ModLoader / []
    GAME_VERSION : 'gameVersion', // T extends McVersion / []
    VERSION_STAGE : 'versionStage', // VersionStage / []
    FEATURED: 'featured', // bool
}

const filterHandlers = {
    [ModVersionCollectionFilterCriteria.LOADER] : (item, arg) => {
        return item.loaders.includes(arg);
    },
    [ModVersionCollectionFilterCriteria.GAME_VERSION] : (item, arg) => {
        for (const version of item.gameVersions){
            if (version.toString() === arg.toString()){
                return true;
            }
        }
        return false;
    },
    [ModVersionCollectionFilterCriteria.VERSION_STAGE] : (item, arg) => {
        return item.versionStage.level() === arg.level();
    },
    [ModVersionCollectionFilterCriteria.FEATURED] : (item, arg) => {
        return item.featured === arg;
    }
}

export const ModVersionCollectionSortField = {
    PUBLISHED_AT: 'publishedAt', // 不完全准确
    VERSION_NUMBER : 'versionNumber', // 不安全
}

const sortHandlers = {
    [ModVersionCollectionSortField.VERSION_NUMBER] : (a, b, asc) => {
        if (!a.versionNumber.version && !b.versionNumber.version){
            return 0;
        }
        if (!a.versionNumber.version && b.versionNumber.version){
            return 1;
        }
        if (a.versionNumber.version && !b.versionNumber.version){
            return -1;
        }
        if (asc) {
            // 升序
            return Version.compare(a.versionNumber.version, b.versionNumber.version).num;
        } else {
            // 降序
            return -Version.compare(a.versionNumber.version, b.versionNumber.version).num;
        }
    },
    [ModVersionCollectionSortField.PUBLISHED_AT] : (a, b, asc) => {
        if (asc) {
            // 升序
            return a.publishedAt - b.publishedAt;
        } else {
            // 降序
            return -(a.publishedAt - b.publishedAt);
        }
    },
}