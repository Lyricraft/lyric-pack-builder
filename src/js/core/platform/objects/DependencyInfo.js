
export const DependencyType = {
    REQUIRED: 'required',
    OPTIONAL: 'optional',
    INCOMPATIBLE: 'incompatible',
    EMBEDDED: 'embedded',
}

export class DependencyInfo {
    constructor(projectId, dependencyType, versionId = "", fileName = "") {
        this.projectId = projectId;
        this.dependencyType = dependencyType; // DependencyType
        this.versionId = versionId;
        this.fileName = fileName;
    }
}