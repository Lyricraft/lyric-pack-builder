import {parseFileConfig} from "./core/configs/parser.js";
import path from "path";
import {ResourceList} from "./core/configs/prebuild/resourceList.js";

const obj = await parseFileConfig(path.join('lpb', 'list.yml'));

const rl = ResourceList.fromArray(obj.groups);

console.log(rl);