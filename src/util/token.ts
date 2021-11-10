// We need to do this "manually" until this is merged:
// https://github.com/mseminatore/TeslaJS/pull/220

const request = require("request").defaults({
  headers: {
    "x-tesla-user-agent": "TeslaApp/3.4.4-350/fad4a582e/android/8.1.0",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36",
  },
  json: true,
  gzip: true,
  body: {},
});

export async function getAccessToken(refreshToken: string): Promise<any> {
  return new Promise((resolve, reject) => {
    var req = {
      method: "POST",
      url: "https://auth.tesla.com/oauth2/v3/token",
      json: true,
      body: {
        grant_type: "refresh_token",
        client_id: "ownerapi",
        refresh_token: refreshToken,
        scope: "openid email offline_access",
      },
    };

    request(req, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}
