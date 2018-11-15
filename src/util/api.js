// @flow

const tesla = require('teslajs');

//tesla.setLogLevel(tesla.API_LOG_ALL);

// Wrapper for TeslaJS functions that don't throw Error objects!
export default async function api(name: string, ...args: any[]): any {
  try {
    return await tesla[name + 'Async'](...args);
  }
  catch (error) {
    if (typeof error === 'string') {
      throw new Error(error);
    }

    throw error;
  }
}
