import {FILE_LOGGER} from "./fileLogger.js";
import {logHandles, LogType} from "./logTypes.js";
import {ArgsError} from "../public/errors.js";

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
    }
    enter() {
        process.stdout.write('\n'.repeat(this.line));
    }
    leave() {
        // 无须进行任何操作，因为每次渲染都会换到可重写部分结束后的一行。
    }
}

class InputState extends State {
    constructor(prompt, checkFunc) {
        super();
        this.prompt = prompt;
        this.checkFunc = checkFunc;
        this.outputQueue = [];
    }
    enter() {}
    leave() {

        if (this.outputQueue.length > 0) {
            for (const item of this.outputQueue) {
                CLI.outLine(item.type, ...item.args);
            }
        }
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
        // 豆包非要我写下面两行。
        this.lines = null;
        this.state = null;
        // ↑不是，这玩意真的有必要自己写吗！
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
}

export const CLI = new Cli();