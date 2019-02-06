type MutexValue = any;
type ProcessFunction = () => void;
export type UnlockFunction = () => void;

export const queue: Map<MutexValue, ProcessFunction[]> = new Map();

const debug = (...args: any[]) => {
  //console.log(...args);
}

export async function lock(
  value: MutexValue,
  timeout: number,
): Promise<UnlockFunction> {
  debug(`Locking on ${value}`);

  return new Promise(resolve => {
    let timeoutID;

    // Get either the existing wait list or a new one.
    const waitList: ProcessFunction[] = queue.get(value) || [];
    queue.set(value, waitList);

    // Create our processing callback. This will be called when it's our turn
    // to own the mutex.
    const process: ProcessFunction = () => {
      // Erase any pending timeouts.
      timeoutID && clearTimeout(timeoutID);

      // We may have accumulated process functions that never got called before
      // us. So remove anything before us that should be done already.
      removeUpTo(waitList, process);

      const unlock = () => {
        debug(`Unlocking on ${value}`);
        // Remove all process functions up to and including ourselves, then
        // call the next one if necessary.
        removeUpToAndIncluding(waitList, process);

        const nextProcess = waitList[0];
        if (nextProcess) {
          debug(`Calling next process waiting on ${value}`);
          nextProcess();
        } else {
          // Delete the wait list entire for this value to save memory.
          queue.delete(value);
        }
      };

      resolve(unlock);
    };

    // Add ourself to the list.
    waitList.push(process);

    // If we are the only thing on this list, we can process immediately.
    if (waitList.length === 1) {
      process();
    } else {
      debug(
        `${waitList.length - 1} others are processing on ${value}; waiting.`,
      );

      // Wait up to `timeout` milliseconds to be called back before just calling
      // the process function anyway.
      timeoutID = setTimeout(() => {
        debug(
          `Timed out waiting for ${value} after ${timeout}ms; processing anyway.`,
        );
        process();
      }, timeout);
    }
  });
}

function removeUpTo(array: any[], target: any) {
  const index = array.indexOf(target);
  index >= 0 && array.splice(0, index);
}

function removeUpToAndIncluding(array: any[], target: any) {
  const index = array.indexOf(target);
  index >= 0 && array.splice(0, index + 1);
}
