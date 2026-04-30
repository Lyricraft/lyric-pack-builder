import {parseFileConfig} from "./core/configs/parser.js";
import path from "path";
import {ResourceList} from "./core/configs/prebuild/resourceList.js";
import {FILE_LOGGER, FileLogger} from "./core/log/fileLogger.js";
import Logger from "./core/log/logger.js";
import {LogType} from "./core/log/logTypes.js";

FILE_LOGGER.init('log/log.txt');

Logger.log('log');
Logger.info('info');
Logger.warn('warn');
Logger.debug('debug');
Logger.error('error');
Logger.typedLog(LogType.LOG, 'log');