
export const LogType = {
    LOG: 'log',
    INFO: 'info',
    WARN: 'warn',
    DEBUG: 'debug',
    ERROR: 'error',
}

export const LogHandles = {
    [LogType.LOG]: console.log,
    [LogType.INFO]: console.info,
    [LogType.WARN]: console.warn,
    [LogType.DEBUG]: console.debug,
    [LogType.ERROR]: console.error,
}