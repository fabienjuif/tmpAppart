import { addLambdaUtil, jwt } from "../util";
import { createNetatmoAPI } from "../lib";

[
  "NETATMO_CLIENT_ID",
  "NETATMO_CLIENT_SECRET",
  "NETATMO_SCOPE",
  "NETATMO_REDIRECT_URL",
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} env must be set!`);
  }
});

export const getTokens = addLambdaUtil(
  { cors: false },
  async (event, context, callback, { sendResponse, redirect }) => {
    const api = createNetatmoAPI({
      clientId: process.env.NETATMO_CLIENT_ID,
      clientSecret: process.env.NETATMO_CLIENT_SECRET,
      scope: process.env.NETATMO_SCOPE,
      redirectUrl: process.env.NETATMO_REDIRECT_URL,
    });

    // 1. if there is a "code" parameter it means we are in the process of creating new tokens
    // 2. if not and
    //        2a. if there is a JWT token, decode it, if there is a refresh token try to use it (TODO:)
    //        2b. if there is not a JWT token, or no refresh token, or the refresh token does not work (TODO:)
    //                then returns the redirect URL, the user has to log in again
    const { code, from, state } = event.queryStringParameters || {};
    if (code) {
      await api.setTokens({ code });
      const token = await jwt.sign({
        ...api.getTokens(),
        clientId: process.env.NETATMO_CLIENT_ID,
      });

      if (state) {
        try {
          const { from } = JSON.parse(state);
          if (from) {
            return redirect(`${from}?token=${token}`);
          }
        } catch (ex) {
          console.warn(ex);
        }
      }
      return sendResponse({
        token,
      });
    } else {
      return redirect(api.getRedirectUrl({ state: { from } }));
    }
  }
);
