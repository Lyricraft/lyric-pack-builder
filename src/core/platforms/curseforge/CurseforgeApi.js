import axios from "axios";
import {t} from "../../i18n/translate.js";
import {McContent, ModLoader, ModSideSupport, PubPlatform, VersionStage, VersionStageName} from "../../mc/mcMods.js";
import {
    CURSEFORGE_GAME_ID,
    curseforgeClassIdBiMap, curseforgeHashAlgo,
    curseforgeLoaderTypeBiMap, curseforgeRelationT2DependencyT,
    curseforgeReleaseTypeBiMap
} from "./curseforgeId.js";
import {checkEnum, stringUsable} from "../../public/type.js";
import {HttpError} from "../../network/HttpError.js";
import {ModInfo} from "../objects/ModInfo.js";
import {ModVersion} from "../objects/ModVersion.js";
import {ModVersionNumber} from "../objects/ModVersionNumber.js";
import {Version, VERSION_PATTERN} from "../../objects/versions.js";
import {ModVersionCollection} from "../objects/ModVersionCollection.js";
import {CurseforgeModVersionPage} from "./CurseforgeModVersionPage.js";
import {DependencyInfo, DependencyType} from "../objects/DependencyInfo.js";
import {ModFile} from "../objects/ModFile.js";
import logger from "../../log/logger.js";

export const INVALID_CURSEFORGE_API_KEY_ERROR = 'invalidCurseforgeApiKey';
const API_BASE = 'https://api.curseforge.com/v1';

export class CurseforgeApi {
    constructor(key) {
        this.setKey(key);
    }

    setKey(key) {
        this.key = key;
        this.requestConfig = {
            headers: {
                'x-api-key': key,
            }
        };
    }

