import {checkEnum} from "../../public/type.js";
import {ArgsError} from "../../public/errors.js";
import {CANNOT_PARSE_VERSION_NUMBER_ERROR} from "./ModVersionNumber.js";

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
            if (!checkEnum(VersionCollectionFilterCriteria, key)){
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

    }

    /*
        我认为这是现阶段按版本排序的最稳妥的方法了。
     */
    sortByVersion(asc = false) {
        try {
            return this.sort(VersionCollectionSortField.VERSION_NUMBER, asc, true);
        } catch(e) {
            if (e.type !== CANNOT_PARSE_VERSION_NUMBER_ERROR){
                throw e;
            }
        }
        return this.sort(VersionCollectionSortField.PUBLISHED_AT, asc);
    }
}

/*
    使用筛选，请以筛选条件为键，参数为值。
 */
export const VersionCollectionFilterCriteria = {
    MOD_LOADER : 'modLoader', // ModLoader / []
    GAME_VERSION : 'gameVersion', // VersionRange / []
    VERSION_STAGE : 'versionStage', // VersionStage / []
    FEATURED: 'featured', // bool
}

const filterHandlers = {
    [VersionCollectionFilterCriteria.MOD_LOADER] : (item, arg) => {
        return item.loaders.includes(arg);
    },
    [VersionCollectionFilterCriteria.GAME_VERSION] : (item, arg) => {
        for (const version of item.gameVersions) {
            if (arg.fit(version)) return true;
        }
        return false;
    },
    [VersionCollectionFilterCriteria.VERSION_STAGE] : (item, arg) => {
        return item.versionStage.level() === arg.level();
    },
    [VersionCollectionFilterCriteria.FEATURED] : (item, arg) => {
        return item.featured === arg.featured;
    }
}

export const VersionCollectionSortField = {
    PUBLISHED_AT: 'publishedAt', // 不完全准确
    VERSION_NUMBER : 'versionNumber', // 不安全
}