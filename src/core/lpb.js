import path from 'path';
import {parseFileYaml} from "./configs/parser.js";

const lpbVersion = '0.2.0'

// 别着急，慢慢来。有的是青春年华，何必争一夜深宵？

export class LpbApp{
    constructor(){
        this.version = lpbVersion;

        // builder
        this.builderConfig = null;

        // prebuild
        this.packYmlPath = path.join('lpb/pack.yml');
        this.listYmlPath = path.join('lpb/list.yml');
        this.resourceDir = path.join('lpb/resourceDir');
        this.datagenDir = path.join('lpb/datagen');
        this.localFileRoot = path.join('./');
        this.ncpDir = path.join('.lpb/ncp');

        // platforms
        this.modrinthApi = null;
        this.modrinthManager = null;
        this.curseforgeApi = null;
        this.curseforgeManager = null;
    }

    /*
        模块大全

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
            bool modrinth
            string curseforgeApiKey

        pack:
            string ncpDir
            object dist:
                string default
                string [format] (format dist dir)
     */
    async load(models){
        // builder
        if (models.builder) {
            this.builderConfig = await parseFileYaml(models.builder.builderConfigPath);
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

        }
    }
}

export const LPB = new LpbApp();