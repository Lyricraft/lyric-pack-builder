
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
        if (this.index < this.str.length - 1) {
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
            if (char.length === 0 || !keywordCharRegex.test(char)) {
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
            if (char.length === 0) {
                if (!allowEnd) {
                    return "";
                }
                else {
                    break;
                }
            }
            if (endedRegex.test(char)) {
                break;
            }
            sb.push(char);
        }

        return sb.join("");
    }

    static QUOTES_REGEX = /["']/;

    nextArg(endedRegex, allowEnd = false, quotesRegex = null) {
        if (quotesRegex && quotesRegex.test(this.nowChar())) {
            const quote = this.nowChar();
            if (this.nextChar() === "") {
                return "";
            }
            return this.until(quote);
        }
        return this.until(endedRegex, allowEnd);
    }
}