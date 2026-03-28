import {ModrinthApi} from "./core/platform/modrinth/ModrinthApi.js";
import {ModLoader, VersionStage, VersionStageName} from "./core/mc/mcMods.js";
import {Version, VERSION_PATTERN} from "./core/objects/version.js";
import {McVersion, ReleaseMcVersion} from "./core/mc/mcVersion.js";
import {
    ModVersionCollection,
    ModVersionCollectionFilterCriteria
} from "./core/platform/objects/ModVersionCollection.js";


const modrinth = new ModrinthApi();
const mod = await modrinth.modInfo('create');
console.log(mod);
const versions = await modrinth.modVersions(mod, {loaders: [ModLoader.NEOFORGE], gameVersions: [McVersion.parseString('1.21.1')]});
console.log(versions);
const fd = versions.filter({[ModVersionCollectionFilterCriteria.VERSION_STAGE]: new VersionStage(VersionStageName.RELEASE)})
console.log(fd);
const max = versions.getLatest();
console.log(max);