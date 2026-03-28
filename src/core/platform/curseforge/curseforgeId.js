import {McContent, ModLoader, VersionStage, VersionStageName} from "../../mc/mcMods.js";
import {BiMap} from "../../public/type.js";

/*
    低质量垃圾 API 的绝佳范例。
 */

export const CURSEFORGE_GAME_ID = 432; // Minecraft

export const curseforgeClassIdBiMap = new BiMap()
    .set(McContent.MOD, 6)
    .set(McContent.RESOURCEPACK, 12)
    .set(McContent.SHADER, 4546)
    .set(McContent.MODPACK, 17)
    .set(McContent.SAVE, 4471);

export const curseforgeReleaseTypeBiMap = new BiMap()
    .set(VersionStageName.RELEASE, 1)
    .set(VersionStageName.BETA, 2)
    .set(VersionStageName.ALPHA, 3);

export const curseforgeLoaderTypeBiMap = new BiMap()
    .set(ModLoader.FORGE, 1)
    .set(ModLoader.FABRIC, 4)
    .set(ModLoader.QUILT, 5)
    .set(ModLoader.NEOFORGE, 6);