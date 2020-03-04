const enumStatus = [
    "pending",
    "fulfilled",
    "rejected"
];

// extending Promise works only with ES2016 class syntax.
export default class ExposedPromise extends Promise {
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