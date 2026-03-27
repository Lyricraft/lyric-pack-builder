import axios from "axios";
import {t} from "../../i18n/translate.js";
import {ModInfo} from "../objects/ModInfo.js";
import {Version} from "../../objects/version.js";
import {PubPlatform, ModLoader} from "../../mc/mcMods.js";

export class ModrinthApi {

    async test(){
        const requestUrl = new URL('https://staging-api.modrinth.com/');

        let obj;
        try{
            obj = (await axios.get(requestUrl.toString())).data;
        }
        catch(error){
            throw new Error(t('error.network.cannotRequestMsg', requestUrl.toString(), error.message));
        }

        if (!obj.name || !obj.version){
            throw new Error(t('error.modrinthApi.invalidTestResponse', obj));
        }

        return obj;
    }

    async modInfo(idOrSlug){
        const requestUrl = new URL(`https://api.modrinth.com/v2/project/${idOrSlug}`);

        let obj;
        try{
            obj = (await axios.get(requestUrl.toString())).data;
        }
        catch(error){
            if (error.response?.status === 404){
                // 没有找到项目
                return null;
            }

            throw new Error(t('error.network.cannotRequestMsg', requestUrl.toString(), error.message));
        }

        return new ModInfo({
            platform : PubPlatform.MODRINTH,
            type : obj.project_type,
            id : obj.id,
            slug : obj.slug,
            title : obj.title,

            clientSide : obj.client_side,
            serverSide : obj.server_side,

            loaders : obj.loaders,
            gameVersions : Array.isArray(obj.game_versions) ? obj.game_versions.map(v => Version.fromString(v)) : [],

            publishedAt : Date.parse(obj.published),
            updatedAt : Date.parse(obj.updated),
        });
    }

}

// 困了，明天再说。
