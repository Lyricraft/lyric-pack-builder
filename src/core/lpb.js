import path from 'path';
import {parseFileConfig} from "./configs/parser.js";
import {ModrinthApi} from "./platforms/modrinth/ModrinthApi.js";
import {HttpRequester} from "./network/HttpRequester.js";
import {CurseforgeApi} from "./platforms/curseforge/CurseforgeApi.js";

const lpbVersion = '0.2.0'

// 别着急，慢慢来。有的是青春年华，何必争一夜深宵？

export class LpbApp{
    constructor(){
        this.version = lpbVersion;

        // builder
        this.builderConfig = null;

        // bootstrap
        this.buildConfigPath = path.join('lpb/builder.yml');

        // prebuild
        this.packYmlPath = path.join('lpb/pack.yml');
        this.listYmlPath = path.join('lpb/list.yml');
        this.resourceDir = path.join('lpb/resourceDir');
        this.datagenDir = path.join('lpb/datagen');
        this.localFileRoot = path.join('./');
        this.ncpDir = path.join('.lpb/ncp');

        // platforms
        this.modrinthApi = null;
        this.curseforgeApi = null;

        // pack
        // ncpDir 已定义
        this.distDirs = {
            default: path.join('dist'),
            modrinth: path.join('modrinth'),
            curseforge: path.join('curseforge'),
        }
    }

    /*
        模块大全

        请务必核对准确。不会专门做值校验！

        builder：
            string builderConfigPath

        bootstrap:
            string buildConfigPath

        prebuild:
            string packYmlPath
            string listYmlPath
            string resourceDir
            string datagenDir
            string localFileRoot
            string ncpDir

        platforms:
            object modrinth:
                int requestInterval (0-60000)
                int autoRetryTimes (0-3)
            object curseforge:
                int requestInterval (0-60000)
                int autoRetryTimes (0-3)
                string apiKey

        pack:
            string ncpDir
            object dist:
                string default
                string [format] (format dist dir)
     */
    async load(models){
        // builder
        if (models.builder) {
            this.builderConfig = await parseFileConfig(models.builder.builderConfigPath);
        }

        // bootstrap
        if (models.bootstrap) {
            this.buildConfigPath = models.bootstrap.buildConfigPath ?? this.buildConfigPath;
        }

        // prebuild
        if (models.prebuild) {
            this.packYmlPath = models.prebuild.packYmlPath ?? this.packYmlPath;
            this.listYmlPath = models.prebuild.listYmlPath ?? this.listYmlPath;
            this.resourceDir = models.prebuild.resourceDir ?? this.resourceDir;
            this.datagenDir = models.prebuild.datagenDir ?? this.datagenDir;
            this.localFileRoot = models.prebuild.localFileRoot ?? this.localFileRoot;
            this.ncpDir = models.prebuild.ncpDir ?? this.ncpDir;
        }

        // platforms
        if (models.platforms) {
            if (models.platforms.modrinth) {
                this.modrinthApi = new ModrinthApi(
                    new HttpRequester(models.platforms.modrinth.requestInterval,
                        {autoRetryTimes: models.platforms.modrinth.autoRetryTimes})
                );
            }
            if (models.platforms.curseforge) {
                this.curseforgeApi = new CurseforgeApi(
                    new HttpRequester(models.platforms.curseforge.requestInterval,
                        {autoRetryTimes: models.platforms.curseforge.autoRetryTimes}),
                    models.platforms.curseforge.apiKey
                );
            }
        }

        // pack
        if (models.pack) {
            this.ncpDir = models.pack.ncpDir ?? this.ncpDir;
            if (models.pack.dist) {
                for (const key in models.pack.dist) {
                    this.distDirs[key] = models.pack.dist[key];
                }
            }
        }
    }
}

export const LPB = new LpbApp();