    async #request(url, config = this.requestConfig) {
        let result;
        try {
            result = (await axios.get(url.toString(), config));
        } catch (e) {
            if (e.response){
                if (e.response.status === 403 || e.response.status === 401) {
                    throw new HttpError(t('error.curseforge.invalidApiKey'), e.response.status);
                }
                if (e.response.status === 404) {
                    throw new HttpError(t('error.platformApi.invalidProject"', PubPlatform.CURSEFORGE, url), 404);
                }
                throw new HttpError(t('error.network.cannotRequestMsg', url.toString(), e), e.response.status);
            }
            throw new Error(t('error.network.cannotRequestMsg', url.toString(), e));
        }
        return result;
    }

    #urlWithGameId(str) {
        const url = new URL(str);
        url.searchParams.set('gameId', CURSEFORGE_GAME_ID.toString());
        return url;
    }

    async test(){
        const requestUrl = new URL(`${API_BASE}/games/${CURSEFORGE_GAME_ID}`);

        const obj = (await this.#request(requestUrl)).data;

        if (!obj.data || obj.data.id !== CURSEFORGE_GAME_ID || !stringUsable(obj.data.slug)) {
            throw new Error(t('error.platformApi.invalidTestResponseMsg', PubPlatform.MODRINTH, obj));
        }

        return obj;
    }

    async modInfoFromSlug(slug, contentType) {

        if (!checkEnum(McContent, contentType) || contentType === McContent.DATAPACK) {
            throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.CURSEFORGE, 'contentType', 'ContentType (except Datapack)', contentType));
        }

        const requestUrl = this.#urlWithGameId(`${API_BASE}/mods/search`);
        requestUrl.searchParams.set('slug', slug);
        requestUrl.searchParams.set('classId', curseforgeClassIdBiMap.get(contentType).toString());

        let obj;
        try {
            obj = (await this.#request(requestUrl)).data;
        } catch (e) {
            if (e.status === 404) {
                return null;
            } else {
                throw e;
            }
        }

        if (!Array.isArray(obj.data) || obj.data.length !== 1 || obj.data[0].slug !== slug) {
            return null;
        }
        return this.#modInfo(obj.data[0]);
    }

    async modInfoFromId(id) {
        const requestUrl = this.#urlWithGameId(`${API_BASE}/mods/${id}`);

        let obj;
        try {
            obj = (await this.#request(requestUrl)).data;
        } catch (e) {
            if (e.status === 404) {
                return null;
            } else {
                throw e;
            }
        }

        return this.#modInfo(obj);
    }

    #modInfo(obj){
        let modInfo;
        try {
            modInfo = new ModInfo({
                platform: PubPlatform.CURSEFORGE,
                type: curseforgeClassIdBiMap.getKey(obj.classId),
                id: obj.id.toString(),
                slug: obj.slug,
                title: obj.name,
                clientSide: ModSideSupport.UNKNOWN,
                serverSide: ModSideSupport.UNKNOWN,
                loaders: [],
                gameVersions: [],
                publishedAt: Date.parse(obj.dateCreated),
                updatedAt: Date.parse(obj.dateReleased),
            });
        } catch (e) {
            logger.warn(t('warn.platformApi.invalidResponse', 'curseforge', 'modInfo', e.message));
            modInfo = null;
        }
        return modInfo;
    }

    /*
        gameVersions: McVersion[]
        loader: ModLoader
        versionStage: VersionStage

        一定按发布日期降序排列
     */
    async modVersions(parent, args = {}, index = 0) {
        const {gameVersions, loader, versionStage} = args;

        const requestUrl = this.#urlWithGameId(`${API_BASE}/mods/${parent.id}/files`);
        requestUrl.searchParams.set('pageSize', '50');
        requestUrl.searchParams.set('index', index.toString());
        requestUrl.searchParams.set('sortField', 'dataCreated');
        requestUrl.searchParams.set('sortOrder', 'desc');

        if (gameVersions) {
            if (!Array.isArray(gameVersions)){
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.CURSEFORGE, 'gameVersions', 'McVersion[]', gameVersions));
            }
            let versions;
            try {
                versions = gameVersions.map(version => version.toString())
            } catch (e) {
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.CURSEFORGE, 'gameVersions', 'McVersion[]', gameVersions));
            }
            if (versions.length > 1) {
                requestUrl.searchParams.set('gameVersions', versions.join(','));
            } else if (versions.length === 1) {
                requestUrl.searchParams.set('gameVersion', versions[0]);
            }
        }

        if (loader) {
            if (!checkEnum(ModLoader, loader)){
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.CURSEFORGE, 'loader', 'ModLoader', loader));
            }
            requestUrl.searchParams.set('modLoaderType', curseforgeLoaderTypeBiMap.get(loader).toString());
        }

        if (versionStage) {
            if (!versionStage instanceof VersionStage || versionStage.toString() === VersionStageName.UNKNOWN) {
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.CURSEFORGE, 'versionStage', 'VersionStage (except Unknown)', versionStage));
            }
            requestUrl.searchParams.set('releaseType', curseforgeReleaseTypeBiMap.get(versionStage.toString()).toString());
        }

        const obj = (await this.#request(requestUrl)).data;

        if (!Array.isArray(obj.data)) {
            throw new Error(t('error.platformApi.invalidResponseMsg', PubPlatform.CURSEFORGE, obj));
        }

        const array = [];
        for (const item of obj.data) {
            let modVersion;
            try {
                modVersion = new ModVersion({
                    parent,
                    id: item.id.toString(),
                    versionNumber: ModVersionNumber.parseString(item.displayName),
                    versionStage: new VersionStage(curseforgeReleaseTypeBiMap.getKey(item.releaseType)),
                    name: item.displayName,
                    dependencies: (Array.isArray(item.dependencies)) ?
                        item.dependencies.map(denpendency => new DependencyInfo(
                            denpendency.modId.toString(), curseforgeRelationT2DependencyT(denpendency.relationType)
                        )) : [],
                    loaders: (() => {
                        const loaders = [];
                        for (let maybeLoader of item.gameVersions) {
                            maybeLoader = maybeLoader.toLowerCase();
                            if (checkEnum(ModLoader, maybeLoader)) {
                                loaders.push(maybeLoader);
                            }
                        }
                        if (loaders.length === 0) {
                            throw new Error(t('error.platformApi.DataMissingMsg', PubPlatform.CURSEFORGE, 'loaders', item));
                        }
                        return loaders;
                    })(),
                    gameVersions: (() => {
                        const gameVersions = [];
                        for (let maybeVersion of item.gameVersions) {
                            if (VERSION_PATTERN.test(maybeVersion)) {
                                gameVersions.push(Version.fromString(maybeVersion));
                            }
                        }
                        if (gameVersions.length === 0) {
                            throw new Error(t('error.platformApi.DataMissingMsg', PubPlatform.CURSEFORGE, 'gameVersions', item));
                        }
                        return gameVersions
                    })(),
                    files: [(() => {
                        const file = new ModFile(item.id.toString(), item.downloadUrl, item.fileName, item.fileLength);
                        for (const hash of item.hashes) {
                            file.setHash(curseforgeHashAlgo.getKey(hash.algo), hash.value);
                        }
                        return file;
                    })()],
                    featured: false,
                    publishedAt: Date.parse(item.fileDate),
                });
            } catch (e) {
                logger.warn(t('warn.platformApi.invalidResponse', 'curseforge', 'modVersion', e.message));
                modVersion = null;
            }
            if (modVersion) {
                array.push(modVersion);
            }
        }

        return new CurseforgeModVersionPage(new ModVersionCollection(array), obj.pagination.index, obj.pagination.totalCount, args);
    }
}