type Task<T> = () => Promise<T>;

export class SimpleQueue {
  private concurrency: number;
  private running = 0;
  private queue: Array<{
    task: Task<unknown>;
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  }> = [];

  constructor(concurrency = 3) {
    this.concurrency = concurrency;
  }

  add<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as Task<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.runNext();
    });
  }

  private runNext(): void {
    if (this.running >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.running++;
    item
      .task()
      .then((res) => item.resolve(res))
      .catch((err) => item.reject(err))
      .finally(() => {
        this.running--;
        this.runNext();
      });
  }
}
