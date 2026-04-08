import axios from "axios";

export const HttpRequestMethod = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
}

export class HttpRequest {
    // url 是 string，不是 URL 对象！
    constructor(method, url, body = null, headers = null) {
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.body = body;
    }

    async request(timeout = -1) {
        const axiosArg = {
            method: this.method,
            url: this.url,
        };
        if (this.body) {
            axiosArg.data = this.body;
        }
        if (this.headers) {
            axiosArg.headers = this.headers;
        }
        if (timeout && timeout > 0) {
            axiosArg.timeout = timeout;
        }
        return await axios(axiosArg);
    }

    // 获取不带参数的 url
    getSummary() {
        return this.url.replace(/\?.*/, '');
    }
}