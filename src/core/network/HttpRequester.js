import {ArgsError} from "../public/errors.js";
import {deepMerge} from "../public/type.js";
import {sleep} from "../public/control.js";
import {HttpError} from "./HttpError.js";
import logger from "../log/logger.js";
import {t} from "../i18n/translate.js";
import {HttpRequest} from "./HttpRequest.js";

/*
    求木之长，必故其根本。
 */

// 发现提交信息写得有点点小毛病，强迫症受不了。准备修正提交，但又不能直接改提交信息，必须有文件更改才能修正。所以写了这行注释，就可以用这个变更去修正提交啦！
// 上面的，我跟你说，提交信息其实一直都可以直接改，就是你干嘛非要跟那个 修正 选项死磕咧。

/*
    config:
        int autoRetryTimes 默认：0
        int timeout 单位：毫秒  默认：10 * 1000
        function requestAgainCallback(Error e, HttpRequest rq) : bool
        function errorHandler(Error e, HttpRequest rq) : object
 */

export class HttpRequester {
    constructor(requestInterval, config = {}){
        if (!Number.isInteger(requestInterval) || requestInterval < 0 || !this.#checkConfig(config)){
            throw new ArgsError('RequestManager config is not valid');
        }
        this.requestInterval = requestInterval;
        this.config = config;
        this.lastRequestTime = 0;
    }

    #checkConfig(config){
        if ('autoRetryTimes' in config) {
            if (!Number.isInteger(config.autoRetryTimes) || config.autoRetryTimes < 0) {
                return false;
            }
        } else {
            config.autoRetryTimes = 0;
        }

        if ('timeout' in config) {
            if (!Number.isInteger(config.timeout) || config.timeout < -1) {
                return false;
            }
        } else {
            config.timeout = 10 * 1000;
        }

        if (config.requestAgainCallback) {
            if (typeof config.requestAgainCallback !== 'function') {
                return false;
            }
        } else {
            config.requestAgainCallback = null;
        }

        if (config.errorHandler) {
            if (typeof config.errorHandler !== 'function') {
                return false;
            }
        } else {
            config.errorHandler = (e, rq) => throw e;
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

    margeConfig(config){
        const newConfig = deepMerge(this.config, config);
        if (!this.#checkConfig(config)){
            throw new ArgsError('RequestManager config is not valid');
        } else {
            this.config = newConfig;
        }
    }

    async request(rq, config = {}) {
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
                return await rq.request(this.config.timeout);
            } catch (e) {
                // 今天台式一拉取就开始写了，结果写了半天才想起来昨天笔记本根本没推送！
                // 抱着侥幸心理，我把笔记本上的项目推送了，然后在台式上又拉了一遍，
                // 我还以为会像 code 那样跟我说有冲突呢，结果没有！甚至这个文件里改的这一行也融进去了！今天的新改动也都还在！
                // 看来这里的 git 是精确到行的，不对，精确到上下文的！idea 还是太神奇了！
                logger.warn(t('warn.network.cannotRequest'), rq.getSummary(), e.message);
                if (e instanceof HttpError || e.response?.status) {
                    const status = e instanceof HttpError ? e.status : e.response.status;

                    if (status === 502 || status === 503 || status === 504 || (status === 429 && !mergedConfig.requestAgainCallback)) {
                        if (tryTimes >= mergedConfig.autoRetryTimes + 1) {
                            mergedConfig.errorHandler(e, rq);
                        } else {
                            continue;
                        }
                    }

                    if (status === 429 && mergedConfig.requestAgainCallback) {
                        if (await mergedConfig.requestAgainCallback(e, rq)) {
                            tryTimes = 0;
                            continue;
                        } else {
                            mergedConfig.errorHandler(e, rq);
                        }
                    }

                    mergedConfig.errorHandler(e, rq);
                }

                if (tryTimes > mergedConfig.autoRetryTimes + 1) {
                    mergedConfig.errorHandler(e, rq);
                }

                // 条件满足，继续循环，自动重新请求
            }
        }
    }

    async newRequest(method, url, body = null, headers = null, config = {}) {
        return await this.request(new HttpRequest(method, url, body, headers), config);
    }
}