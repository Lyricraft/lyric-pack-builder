import fs from 'node:fs/promises';
import path from 'path';

export function toDirPath(dirPath){
    const sep = path.sep;
    if (!dirPath.endsWith(sep)){
        dirPath = dirPath + sep;
    }
    return dirPath;
}

export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (e) {
        return false;
    }
}

export async function removeDir(dirPath) {
    try {
        await fs.rm(dirPath, {
            recursive: true, // 递归删除子文件/子目录
            force: true, // 目录不存在也不报错
        });
        return true;
    } catch (e) {
        console.error('error.fileSystem.failToDeleteFileMsg', toDirPath(dirPath), e);
        return false;
    }
}

export async function dirExists(dirPath) {
    try {
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
    } catch (e) {
        return false;
    }
}

// 检查是否是【文件】
export async function regularFileExists(filePath) {
    try {
        const stat = await fs.stat(filePath);
        return stat.isFile();
    } catch (e) {
        return false;
    }
}