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
        if (Object.hasOwn(obj, 'type')) {
            // 直接填写的资源
            if (Object.hasOwn(obj, 'main')) {
                throw new ConfigFieldError('ResourceDefine', "",
                    t('error.configs.varietyDefine', 'ResourceDefine', 'type', 'main'));
            }
            // 没有 conditions 的 ResourceItem 会被自动解析为 always
            main.push(parseInnerObj(obj, 'ResourceDefine', 'main', ResourceItem.from));
        } else if (isPlainObject(obj.main)) {
            // main 字段填的是单个资源

            // 现改为不能这样定义！
            throw new ConfigFieldError('ResourceDefine', 'main',
                t('error.configs.fieldType', 'ResourceDefine', 'main', 'ResourceItem[]', obj.main));

            /*
            if (Object.hasOwn(obj.main, 'conditions')) {
                throw new ConfigFieldError('ResourceDefine', 'main',
                    t('error.configs.invalidKey', 'conditions', 'ResourceDefine.main : object(ResourceItem)'));
            }
            // 没有 conditions 的 ResourceItem 会被自动解析为 always
            main.push(parseInnerObj(obj.main, 'ResourceDefine', 'main', ResourceItem.from));
             */
        } else if (Array.isArray(obj.main)) {
            // main 字段填的是资源数组
            checkConfigArray(obj.main, 'ResourceDefine', 'main', undefined, 'ResourceItem',
                function (item) {
                    if (!isPlainObject(item)) {
                        return false;
                    }
                    main.push(parseInnerObj(item, 'ResourceDefine', 'main[*]', ResourceItem.from));
                });
        } else {
            throw new ConfigFieldError('ResourceDefine', 'main',
                t('error.configs.fieldType', 'ResourceDefine', 'main', 'ResourceItem[]', obj.main));
            // throw new ConfigFieldError('ResourceDefine', 'main', t('error.configs.fieldType', 'ResourceDefine', 'main', 'ResourceItem / []', obj.main));
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