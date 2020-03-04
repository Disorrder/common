import ExposedPromise from "./ExposedPromise";

// WIP type Item = {url, params} for fetch()?

export class NetLoader {
    constructor() {
        this.items = []; // store all items
        this.pending = []; // store only items didn't start yet. Think about name
        
        this.queue = []; // array for simultaneous requests
        this.fulfilled = [];
        this.rejected = [];

        this.maxThreads = 4;
        this.maxRetry = 3; // Not implemented!
        
        this.promise = new ExposedPromise();
    }

    get complete() { return this.fulfilled.length + this.rejected.length; }
    get total() { return this.items.length; }
    get inProgress() { return this.total - this.complete; }
    get progress() { return this.complete / this.total || 0; }
    get progressPerc() { return Math.round(this.progress * 1000) / 10 + "%"; }

    add(item) {
        this.items.push(item);
        this.pending.push(item);
        this.tryNext();
    }

    async tryNext() {
        if (!this.pending.length) return;
        if (this.queue.length >= this.maxThreads) return;

        let item = this.pending.splice(0, 1)[0];
        let action = this.action(item);
        this.queue.push(action);

        try {
            let {data} = await action;
            item.__data = data;
            this.fulfilled.push(item);
        } catch (error) {
            item.__error = error;
            // TODO: add retry
            this.rejected.push(item);
        }

        this.queue.splice(this.queue.indexOf(action), 1);

        if (this.complete >= this.total) {
            this.promise.resolve();
        } else {
            this.tryNext();
        }
    }

    async action({url, params}) {
        // overload it
        // let res = fetch(url, params);
        console.log("def action", url, params);
        let to = Math.random()*2000;
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("TO", to);
                resolve({data: "ok"});
            }, to);
        });
    }
}