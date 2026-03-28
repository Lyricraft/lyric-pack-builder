import {checkEnum} from "../../public/type.js";
import {ArgsError, TypedError} from "../../public/errors.js";
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
     */
    sort(field, asc = false) {
        if (!checkEnum(ModVersionCollectionSortField, field)){
            throw new ArgsError();
        }

        return new ModVersionCollection(this.array.sort((a, b) => sortHandlers[field](a, b, asc)));
    }

    /*
        默认取最大项，将 min 设为 true 取最小项。
     */
    getMax(field, min = false) {
        if (this.array.length === 0) return null;
        if (!checkEnum(ModVersionCollectionSortField, field)){
            throw new ArgsError();
        }

        return this.array.reduce((prev, current) => {
            if (sortHandlers[field](prev, current, min) > 0) {
                return current;
            } else {
                return prev;
            }
        });
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
        if(!a.versionNumber.version || !b.versionNumber.version){
            return sortHandlers[ModVersionCollectionSortField.PUBLISHED_AT](a, b, asc);
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