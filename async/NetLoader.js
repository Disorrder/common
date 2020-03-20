import EventEmitter from "events";
import createExposedPromise from "./ExposedPromise";

// interface IRequestItem = {id, request, data?, error?, retries?}

export default class NetLoader extends EventEmitter {
    constructor() {
        super();

        this.maxThreads = 4;
        this.maxRetry = 2; // Not implemented!

        this.clear();
    }

    clear() {
        this._idCounter = 0; // private
        this.requests = {}; // store all Requests by id
        this.queue = []; // store only items didn't start yet.
        
        this.pending = []; // array for simultaneous requests
        this.fulfilled = [];
        this.rejected = [];

        this.promise = createExposedPromise();
    }

    get loaded() { return this.fulfilled.length + this.rejected.length; }
    get total() { return this._idCounter; }
    get inProgress() { return this.total - this.loaded; }
    get progress() { return this.loaded / this.total || 0; }
    get progressPerc() { return Math.round(this.progress * 1000) / 10 + "%"; }

    get status() {
        return {
            status: this.promise.status,
            loaded: this.loaded,
            total: this.total,
            progress: this.progress,
            progressPerc: this.progressPerc,
        }
    }

    // type <Request>, support iOS >=10.1
    add(request) {
        if (this.promise.status > 0) this.clear();

        const id = ++this._idCounter;
        this.requests[id] = request;

        const item = {
            id,
            request: request.clone(),
            data: null,
            error: null,
        };

        this.queue.push(item);
        this.tryNext();
        return item;
    }

    async tryNext() {
        if (this.promise.status > 0) return;
        if (!this.queue.length) return;
        if (this.pending.length >= this.maxThreads) return;

        let item = this.queue.shift();
        let action = this.action(item);
        this.pending.push(item);
        this.emit("progress", this.progress)

        try {
            let {data} = await action;
            item.data = data;
            this.fulfilled.push(item);
        } catch (error) {
            item.error = error;
            // TODO: add retry
            this.pending.splice(this.pending.indexOf(action), 1);
            this.rejected.push(item);
            await this.promise.reject(error);            
            this.emit("error", error);
            return;
        }
        
        this.pending.splice(this.pending.indexOf(action), 1);
        this.emit("progress", this.progress)

        if (this.loaded >= this.total) {
            await this.promise.resolve();
            this.emit("finish");
        } else {
            this.tryNext();
        }
    }

    async action(item) {
        return fetch(item.request);
    }

    async retryAll() {
        const pending = this.pending.map((item) => {
            return {
                ...item,
                request: this.requests[item.id].clone()
            }
        });
        const rejected = this.rejected.map((item) => {
            return {
                ...item,
                request: this.requests[item.id].clone()
            };
        });
        
        this.queue = [...this.queue, ...pending, ...rejected];
        this.pending = [];
        this.rejected = [];
        this.promise = createExposedPromise();

        for(let i = 0; i < this.maxThreads; i++) {
            this.tryNext();
        }
    }
}
