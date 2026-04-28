import {ResourceItemTypes} from "./resourceItem.js";
import {PlatformResourceItem} from "./platformResourceItem.js";
import {deepClone, stringUsable} from "../../../public/type.js";
import {FilesResourceItem} from "./filesResourceItem.js";
import {PlatformResourceContent} from "../../enums.js";
import {checkConfigField} from "../../checker.js";

ResourceItemTypes
    .set(PlatformResourceItem.TYPE, (obj) => new PlatformResourceItem(obj))
    .set(FilesResourceItem.TYPE, (obj) => new FilesResourceItem(obj));

// 兼容 PlatformResourceItem 的简写定义方式
for(const content of Object.values(PlatformResourceContent)) {
    ResourceItemTypes.set(content, function (obj) {
        const obj2 = deepClone(obj);
        obj2.type = PlatformResourceItem.TYPE;
        obj2.content = content;
        return new PlatformResourceItem(obj2);
    });
}

export  function resourceItemFrom(obj) {
    checkConfigField(obj.type, 'ResourceItem', 'type',
        'string(ResourceItemType)', (str) => (stringUsable(str) && ResourceItemTypes.has(str)));
    return (ResourceItemTypes.get(obj.type))(obj);
}