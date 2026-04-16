import {ResourceItem} from "./resourceItem.js";

export class PlatformResourceItem extends ResourceItem {
    static TYPE = 'platform';

    constructor(obj) {
        super(obj);

    }
}