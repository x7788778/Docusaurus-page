/**
 * @Date: 2025-02-12 16:25:26
 * @LastEditors: zhaogang 156606672@qq.com
 * @LastEditTime: 2025-02-12 16:28:31
 * @FilePath: /my-website/test/test.js
 * @name: filename
 * @description: description
 */
// test.js
// 供测试工具‘promises-aplus-tests’使用的适配器
const MyPromise = require('../src/somecode/myPromise');

// 包装 MyPromise 以符合测试工具的要求
const adapter = {
    resolved: function (value) {
        return new MyPromise((resolve) => resolve(value));
    },
    rejected: function (reason) {
        return new MyPromise((_, reject) => reject(reason));
    },
    deferred: function () {
        let resolve, reject;
        const promise = new MyPromise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return {
            promise,
            resolve,
            reject
        };
    }
};

module.exports = adapter;