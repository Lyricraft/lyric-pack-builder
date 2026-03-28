
export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitUntil(checkFunc, checkInterval = 100, timeout = 0) {
    const startedAt = Date.now();
    while (true) {
        if (checkFunc()) {
            return true;
        }
        if (timeout > 0 && Date.now() - startedAt > timeout) {
            return false;
        }
        await sleep(checkInterval);
    }
}