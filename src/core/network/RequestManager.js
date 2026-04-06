import {ArgsError} from "../public/errors.js";
import {deepMerge} from "../public/type.js";
import {sleep} from "../public/control.js";
import {HttpError} from "./HttpError.js";

/*
    求木之长，必故其根本。
 */

// 发现提交信息写得有点点小毛病，强迫症受不了。准备修正提交，但又不能直接改提交信息，必须有文件更改才能修正。所以写了这行注释，就可以用这个变更去修正提交啦！

/*
    config:
        int autoRetryTimes
        function requestAgainCallback(Error e, function requestFunc, any[] args) : bool
 */

export class RequestManager{
    constructor(requestInterval, config = {}){
        if (!Number.isInteger(requestInterval) || requestInterval < 0 || !this.#checkConfig(config)){
            throw new ArgsError('RequestManager config is not valid');
        }
        this.requestInterval = requestInterval;
        this.config = config;
        this.lastRequestTime = 0;
    }

    #checkConfig(config){
        if (config.autoRetryTimes) {
            if (!Number.isInteger(config.autoRetryTimes) || config.autoRetryTimes < 0) {
                return false;
            }
        } else {
            config.autoRetryTimes = 0;
        }
        if (config.requestAgainCallback) {
            if (typeof config.requestAgainCallback !== 'function') {
                return false;
            }
        } else {
            config.requestAgainCallback = null;
        }
        return true;
    }

    setConfig(config){
        if (!this.#checkConfig(config)){
            throw new ArgsError('RequestManager config is not valid');
        } else {
            this.config = config;
        }
    }

    async requestWithConfig(func, config, ...args) {
        const mergedConfig = deepMerge(this.config, config);
        if (!this.#checkConfig(mergedConfig)) {
            throw new ArgsError('RequestManager config is not valid');
        }

        let tryTimes = 0;
        while (true) {

            const timeLeft  = Date.now() - this.lastRequestTime - this.requestInterval;
            if (timeLeft > 0) {
                await sleep(timeLeft);
            }

            try {
                this.lastRequestTime = Date.now();
                tryTimes++;
                return await func(...args);
            } catch (e) {
                // TODO: 此处应输出一行警告日志
                if (e instanceof HttpError || e.response?.status) {
                    const status = e instanceof HttpError ? e.status : e.response.status;

                    if (status === 502 || status === 503 || status === 504 || (status === 429 && !mergedConfig.requestAgainCallback)) {
                        if (tryTimes >= mergedConfig.autoRetryTimes + 1) {
                            throw e;
                        } else {
                            continue;
                        }
                    }

                    if (status === 429 && mergedConfig.requestAgainCallback) {
                        if (await mergedConfig.requestAgainCallback(e, func, args)) {
                            tryTimes = 0;
                            continue;
                        } else {
                            throw e;
                        }
                    }

                    throw e;
                }

                if (tryTimes > mergedConfig.autoRetryTimes + 1) {
                    throw e;
                } else {
                    continue;
                }
            }
        }
    }

    async request(fun, ...args) {
        return await this.requestWithConfig(fun, {}, ...args);
    }
}