import {parseInnerObj} from "../../parser.js";
import {Condition} from "../../objects/conditions.js";
import {checkConfigEnum, checkConfigField} from "../../checker.js";
import {ModSideOption} from "../../../mc/mcMods.js";
import {stringUsable} from "../../../public/type.js";

export const ResourceItemTypes = new Map();

export class ResourceItem{
    constructor(obj) {
        this.type = obj.type;

        this.condition = parseInnerObj(obj.conditions, 'ResourceItem', 'conditions',
            (array) => Condition.fromArray(array), true);
        if (!this.condition) {
            this.condition = Condition.always();
        }

        this.side = checkConfigEnum(obj.side, 'ResourceItem', 'side', 'string(ModSideOption)',
            ModSideOption, ModSideOption.AUTO);
    }

    static from(obj) {
        checkConfigField(obj.type, 'ResourceItem', 'type',
            'string(ResourceItemType)', (str) => (stringUsable(str) && ResourceItemTypes.has(str)));
        return (ResourceItemTypes.get(obj.type))(obj);
    }
}