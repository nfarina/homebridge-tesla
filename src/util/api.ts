const tesla = require("teslajs");

//tesla.setLogLevel(tesla.API_LOG_ALL);

// Wrapper for TeslaJS functions that don't throw Error objects!
export default async function api(name: string, ...args: any[]): Promise<any> {
  try {
    return await tesla[name + "Async"](...args);
  } catch (errorOrString) {
    let error;

    if (typeof errorOrString === "string") {
      error = new Error(errorOrString);
    } else {
      error = errorOrString;
    }

    if (error.message === "Error response: 408") {
      console.log("Tesla timed out communicating with the vehicle.");
    } else {
      console.log("TeslaJS error:", errorOrString);
    }

    throw error;
  }
}
