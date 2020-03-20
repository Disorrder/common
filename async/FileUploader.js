import NetLoader from "./NetLoader";

export default class FileUploader extends NetLoader {
    clear() {
        super.clear();
        this.files = [];
    }

    get totalSize() {
        return this.files.reduce((prev, file) => prev + file.size, 0);
    }
    get loadedSize() {
        return [...this.fulfilled, ...this.pending].reduce((prev, item) => prev + item.loaded, 0);
    }
    get progressSize() { return this.loadedSize / this.totalSize || 0; }
    get progressSizePerc() { return Math.round(this.progressSize * 1000) / 10 + "%"; }

    get status() {
        return {
            status: this.promise.status,
            loaded: this.loaded,
            total: this.total,
            progress: this.progress,
            progressPerc: this.progressPerc,

            loadedSize: this.loadedSize,
            totalSize: this.totalSize,
            progressSize: this.progressSize,
            progressSizePerc: this.progressSizePerc,
        }
    }

    upload(url, file, params) {
        this.files.push(file);

        params = {
            method: "PUT",
            body: file,
            ...params
        };
        const req = new Request(url, params);
        req.file = file;

        const item = this.add(req);
        item.file = file;
        item.size = file.size;
        item.loaded = 0;
    }
    
    async action(item) {
        let request = item.request;
        const xhr = new XMLHttpRequest();
        xhr.open(request.method, request.url, true);
        // xhr.withCredentials = request.credentials === "include";
        
        xhr.upload.addEventListener("progress", (e) => {
            item.loaded = e.loaded;
            this.emit("progress", this.progress);
        });
        
        item.xhr = xhr;
        const file = await request.blob();
        return new Promise((resolve, reject) => {
            xhr.addEventListener("load", resolve);
            xhr.addEventListener("error", reject);
            xhr.send(file);
        });
    }
}
