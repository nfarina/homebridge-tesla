
/*
 * Returns a Promise that waits for the given number of milliseconds
 * (via setTimeout), then resolves.
 */
export async function wait(ms: number = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
