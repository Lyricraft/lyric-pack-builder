import {Condition, DEFAULT_CONDITION_MAP} from "./core/configs/objects/conditions.js";

const tests = [
    // 基础常量
    "TRUE",
    "FALSE",

    // 基础单参数条件
    "mcVersion 1.18.2",
    "modLoader forge",
    "packFormat modrinth",
    "option test.id",
    "resource assets/texture.png",

    // 带引号单参数
    "mcVersion '[1.18,1.20)'",
    "resource \"inline:custom_id\"",

    // 逻辑算子基础
    "and(mcVersion 1.19.2)",
    "and(modLoader fabric, packFormat curseforge)",
    "or(TRUE, FALSE)",
    "not(modLoader quilt)",
    "not(mcVersion 1.20.1, option main.config)",

    // 多参数 []
    "modLoader [forge, neoforge]",
    "packFormat [modrinth, curseforge]",
    "option [a.b, c.d]!",
    "resource [inline:id1, inline:id2]!",
    "mcVersion ['1.18.2', \"1.19.2\", 1.20.1]",

    // 简单嵌套
    "and(mcVersion 1.18.2, or(modLoader fabric, modLoader quilt))",
    "or(not(packFormat curseforge), TRUE)",
    "not(and(option test.id, resource assets/icon.png))",

    // 三层嵌套
    "and(or(mcVersion 1.20, modLoader [forge, neoforge]), not(option [a.b, c.d]!))",

    // 空白符（换行/缩进）
    "and(\n\tmcVersion '[1.18,1.21)',\n\tor(\n\t\tmodLoader fabric,\n\t\tresource \"inline:test\"\n\t)\n)",

    // 紧凑无空格写法
    "and(modLoader[forge,neoforge],option config)",

    // 混合引号 + 后缀 + 嵌套
    "or(resource ['file/path.png',\"inline:uid\"],not(packFormat curseforge))",

    // 复杂完整用例
    "and(\n    mcVersion [1.18.2,1.19.2,1.20.1],\n    modLoader [forge, neoforge],\n    or(\n        option [client.setting, server.core]!,\n        not(resource assets/lang/en.json, TRUE)\n    ),\n    not(packFormat curseforge)\n)"
];

let dependencies;
let condition;

for (const test of tests) {
    dependencies = {};
    condition = Condition.fromString(test, DEFAULT_CONDITION_MAP, dependencies);
    console.log(dependencies);
    console.log(condition);
}