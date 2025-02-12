// 定义 Promise 的三种状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
    constructor(executor) {
        // 初始状态为 pending
        this.status = PENDING;
        // 存储成功的值
        this.value = undefined;
        // 存储失败的原因
        this.reason = undefined;
        // 存储成功回调
        this.onFulfilledCallbacks = [];
        // 存储失败回调
        this.onRejectedCallbacks = [];

        const resolve = (value) => {
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                // 依次执行成功回调
                this.onFulfilledCallbacks.forEach((callback) => callback());
            }
        };

        const reject = (reason) => {
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                // 依次执行失败回调
                this.onRejectedCallbacks.forEach((callback) => callback());
            }
        };

        try {
            // 执行 executor 函数，传入 resolve 和 reject
            executor(resolve, reject);
        } catch (error) {
            // 如果 executor 执行出错，调用 reject
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        // 处理 onFulfilled 不是函数的情况
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value;
        // 处理 onRejected 不是函数的情况
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason; };

        const newPromise = new MyPromise((resolve, reject) => {
            const handleFulfilled = () => {
                try {
                    const x = onFulfilled(this.value);
                    // 处理 then 方法返回值，根据规范判断是否递归解析
                    resolvePromise(newPromise, x, resolve, reject);
                } catch (error) {
                    reject(error);
                }
            };

            const handleRejected = () => {
                try {
                    const x = onRejected(this.reason);
                    // 处理 then 方法返回值，根据规范判断是否递归解析
                    resolvePromise(newPromise, x, resolve, reject);
                } catch (error) {
                    reject(error);
                }
            };

            if (this.status === FULFILLED) {
                // 如果状态已经是 fulfilled，异步执行成功回调
                setTimeout(handleFulfilled, 0);
            } else if (this.status === REJECTED) {
                // 如果状态已经是 rejected，异步执行失败回调
                setTimeout(handleRejected, 0);
            } else if (this.status === PENDING) {
                // 如果状态还是 pending，将回调存储起来
                this.onFulfilledCallbacks.push(() => setTimeout(handleFulfilled, 0));
                this.onRejectedCallbacks.push(() => setTimeout(handleRejected, 0));
            }
        });

        return newPromise;
    }

    all(promises) {
        return new MyPromise((resolve, reject) => {
            const result = [];
            let count = 0;

            promises.forEach((promise, index) => {
                promise.then((value) => {
                    result[index] = value;
                    count++;
                    if (count === promises.length) {
                        resolve(result);
                    }
                }, reject);
            });
        });

    }
}

function resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
        return reject(new TypeError('Chaining cycle detected for promise'));
    }

    let called = false;

    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        try {
            const then = x.then;
            if (typeof then === 'function') {
                then.call(
                    x,
                    (y) => {
                        if (called) return;
                        called = true;
                        // 递归解析返回的 promise
                        resolvePromise(promise, y, resolve, reject);
                    },
                    (r) => {
                        if (called) return;
                        called = true;
                        reject(r);
                    }
                );
            } else {
                resolve(x);
            }
        } catch (error) {
            if (called) return;
            called = true;
            reject(error);
        }
    } else {
        resolve(x);
    }
}

// 以下是测试代码
const promise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve(100);
    }, 1000);
});

promise.then((value) => {
    console.log('First then:', value);
    return value * 2;
}).then((value) => {
    console.log('Second then:', value);
    return new MyPromise((resolve) => {
        setTimeout(() => {
            resolve(value + 50);
        }, 1000);
    });
}).then((value) => {
    console.log('Third then:', value);
});


module.exports = MyPromise;