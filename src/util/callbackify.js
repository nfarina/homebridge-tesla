
export default function callbackify(func) {
  return (...args) => {
    const onlyArgs = [];
    let callback = null;

    for (const arg of args) {
      if (typeof arg === 'function') {
        callback = arg;
        break;
      }

      onlyArgs.push(arg);
    }

    func(...onlyArgs)
      .then(data => callback(null, data))
      .catch(err => callback(err))
  }
}
