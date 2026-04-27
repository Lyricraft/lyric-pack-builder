import {ResourceItem} from "./resourceItem.js";
import {parseInnerObj} from "../../parser.js";
import {ResourceLocation} from "../../objects/resourceLocation.js";
import {LPB} from "../../../lpb.js";
import {checkConfigEnum} from "../../checker.js";
import {PlatformResourceContent} from "../../enums.js";
import {ContentFolders} from "../../objects/resourceFolder.js";
import {PubPlatform} from "../../../mc/mcMods.js";

import {VersionedContentReference} from "./platformResourceItem/versionedContentReference/VersionedContentReference.js";
import {} from './platformResourceItem/versionedContentReference/versionedContentReferenceTypes.js'
import {ConfigFieldMissingError} from "../../errors.js";

export class PlatformResourceItem extends ResourceItem {
    static TYPE = 'platform';

    constructor(obj) {
        super(obj);

        this.content = checkConfigEnum(obj.content, 'ResourceItem(type=platform)', 'content',
            'string(PlatformResourceContent)', PlatformResourceContent);

        this.resourceLocation = parseInnerObj(obj, 'ResourceItem(type=platform)', '.',
            (obj2) => ResourceLocation.fromObj(obj2, LPB.prebuildManager.resourceFolderMap,
                new ResourceLocation(LPB.prebuildManager.resourceFolderMap.get(ContentFolders.get(this.content))??null)));

        // 解析平台
        this.platforms = new Map();

        for(const [,platform] of Object.entries(PubPlatform)) {
            if (Object.hasOwn(obj, platform)) {
                this.platforms.set(platform, VersionedContentReference.from(platform, obj[platform]));
            }
        }

        if (this.platforms.size <= 0) {
            throw new ConfigFieldMissingError('ResourceItem(type=platform)', 'modrinth/curseforge');
        }
    }
}