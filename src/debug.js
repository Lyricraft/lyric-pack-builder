import {ModrinthApi} from "./core/platform/modrinth/ModrinthApi.js";
import {ModLoader} from "./core/mc/mcMods.js";
import {Version, VERSION_PATTERN} from "./core/objects/version.js";
import {McVersion, ReleaseMcVersion} from "./core/mc/mcVersion.js";
import {
    ModVersionCollection,
    ModVersionCollectionFilterCriteria
} from "./core/platform/objects/ModVersionCollection.js";


const modrinth = new ModrinthApi();
const mod = await modrinth.modInfo('jade');
console.log(mod);
const versions = await modrinth.modVersions(mod, {loaders: [ModLoader.NEOFORGE]});
console.log(versions);
const fd = versions.filter({[ModVersionCollectionFilterCriteria.GAME_VERSION]: McVersion.parseString('1.21.1')})
console.log(fd);