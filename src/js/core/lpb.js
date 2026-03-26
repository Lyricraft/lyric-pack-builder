
const lpbVersion = '0.2.0'

export const AppModule = {
    MC_VERSIONS: 'mcVersions',
}

// 别着急，慢慢来。有的是青春年华，何必争一夜深宵？

export class LpbApp{

    /*
    args: 对象。参数
        configPath: 配置文件路径
        cachePath: 缓存路径

    modules: 数组。启用模块
        mcVersions: MC 版本模块

     */
    constructor(args, modules){
        const {configPath, cachePath} = args;
        this.modules = modules;
    }
}