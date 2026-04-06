import {parseFileYaml} from "./core/configs/parser.js";
import path from "path";
import {ResourceList} from "./core/configs/prebuild/resourceList.js";

// 前天没写代码是因为出去玩下午回来太累，就去玩酒狐了。
// 本来准备昨天写代码的，还能写一行“清明时节雨纷纷”的注释，奈何昨天中午没下雨。就去玩酒狐了。玩到晚上开始下雨了，但是已经玩开了，就只能继续玩了。
// 虽然 Github 上的贡献图少了两个绿点，但是，月有阴晴圆缺。
// 写在 debug.js 里面的注释没人会看，毕竟调试脚本很快就会换。

const obj = await parseFileYaml(path.join('lpb', 'list.yml'));

const rl = ResourceList.fromArray(obj.groups);

console.log(rl);