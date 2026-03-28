import 'dotenv/config'
import {CurseforgeApi} from "./core/platform/curseforge/CurseforgeApi.js";
import {McVersion} from "./core/mc/mcVersion.js";
import {ModLoader} from "./core/mc/mcMods.js";

const curseforge = new CurseforgeApi(process.env.CURSEFORGE_API_KEY)

const mod = await curseforge.modInfoFromSlug('sodium');
console.log(mod);
const versions = await curseforge.modVersions(mod, {gameVersions: [McVersion.parseString('1.21.1')], loader: ModLoader.NEOFORGE});
console.log(versions);