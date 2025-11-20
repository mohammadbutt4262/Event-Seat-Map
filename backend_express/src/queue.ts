import { User } from "./types";

type Task = {
  id: number;
  resolve: (u: User | null) => void;
  reject: (err: any) => void;
};

export class SimpleQueue {
  private q: Task[] = [];
  private running = 0;
  private concurrency: number;

  // worker function receives task and should return a Promise<User|null>
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
  }

  push(task: Task) {
    this.q.push(task);
    this.process();
  }

  private process() {
    while (this.running < this.concurrency && this.q.length > 0) {
      const t = this.q.shift()!;
      this.running++;
      // simulate DB fetch 200ms
      simulateDbFetch(t.id)
        .then((res) => {
          t.resolve(res);
        })
        .catch((err) => t.reject(err))
        .finally(() => {
          this.running--;
          setImmediate(() => this.process());
        });
    }
  }
}

// Simulated DB fetch: returns mock user or null after 200ms
import { mockUsers } from "./mockData";

function simulateDbFetch(id: number): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const u = mockUsers[id] ?? null;
      resolve(u);
    }, 200);
  });
}
