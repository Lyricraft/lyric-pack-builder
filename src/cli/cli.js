import {FILE_LOGGER} from "../core/log/fileLogger.js";
import {logHandles, LogType} from "../core/log/logTypes.js";
import {ArgsError} from "../core/public/errors.js";
import * as readline from "node:readline";

/*
    我们正尝试使用一系列神奇的方法来包装上世纪传下来的命令行界面，力争给客户最丝滑的体验。

    这里的代码好像有点乱，但混沌又何尝不是一种优美。
 */

class State {
    enter() {}
    leave() {}
}

class LineState extends State {
    // 无须进行任何操作
    enter() {}
    leave() {}
}
const LINE_STATE = new LineState();

class RewriteState extends State {
    constructor(line) {
        super();
        this.line = line;
        this.lineMoved = false; // 是不是移到了可更改部分最下面一行，也就是是不是输出了空行。
    }
    enter() {
        this.lineMoved = false;
        // 不是在这里输出空行，改成真渲染的时候输出空行，这样就可以避免出现意外空行。
    }
    leave() {
        // 无须进行任何操作，因为每次渲染都会换到可重写部分结束后的一行。
    }
}

class InputState extends State {
    constructor(prompt, callback, checkFunc = null) {
        super();
        this.prompt = prompt;
        this.callback = callback;
        this.checkFunc = checkFunc;
        this.outputQueue = []; // {type: LogType, args: string[]}
        this.inputQueue = []; // InputState
        this.reader = null;
    }
    enter() {
        const reader = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
        this.reader = reader;
        const question = () => {
            FILE_LOGGER.log(LogType.LOG, '?', this.prompt);
            reader.question(this.prompt, (answer) => {
                FILE_LOGGER.log(LogType.LOG, '>', answer);
                if (!this.checkFunc) {
                    this.callback(answer);
                } else {
                    if (this.checkFunc(answer)) {
                        this.callback(answer);
                    } else {
                        // 再来一遍！
                        setTimeout(question, 0); // 不会爆栈啦！
                    }
                }
            })
        }
        question();
    }
    leave() {
        this.reader.close();
        // 先把积压的普通行输出输出出去
        // CLI.shiftState(LINE_STATE);
        CLI.state = LINE_STATE;
        CLI.state.enter();
        // ↑
        if (this.outputQueue.length > 0) {
            for (const item of this.outputQueue) {
                CLI.outLine(item.type, ...item.args);
            }
        }
        // 然后如果还有要输入的东西，再让客户输
        if (this.inputQueue.length > 0) {
            const nextInput = this.inputQueue.shift();
            nextInput.inputQueue = this.inputQueue;
            // CLI.shiftState(nextInput);
            CLI.state = nextInput;
            CLI.state.enter();
            //↑
        }
        // 这里不管是不是有 RewriteState 在等待，毕竟有也不是真的等待。它下一次刷新行时，会自动切换过来显示的。
        // 这一点东西不显示无人在意（连我都不在意），毕竟也写出到文件日志了。大大降低编码复杂度，减少 BUG 概率。
    }
}

class Rewriter {
    constructor(state) {
        this.state = state;
        this.lines = Array(state.line).fill("");
    }

    writeLine(line, content) {
        if (line < 0 || line > this.state.line - 1) {
            throw new ArgsError('[CLI] Wrong line index.');
        }

        FILE_LOGGER.log(LogType.LOG, '-', content);

        if (CLI.state instanceof RewriteState) {
            if (CLI.state.line === this.state.line) {
                this.#write(line, content);
            } else {
                CLI.shiftState(this.state)
                this.#write(line, content);
            }
        } else if (CLI.state instanceof LineState) {
            CLI.shiftState(this.state)
            this.#write(line, content);
        }
        // 输入状态不做处理
    }

    #write(line, content) {
        this.lines[line] = content;
        this.#render();
    }

    #render() {
        if (!this.state.lineMoved) {
            // 在还没有输出空行时输出空行，以把光标移到可重写部分最下面，便于后面上移和重写。
            process.stdout.write('\n'.repeat(this.state.line));
            this.state.lineMoved = true;
        }
        process.stdout.write(`\x1B[${this.state.line}A`); // 上移光标
        for(const line of this.lines) {
            // 清除整行，输出，然后换行
            process.stdout.write('\x1B[2K' + line + '\n');
        }
    }

    // 调用后请手动将对象置 null，或者说写 rewriter = rewriter.destroy()，如果你喜欢的话。
    // 没错我喜欢，毕竟这话就是对我自己说的。
    destroy() {
        if (CLI.state instanceof RewriteState && CLI.state.line === this.state.line) {
            CLI.shiftState(LINE_STATE);
        }
        return null;
    }
}

class Cli {
    constructor() {
        this.state = LINE_STATE;
    }

    shiftState(target) {
        this.state.leave();
        this.state = target;
        this.state.enter();
    }

    // 外面别用！
    outLine(type, ...args) {
        logHandles[type](...args);
    }

    log(type, ...args) {
        FILE_LOGGER.log(type, ...args);

        if (this.state instanceof InputState) {
            this.state.outputQueue.push({type, args});
        } else if (this.state instanceof RewriteState) {
            const storedState = this.state;
            this.shiftState(LINE_STATE);
            this.outLine(type, ...args);
            this.shiftState(storedState);
        } else {
            // 剩下的就是自己了
            this.outLine(type, ...args);
        }
    }

    newRewrite(line) {
        const rewrite = new RewriteState(line);
        if (!(this.state instanceof InputState)) {
            this.shiftState(rewrite);
        }
        return new Rewriter(rewrite);
    }

    async input(prompt, checkFunc = null) {
        if (checkFunc && typeof checkFunc !== 'function') {
            throw new ArgsError('[CLI] Wrong check func');
        }
        return new Promise((resolve) => {
            const newState = new InputState(prompt,  (value) => {
                newState.leave();
                resolve(value);
            }, checkFunc);
            if (this.state instanceof InputState) {
                this.state.inputQueue.push(newState);
            } else {
                this.shiftState(newState);
            }
        })
    }
}

export const CLI = new Cli();