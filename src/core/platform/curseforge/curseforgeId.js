import {McContent, ModLoader, VersionStage, VersionStageName} from "../../mc/mcMods.js";
import {BiMap} from "../../public/type.js";
import {DependencyType} from "../objects/DependencyInfo.js";

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

const relationTypeMap = new Map()
    .set(3, DependencyType.REQUIRED) // Required Dependency
    .set(2, DependencyType.OPTIONAL) // Optional Dependency
    .set(4, DependencyType.OPTIONAL) // Tool
    .set(1, DependencyType.EMBEDDED) // Embedded Library
    .set(6, DependencyType.EMBEDDED) // Include
    .set(5, DependencyType.INCOMPATIBLE); // Incompatible

export function curseforgeRelationT2DependencyT(relationT) {
    return relationTypeMap.get(relationT) ?? DependencyType.REQUIRED;
}

export function dependencyT2CurseforgeRelationT(dependencyT) {
    for (const [relationT, dependencyType] of relationTypeMap.entries()) {
        // 从上往下搜索，返回第一个值。
        if (dependencyType === dependencyT) {
            return relationT;
        }
    }
    return 3;
}