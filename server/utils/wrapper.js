// 添加超时和重试机制
// 若应用在axios fetch 需要在外层超时时中断内层请求避免占用网络资源，或内层网络请求必须设置且小于外层超时时间
async function callWithTimeoutAndRetry(fn, retries = 3, timeout = 120000) { // 2min
    for (let i = 0; i < retries; i++) {
        const abortController = new AbortController();
        let timeoutId;

        try {
            // 使用 Promise.race 实现超时控制
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    abortController.abort();
                    reject(new Error(`操作超时 (${timeout}ms)`));
                }, timeout);
            });

            const result = await Promise.race([fn(abortController.signal), timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            console.log(`第 ${i + 1} 次尝试失败:`, error.message);
            if (i === retries - 1) {
                throw error;
            }
            // 等待一段时间后重试 指数退避重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            /**
             * // 实际效果
                第1次失败 → 等待 1秒  → 重试
                第2次失败 → 等待 2秒  → 重试
                第3次失败 → 等待 3秒  → 放弃
             */
        }
    }
}


module.exports = {
    callWithTimeoutAndRetry
}