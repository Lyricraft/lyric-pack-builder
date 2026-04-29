import {parseInnerObj} from "../../parser.js";
import {Condition} from "../../objects/conditions.js";
import {checkConfigEnum, checkConfigField} from "../../checker.js";
import {ModSideOption} from "../../../mc/mcMods.js";
import {stringUsable} from "../../../public/type.js";

/*
    Map<string(ResourceItemType), func>
 */
export const ResourceItemTypes = new Map();

export class ResourceItem{
    constructor(obj) {
        this.type = obj.type;

        this.condition = parseInnerObj(obj.condition, 'ResourceItem', 'conditions',
            (exp) => Condition.fromString(exp), Condition.always());

        this.side = checkConfigEnum(obj.side, 'ResourceItem', 'side', 'string(ModSideOption)',
            ModSideOption, ModSideOption.AUTO);
    }
}