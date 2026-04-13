import {checkConfigArray, checkConfigStringChars} from "../checker.js";
import {isPlainObject} from "../../public/type.js";
import {ConfigFieldError} from "../errors.js";
import {t} from "../../i18n/translate.js";
import {ResourceItem} from "./resourceItems/resourceItem.js";
import {parseInnerObj} from "../parser.js";

export class ResourceDefine {
    constructor(id, main, secondary) {
        this.id = id; // string
        this.main = main; // ResourceItem[]
        this.secondary = secondary; // ResourceItem[]
    }

    static fromObj(obj) {
        const main = [];
        if (isPlainObject(obj.main)) {
            if (Object.hasOwn(obj.main, 'conditions')) {
                throw new ConfigFieldError('ResourceDefine', 'main',
                    t('error.configs.invalidKey', 'conditions', 'ResourceDefine.main : object(ResourceItem)'));
            }
            // 没有 conditions 的 ResourceItem 会被自动解析为 always
            main.push(parseInnerObj(obj.main, 'ResourceDefine', 'main', ResourceItem.from));
        } else if (Array.isArray(obj.main)) {
            checkConfigArray(obj.main, 'ResourceDefine', 'main', undefined, 'ResourceItem',
                function (item) {
                    if (!isPlainObject(item)) {
                        return false;
                    }
                    main.push(parseInnerObj(item, 'ResourceDefine', 'main[*]', ResourceItem.from));
                });
        } else {
            throw new ConfigFieldError('ResourceDefine', 'main',
                t('error.configs.fieldType', 'ResourceDefine', 'main', 'ResourceItem / []', obj.main));
        }

        const secondary = [];
        checkConfigArray(obj.secondary, 'ResourceDefine', 'secondary', null, 'ResourceItem',
            function (item) {
                if (!isPlainObject(item)) {
                    return false;
                }
                secondary.push(parseInnerObj(item, 'ResourceDefine', 'secondary[*]', ResourceItem.from));
            })

        return new ResourceDefine(obj.id, main, secondary);
    }
}