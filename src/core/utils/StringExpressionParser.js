import {stringUsable} from "../public/type.js";

function stringOrArrayOrRegexTest(template, str) {
    if (Array.isArray(template)) {
        return template.includes(str);
    }
    if (typeof template === 'string') {
        return template === str;
    }
    return template.test(str);
}

export class StringExpressionParser {
    constructor(str) {
        this.str = str;
        this.index = -1;
    }

    nowChar() {
        if (this.index < 0 || this.index >= this.str.length) {
            return "";
        }
        return this.str.substring(this.index, this.index + 1);
    }

    nextChar() {
        // 允许到达最后索引的后一个，以避免边界上的 back() 问题
        if (this.index < this.str.length) {
            this.index++;
            return this.str.substring(this.index, this.index + 1);
        } else {
            return "";
        }
    }

    static INVALID_CHAR_REGEX = /\s/;

    nextValidChar(invalidCharRegex = StringExpressionParser.INVALID_CHAR_REGEX) {
        while (true) {
            const char = this.nextChar();
            if (char === "") {
                return "";
            }
            if (!char.match(invalidCharRegex)) {
                return char;
            }
        }
    }

    back() {
        if (this.index > -1) {
            this.index--;
        }
        return this;
    }

    start() {
        this.index = -1;
        return this;
    }

    isEnded() {
        return this.index >= this.str.length;
    }

    isStarted() {
        return this.index > -1;
    }

    isKeywordBeginning(keywordBeginningRegex = /[a-zA-Z]/) {
        return keywordBeginningRegex.test(this.nowChar());
    }

    static KEYWORD_CHAR_REGEX = /\w/;

    nextKeyword(keywordCharRegex = StringExpressionParser.KEYWORD_CHAR_REGEX) {
        const sb = [];

        while (true) {
            const char = this.nextChar();
            if (!stringUsable(char)) {
                break;
            }
            if (!keywordCharRegex.test(char)) {
                this.back();
                break;
            }
            sb.push(char);
        }

        return sb.join("");
    }

    until(endedRegex, allowEnd = false) {
        const sb = [];

        while (true) {
            const char = this.nextChar();
            if (!stringUsable(char)) {
                if (!allowEnd) {
                    return "";
                }
                else {
                    break;
                }
            }
            if (stringOrArrayOrRegexTest(endedRegex, char)) {
                break;
            }
            sb.push(char);
        }

        return sb.join("");
    }

    static QUOTES_REGEX = /["']/;

    // 如果是引号结束，游标将指向引号，下一个离开表达式
    // 如果是匹配结束正则的东西，游标将指向此东西前一位，下一个离开表达式到此东西
    nextArg(endedRegex, allowEnd = false, quotesRegex = null) {
        const next = this.nextChar();
        if (!stringUsable(next)) {
            return "";
        }
        if (quotesRegex && quotesRegex.test(next)) {
            const quote = next;
            if (!stringUsable(this.nextChar())) {
                return "";
            }
            return this.back().until(quote);
        }
        const result = this.back().until(endedRegex, allowEnd);
        this.back();
        return result;
    }
}