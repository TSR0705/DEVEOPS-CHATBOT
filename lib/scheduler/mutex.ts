

export class Mutex {

  private locked: boolean = false;


  private waiters: Array<() => void> = [];


  acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waiters.push(resolve);
      }
    });
  }


  release(): void {
    if (this.waiters.length > 0) {
      const nextWaiter = this.waiters.shift()!;
      nextWaiter();
    } else {
      this.locked = false;
    }
  }
}
