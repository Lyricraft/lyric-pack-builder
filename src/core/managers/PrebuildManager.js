import {DEFAULT_FOLDER_MAP} from "../configs/objects/resourceFolder.js";

export class PrebuildManager {
    constructor() {
        this.resourceFolderMap = null;
    }

    initResourceFolderMap() {
        this.resourceFolderMap = new Map(DEFAULT_FOLDER_MAP);
    }
}