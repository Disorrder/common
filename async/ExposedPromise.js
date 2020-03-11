const enumStatus = [
    "pending",
    "fulfilled",
    "rejected"
];

export default function createExposedPromise() {
    let __resolve, __reject;
    let promise = new Promise((resolve, reject) => {
        __resolve = resolve;
        __reject = reject;
    });

    promise.resolve = __resolve;
    promise.reject = __reject;
    promise.status = 0;

    return promise.then(
        (data) => {
            promise.status = 1;
            return data;
        },
        (error) => {
            promise.status = 2;
            throw error;
        }
    );
}


// extending Promise works only with ES2016 class syntax.
// Bug: promise.then() throws type error!
class ExposedPromise extends Promise {
    constructor() {
        let resolve, reject;
        super((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        
        this.status = 0;

        this.resolve = () => {
            this.status = 1;
            return resolve(...arguments);
        };
        this.reject = () => {
            this.status = 2;
            return reject(...arguments);
        };
    }

    get statusStr() { return enumStatus[this.status]; }
}

