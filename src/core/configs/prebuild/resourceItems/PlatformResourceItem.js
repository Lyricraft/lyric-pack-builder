import {ResourceItem} from "./resourceItem.js";
import {McContent} from "../../../mc/mcMods.js";

export const PlatformResourceContent = {
    MOD: McContent.MOD,
    RESOURCEPACK: McContent.RESOURCEPACK,
    DATAPACK: McContent.DATAPACK,
    SHADER: McContent.SHADER,
}

export class PlatformResourceItem extends ResourceItem {
    static TYPE = 'platform';

    constructor(obj) {
        super(obj);

    }
}