
export class SinglePackTarget {
    constructor(mcVersion, loader, format) {
        this.mcVersion = mcVersion; // McVersion
        this.loader = loader; // ModLoader
        this.format = format; // PackFormat
    }

    static fromPackTarget(target) {
        const singleTargets = [];
        for (const mcVersion of target.mcVersions) {
            for (const loader of target.loaders) {
                for (const format of target.formats) {
                    singleTargets.push(new SinglePackTarget(mcVersion, loader, format));
                }
            }
        }
        return singleTargets;
    }
}