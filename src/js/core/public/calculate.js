export class CompareResult {
    constructor(num) {
        this.num = num;
    }

    equal() {
        return this.num === 0;
    }

    notEqual() {
        return this.num !== 0;
    }

    greater() {
        return this.num > 0;
    }

    less() {
        return this.num < 0;
    }

    notGreater() {
        return this.num <= 0;
    }

    notLess() {
        return this.num >= 0;
    }
}

export function divMod(a, b) {
    if (a < 0 || b <= 0) return {quotient: NaN, remainder: NaN};
    const quotient = Math.floor(a / b);
    const remainder = a - quotient * b;
    return {quotient, remainder};
}

export function getRandomIntId(length = 10) {
    let id = '';
    for (let i = 0; i < length; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}