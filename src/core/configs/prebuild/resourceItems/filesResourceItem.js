import {ResourceItem} from "./resourceItem.js";
import {parseInnerObj} from "../../parser.js";
import {ResourceLocation} from "../../objects/resourceLocation.js";
import {checkConfigArray, checkConfigEnum, checkConfigStringType} from "../../checker.js";
import {LocalFileSelection} from "../../objects/LocalFileSelection.js";
import {ConfigFieldError, ConfigFieldTypeError} from "../../errors.js";
import {stringUsable} from "../../../public/type.js";
import {t} from "../../../i18n/translate.js";
import {Condition} from "../../objects/conditions.js";

export const CompressTypeOption = {
    NONE: 'none',
    ZIP: 'zip',
}

export const CompressTypeOptionExtension = new Map()
    .set(CompressTypeOption.NONE, "")
    .set(CompressTypeOption.ZIP, '.zip');

class FilesResourceItemFileItem {

    constructor(obj, folderMap) {

        checkConfigStringType(obj.file, 'File', 'file')
        try {
            this.file = LocalFileSelection.fromString(obj.file);
        } catch (e) {
            throw new ConfigFieldTypeError('File', 'file', 'string(FilePathWithWildcard)', obj.file);
        }

        this.compress = checkConfigEnum(obj.compress, 'File', 'compress',
            'CompressType', CompressTypeOption, CompressTypeOption.NONE);

        this.resourceLocation = parseInnerObj(obj, 'File', "",
            rl => ResourceLocation.fromObj(rl, folderMap, new ResourceLocation(null,
                this.file.suggestedFilename() + CompressTypeOptionExtension.get(this.compress))));

        this.condition = parseInnerObj(obj.condition, 'File', 'conditions',
            Condition.fromString, Condition.always());
    }
}

export class FilesResourceItem extends ResourceItem {
    static TYPE = 'files';

    constructor(obj, folderMap) {
        super(obj);

        this.files = [];

        let objFiles;

        if (Object.hasOwn(obj, 'files')) {
            objFiles = checkConfigArray(obj.files, 'ResourceItem(type=files)', 'files');
        } else {
            if (Object.hasOwn(obj, 'conditions')) {
                throw new ConfigFieldError('ResourceItem(type=files)', "",
                    t('error.configs.invalidKey', 'conditions', '.'));
            }
            objFiles = [obj];
        }

        for(const objItem of objFiles) {
            this.files.push(parseInnerObj(objItem, 'ResourceItem(type=files)',
                `files[${stringUsable(objItem.file) ? `file=${objItem.file}` : '?'}]`,
                objFile => new FilesResourceItemFileItem(objFile, folderMap)));
        }
    }
}