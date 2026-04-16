import {ResourceItemTypes} from "./resourceItem.js";
import {PlatformResourceItem} from "./platformResourceItem.js";
import {deepClone} from "../../../public/type.js";
import {FilesResourceItem} from "./filesResourceItem.js";
import {PlatformResourceContent} from "../../enums.js";

ResourceItemTypes
    .set(PlatformResourceItem.TYPE, PlatformResourceItem)
    .set(FilesResourceItem.TYPE, FilesResourceItem);

// 兼容 PlatformResourceItem 的简写定义方式
for(const content of Object.values(PlatformResourceContent)) {
    ResourceItemTypes.set(content, function (obj) {
        const obj2 = deepClone(obj);
        obj2.type = PlatformResourceItem.TYPE;
        obj2.content = content;
        return new PlatformResourceItem(obj2);
    });
}