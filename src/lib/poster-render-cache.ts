export class PosterRenderBusy extends Error {}

// Limits apply per server process. Never persist a poster cache as source data.
export class PosterRenderCache {
  private ready = new Map<string, ArrayBuffer>();
  private pending = new Map<string, Promise<ArrayBuffer>>();
  private bytes = 0;
  constructor(private maxBytes = 24 * 1024 * 1024, private maxEntries = 24, private concurrency = 2) {}

  async get(key: string, render: () => Promise<ArrayBuffer>) {
    const hit = this.ready.get(key);
    if (hit) {
      this.ready.delete(key);
      this.ready.set(key, hit);
      return hit;
    }
    const pending = this.pending.get(key);
    if (pending) return pending;
    if (this.pending.size >= this.concurrency) throw new PosterRenderBusy("Poster renderer is busy.");
    const work = Promise.resolve().then(render).then(png => {
      if (png.byteLength <= this.maxBytes) {
        while (this.ready.size && (this.ready.size >= this.maxEntries || this.bytes + png.byteLength > this.maxBytes)) {
          const oldest = this.ready.keys().next().value!;
          this.bytes -= this.ready.get(oldest)!.byteLength;
          this.ready.delete(oldest);
        }
        this.ready.set(key, png);
        this.bytes += png.byteLength;
      }
      return png;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, work);
    return work;
  }
}
