import {CLI} from "./cli.js";
import {LogType} from "./logTypes.js";

/*
    logger.typedLog ---> CLI.log ---> FILE_LOGGER.log
 */

export default {
    typedLog(type, ...args) {
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