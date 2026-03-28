import axios from "axios";
import {t} from "../../i18n/translate.js";
import {ModInfo} from "../objects/ModInfo.js";
import {Version} from "../../objects/version.js";
import {PubPlatform, ModLoader, VersionStage} from "../../mc/mcMods.js";
import {ModVersionCollection} from "../objects/ModVersionCollection.js";
import {checkEnum} from "../../public/type.js";
import {ModVersion} from "../objects/ModVersion.js";
import {DependencyInfo} from "../objects/DependencyInfo.js";
import {ModVersionNumber} from "../objects/ModVersionNumber.js";
import {McVersion} from "../../mc/mcVersion.js";
import {ModFile, ModFileHashType} from "../objects/ModFile.js";

const API_BASE = 'https://api.modrinth.com/v2';

export class ModrinthApi {

    async test() {
        const requestUrl = new URL('https://staging-api.modrinth.com/');

        let obj;
        try {
            obj = (await axios.get(requestUrl.toString())).data;
        } catch (error) {
            throw new Error(t('error.network.cannotRequestMsg', requestUrl.toString(), error.message));
        }

        if (!obj.name || !obj.version) {
            throw new Error(t('error.platformApi.invalidTestResponse', PubPlatform.MODRINTH, obj));
        }

        return obj;
    }

    async modInfo(idOrSlug) {
        const requestUrl = new URL(`${API_BASE}/project/${idOrSlug}`);

        let obj;
        try {
            obj = (await axios.get(requestUrl.toString())).data;
        } catch (error) {
            if (error.response?.status === 404) {
                // 没有找到项目
                return null;
            }

            throw new Error(t('error.network.cannotRequestMsg', requestUrl.toString(), error.message));
        }

        return new ModInfo({
            platform: PubPlatform.MODRINTH,
            type: obj.project_type,
            id: obj.id,
            slug: obj.slug,
            title: obj.title,

            clientSide: obj.client_side,
            serverSide: obj.server_side,

            loaders: obj.loaders,
            gameVersions: Array.isArray(obj.game_versions) ? obj.game_versions.map(v => McVersion.parseString(v)) : [],

            publishedAt: Date.parse(obj.published),
            updatedAt: Date.parse(obj.updated),
        });
    }

// 困了，明天再说。

    /*
        args:
            loaders: ModLoader[]
            gameVersions: McVersion[]
            featured: bool
     */
    async modVersions(parent, args = {}) {
        const {loaders, gameVersions, featured} = args;

        const requestUrl = new URL(`${API_BASE}/project/${parent.id}/version`);

        requestUrl.searchParams.set('include_changelog', JSON.stringify(false));

        if (loaders) {
            if (!Array.isArray(loaders)){
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.MODRINTH, 'loaders', 'ModLoader[]', loaders));
            }
            for (const loader of loaders){
                if (!checkEnum(ModLoader, loader)){
                    throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.MODRINTH, 'loaders[*]', 'ModLoader', loader));
                }
            }
            requestUrl.searchParams.set('loaders', JSON.stringify(loaders));
        }

        if (gameVersions) {
            if (!Array.isArray(gameVersions)){
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.MODRINTH, 'gameVersions', 'McVersion[]', gameVersions));
            }
            const versions = [];
            for (const gameVersion of gameVersions){
                if (!(gameVersion instanceof McVersion)){
                    throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.MODRINTH, 'gameVersions[*]', 'McVersion', gameVersion));
                }
                versions.push(gameVersion.toString());
            }
            requestUrl.searchParams.set('game_versions', JSON.stringify(versions));
        }

        if (featured !== undefined) {
            if (typeof featured !== 'boolean'){
                throw new Error(t('error.platformApi.invalidArgsInfo', PubPlatform.MODRINTH, 'featured', 'boolean', featured));
            }
            requestUrl.searchParams.set('featured', JSON.stringify(featured));
        }

        let obj;
        try{
            obj = (await axios.get(requestUrl.toString())).data;
        }
        catch(error){
            if (error.response?.status === 404){
                // 没有找到项目
                throw new Error(t('error.platformApi.invalidProject', PubPlatform.MODRINTH, parent.id));
            }
            throw new Error(t('error.network.cannotRequestMsg', requestUrl.toString(), error.message));
        }

        if (!Array.isArray(obj)){
            throw new Error(t('error.platformApi.invalidResponseMsg', PubPlatform.MODRINTH, obj));
        }

        const array = [];
        for (const item of obj){
            array.push(new ModVersion({
                parent,
                id: item.id,
                versionNumber: ModVersionNumber.parseString(item.version_number),
                versionStage: new VersionStage(item.version_type),
                name: item.name,
                dependencies: Array.isArray(item.dependencies) ? item.dependencies.map(depend =>
                    new DependencyInfo(depend.project_id, depend.dependency_type, depend.version_id ?? "", depend.file_name ?? "")) : [],
                loaders: item.loaders,
                gameVersions: Array.isArray(item.game_versions) ? item.game_versions.map(v => McVersion.parseString(v)) : [],
                files: Array.isArray(item.files) ? item.files.map(file =>
                    new ModFile(file.id, file.url, file.filename, file.size)
                        .setHash(ModFileHashType.SHA1, file.hashes.sha1)
                        .setHash(ModFileHashType.SHA512, file.hashes.sha512)
                ) : [],
                featured: item.featured,
                publishedAt: Date.parse(item.published ?? item.date_published), // 看来 Modrinth 言行不一啊（前面是文档里写的，后面是实际请求发现的）
            }));
        }
        return new ModVersionCollection(array);

    }

}
