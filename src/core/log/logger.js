import {CLI} from "../../cli/cli.js";
import {LogHandles, LogType} from "./logTypes.js";
import {ArgTypeError} from "../public/errors.js";

/*
    logger.typedLog ---> CLI.log ---> FILE_LOGGER.log
 */

export default {
    typedLog(type, ...args) {
        if (!Object.hasOwn(LogHandles, type)) {
            throw new ArgTypeError('type', 'LogType', type);
        }
        CLI.log(type, ...args);
    },
    log(...args) {
        CLI.log(LogType.LOG, ...args);
    },
    info(...args) {
        CLI.log(LogType.INFO, ...args);
    },
    warn(...args) {
        CLI.log(LogType.WARN, ...args);
    },
    error(...args) {
        CLI.log(LogType.ERROR, ...args);
    },
    debug(...args) {
        CLI.log(LogType.DEBUG, ...args);
    }
}