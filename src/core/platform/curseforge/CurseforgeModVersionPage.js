import {CollectionPage} from "../objects/CollectionPage.js";

export class CurseforgeModVersionPage extends CollectionPage {
    constructor(collection, index, total, requestArg) {
        super(collection, index, 50, total, requestArg);
    }

    async requestNext() {

    }
}