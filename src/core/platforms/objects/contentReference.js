import {isStrictSameType} from "../../public/type.js";

export class ContentReference {
    constructor(type) {
        this.type = type;
    }

    symbolType() {
        return 'abstract';
    }

    symbol() {
        return null;
    }

    // 只是在创建版本引用时检查内容引用是否匹配，
    // 只能阻止同类型 ContentReference 不匹配，不能保证匹配！
    // 返回值：true 代表匹配或跳过，false 代表不匹配。
    checkMatch(compare) {
        // 如果不是同一类型，没法判断，直接返回。
        if (this.symbolType() !== compare.symbolType()) {
            return true;
        }
        return this.symbol() === compare.symbol();
    }
}