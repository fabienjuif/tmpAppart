import querystring from "querystring";
import fetch from "node-fetch";

const BASE_URL = process.env.NETATMO_BASE_URL || "https://api.netatmo.com";
const OAUTH2_BASE_URL = `${BASE_URL}${
  process.env.NETATMO_AUTH2_PATH || "/oauth2"
}`;
const API_BASE_URL = `${BASE_URL}${process.env.NETATMO_API_BASE || "/api"}`;

export const NO_TOKEN_ERROR_CODE = "no-tokens";

const getRedirectUrl = ({ clientId, redirectUrl, scope }) => ({
  state,
} = {}) => {
  const query = querystring.stringify({
    client_id: clientId,
    redirect_uri: redirectUrl,
    scope,
    state: state ? JSON.stringify(state) : undefined,
  });

  return `${OAUTH2_BASE_URL}/authorize?${query}`;
};

const getTokens = ({
  clientId,
  clientSecret,
  redirectUrl,
  scope,
  parse,
}) => async ({ refreshToken, code }) => {
  if (!clientId) throw new Error("clientId must be set.");
  if (!clientSecret) throw new Error("clientSecret must be set.");

  const form = new URLSearchParams();
  form.append("client_id", clientId);
  form.append("client_secret", clientSecret);
  if (code) {
    form.append("grant_type", "authorization_code");
    form.append("code", code);
    form.append("redirect_uri", redirectUrl);
    form.append("scope", scope);
  } else if (refreshToken) {
    form.append("grant_type", "refresh_token");
    form.append("refresh_token", refreshToken);
  } else {
    // TODO: error
  }

  return parse(
    await fetch(`${OAUTH2_BASE_URL}/token`, {
      body: form,
      method: "POST",
    }),
    "Error while retrieving netatmo token"
  );
};

const getRoomMeasure = ({ tokens, parse }) => async ({
  homeId,
  roomId,
  scale,
  type,
  dateBegin,
  dateEnd,
  realTime,
}) => {
  return parse(
    await fetch(`${API_BASE_URL}/getroommeasure`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokens.access}`,
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        home_id: homeId,
        room_id: roomId,
        scale,
        type,
        date_begin: dateBegin,
        date_end: dateEnd,
        real_time: realTime,
      }),
      method: "POST",
    }),
    "Error while retrieving room measure"
  );
};

const getMeasure = ({ tokens, parse }) => async ({
  deviceId,
  moduleId,
  scale,
  type,
  dateBegin,
  dateEnd,
  realTime,
}) => {
  return parse(
    await fetch(`${API_BASE_URL}/getmeasure`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokens.access}`,
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        device_id: deviceId,
        module_id: moduleId,
        scale,
        type,
        date_begin: dateBegin,
        date_end: dateEnd,
        real_time: realTime,
      }),
      method: "POST",
    }),
    "Error while retrieving measure"
  );
};

export const createNetatmoAPI = (authParams) => {
  const parse = async (response, errMessage) => {
    if (response.ok) return response.json();
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    if (json?.error?.code === 1) {
      const error = new Error('Tokens not set, please call "setTokens"');
      error.code = NO_TOKEN_ERROR_CODE;
      throw error;
    }

    const error = new Error(errMessage);
    error.rawResponse = response;
    error.status = response.status;
    error.text = text;
    error.response = json;
    throw error;
  };

  const tokens = {
    access: undefined,
    refresh: undefined,
    expiresIn: undefined,
    authorization: undefined,
  };

  const setTokens = async ({ access, refresh, expiresIn, code }) => {
    if (code) {
      const res = await getTokens({ ...authParams, parse })({ code });
      return setTokens({
        access: res.access_token,
        refresh: res.refresh_token,
        expiresIn: res.expiresIn,
      });
    }

    if (!access && refresh) {
      const res = await getTokens({ ...authParams, parse })({
        refreshToken: refresh,
      });
      return setTokens({
        access: res.access_token,
        refresh: res.refresh_token,
        expiresIn: res.expires_in,
      });
    }

    if (!access && !refresh) {
      // TODO: error
    }

    tokens.access = access;
    tokens.refresh = refresh;
    tokens.expiresIn = expiresIn;
  };

  return {
    setTokens,
    getTokens: () => ({ ...tokens }),
    getRedirectUrl: getRedirectUrl({ ...authParams, parse }),
    getRoomMeasure: getRoomMeasure({ tokens, parse }),
    getMeasure: getMeasure({ tokens, parse }),
  };
};
