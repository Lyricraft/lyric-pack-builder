import logger from "./core/log/logger.js";
import {sleep} from "./core/public/control.js";
import {CLI} from "./cli/cli.js";
import {stringUsable} from "./core/public/type.js";
import {FILE_LOGGER} from "./core/log/fileLogger.js";

await FILE_LOGGER.setFile('./logs/debug.log');

logger.log('吴丝蜀桐张高秋');
await sleep(1000);
logger.log('空山凝云颓不流');
await sleep(1000);
logger.log('江娥啼竹素女愁');
await sleep(1000);
logger.log('李凭中国弹箜篌');
await sleep(1000);

let rewriter = CLI.newRewrite(2);
rewriter.writeLine(0, '昆山玉碎凤凰叫');
await sleep(1000);
rewriter.writeLine(1, '芙蓉泣露香兰笑');
await sleep(1000);
rewriter.writeLine(0, '十二门前融冷光');
await sleep(1000);
rewriter.writeLine(1, '二十三丝动紫皇');
await sleep(1000);

logger.log('女娲炼石补天处');
await sleep(1000);
logger.log('石破天惊逗秋雨');
await sleep(1000);

rewriter.writeLine(0, '梦入深山教神妪');
await sleep(1000);
rewriter.writeLine(1, '老鱼跳波瘦蛟舞');
rewriter = rewriter.destroy();
await sleep(1000);

logger.log('吴质不眠倚桂树');
await sleep(1000);
logger.log('露脚斜飞湿寒兔');
await sleep(1000);

setTimeout(() => logger.log('答案：李贺'), 1);
logger.log('这首诗的作者是谁？');
const answer1 = await CLI.input('李白/李逵/李贺/李鬼：', (answer) => {
    answer = answer.trim();
    return (['李白', '李逵', '李贺', '李鬼'].includes(answer));
});
logger.log(`回答${answer1.trim() === '李贺' ? '正确' : '错误'}！`);

setTimeout(async () => {
    const answer3 = await CLI.input('请输入考号：', (answer) => stringUsable(answer.trim()));
    logger.log(`考号 ${answer3.trim()} 已记录！`);
}, 1)
setTimeout(() => logger.log('答案：弦乐器'), 1);
logger.log('箜篌是什么种类的乐器？');
const answer2 = await CLI.input('弦乐器/管乐器/打击乐器/电子乐器：', (answer) => {
    answer = answer.trim();
    return (['弦乐器', '管乐器', '打击乐器', '电子乐器'].includes(answer));
});
logger.log(`回答${answer2.trim() === '弦乐器' ? '正确' : '错误'}！`);
