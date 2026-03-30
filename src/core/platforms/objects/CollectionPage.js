
export class CollectionPage {

    constructor(collection, index, pageSize, total, requestArg) {
        this.collection = collection;
        this.index = index;
        this.page = pageSize;
        this.total = total;
        this.requestArg = requestArg;
    }

    maxPageSize() {
        return Math.ceil(this.total / this.page);
    }

    async nextPage() {
        if (this.page >= this.maxPageSize() - 1) {
            return null;
        }
        return await this.requestNext();
    }

    async requestNext() {
        return null;
        // to be overridden
    }
}