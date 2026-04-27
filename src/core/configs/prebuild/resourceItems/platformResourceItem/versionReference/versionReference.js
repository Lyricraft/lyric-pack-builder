
export class VersionReference {
    constructor(contentReference = null) {
        this.content = contentReference;
    }

    requireContentReference() {
        return true;
    }
}