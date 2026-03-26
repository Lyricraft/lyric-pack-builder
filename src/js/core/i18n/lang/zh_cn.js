export default {
    'error.translate.missingArgs': '[翻译] 键 $ 的翻译参数不足',
    'error.translate.invalidArgs': '[翻译] 键 $ 的翻译参数无效',
    'error.translate.extraArgs': '[翻译] 键 $ 存在未使用的多余参数',

    'error.versionType.constructorArgsTooShort': '版本类型构造至少需要两级版本号，但目前仅提供了：$',
    'error.versionType.invalidConstructorArgs': '版本类型构造的各级版本号应当皆为整数，但目前存在非法值：$',
    'error.versionType.invalidVersionString': '无效的版本字符串：$',

    'error.versionRangeType.invalidConstructorVersionArg': '版本范围构造的版本参数需要是 Version 类型或 null，但 $ 侧出现了：$',
    'error.versionRangeType.includesInfiniteEndpoint': '版本范围的无穷端点不能被包含，但是它发生在了区间 $ 侧',
    'error.versionRangeType.invalidInterval': '区间不合法或一定无法取到任何值：$',
    'error.versionRangeType.invalidRangeString': '无效的版本区间字符串：$',
    'error.versionRangeType.invalidRangeStringMsg': '版本区间字符串 $ 无效：\n$',
    'error.versionRangeType.notAVersion': '用于区间检查的参数必须是一个 Version 实例，但提供了：$',

    'error.network.cannotRequestMsg': '请求 URL "$" 失败：\n$',

    'error.modrinthApi.invalidTestResponseMsg': '测试 Modrinth API 时，服务器返回了无效的结果：$',
    'error.modrinthApi.invalidResponseMsg': 'Modrinth API 返回的结果无效：\n$',

    'error.fileSystem.failToDeleteFile': '无法删除文件：$',
}