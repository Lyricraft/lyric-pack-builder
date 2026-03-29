import { createFile, fileExists, regularFileExists } from "../public/fileSystem.js";
import fs from "node:fs/promises";
import fss from "node:fs";
import path from "path";
import { t } from "../i18n/translate.js";

class FileLogger {
    constructor() {
        this.stream = null;
        this.isStreamReady = false;
        this.isClosing = false; // 防止重复关闭
    }

    async setFile(filePath) {
        // 防止重复初始化
        if (this.stream) {
            this.endStream();
        }

        // 确保目录存在
        const dir = path.dirname(filePath);
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (e) {
            throw new Error(t('error.fileSystem.failToCreateDirectoryMsg', dir, e));
        }

        // 创建写入流
        return new Promise((resolve, reject) => {
            const writeStream = fss.createWriteStream(filePath, {
                encoding: "utf8",
                flags: "a",
            });

            writeStream.on("open", () => {
                this.stream = writeStream;
                this.isStreamReady = true;
                this.isClosing = false;
                resolve();
            });

            writeStream.on("error", (err) => {
                this.stream = null;
                this.isStreamReady = false;
                reject(new Error('[FileLogger] ' + t('error.fileSystem.failToWriteFileMsg', filePath, err)));
            });
        });
    }

    endStream() {
        if (!this.stream || this.isClosing) return;

        this.isClosing = true;
        this.isStreamReady = false;

        try {
            this.stream.end();
        } catch (e) {}

        this.stream = null;
    }

    // 安全写入（处理背压 + 防止崩溃）
    #safeWrite(data) {
        if (!this.stream || !this.isStreamReady || this.isClosing) return false;

        try {
            const canWrite = this.stream.write(data);
            // 背压：缓冲区满时等待 drain
            if (!canWrite) {
                return new Promise(resolve => {
                    this.stream.once('drain', resolve);
                });
            }
        } catch (e) {}

        return true;
    }

    log(level, ...args) {
        const line = `[${new Date().toISOString()}] [${level}] ${args.join(' ')}\n`;
        this.#safeWrite(line);
    }

    // 同步强制刷入日志（崩溃/退出前必须用）
    flushSync() {
        if (!this.stream) return;
        try {
            this.stream.write('\n'); // 触发缓冲区刷新
            fss.fsyncSync(this.stream.fd); // 强制写入磁盘
        } catch (e) {}
    }
}

export const FILE_LOGGER = new FileLogger();

// 正常退出
process.on('exit', () => {
    FILE_LOGGER.endStream();
});

// 未捕获异常（必须同步刷日志，否则会丢）
process.on('uncaughtException', (err) => {
    FILE_LOGGER.log('FATAL', '未经捕获的异常，程序将停止。Uncaught exception, shutting down.');
    FILE_LOGGER.log('FATAL', err.stack);
    FILE_LOGGER.flushSync(); // 关键：崩溃前必须同步刷入
    FILE_LOGGER.endStream();
    process.exit(1);
});

// SIGINT Ctrl+C
process.on('SIGINT', () => {
    FILE_LOGGER.log('SHUT', '用户使用 Ctrl + C 停止程序。User stopped the program by ^C.');
    FILE_LOGGER.flushSync();
    FILE_LOGGER.endStream();
    process.exit(0);
});

// SIGTERM 部署工具停止服务
process.on('SIGTERM', () => {
    FILE_LOGGER.log('SHUT', '程序收到 SIGTERM 信号，正在优雅退出。Sigterm signal received, shutting down.');
    FILE_LOGGER.flushSync();
    FILE_LOGGER.endStream();
    process.exit(0);
});