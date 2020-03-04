import ExposedPromise from "./ExposedPromise";

export default class AsyncQueue { // or Loader?
    constructor() {
        this.items = [];
        this.promise = new ExposedPromise();

        this.fulfilled = [];
        this.rejected = [];
    }

    get complete() { return this.fulfilled.length + this.rejected.length; }
    get total() { return this.items.length; }
    get inProgress() { return this.total - this.complete; }
    get progress() { return this.complete / this.total; }

    // item is Promise
    async add(item) {
        if (!item || !item.finally) return;
        this.items.push(item);

        try {
            item.__data = await item;
            this.fulfilled.push(item);
        } catch (error) {
            item.__error = error;
            this.rejected.push(item);
        }

        if (this.complete >= this.total) {
            this.promise.resolve();
        }
    }

    reset() {
        this.items = [];
        this.fulfilled = [];
        this.rejected = [];
    }
}
