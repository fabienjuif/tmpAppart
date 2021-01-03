import { promisify } from "util";
import jsonwebtoken from "jsonwebtoken";

const sign = promisify(jsonwebtoken.sign);
const verify = promisify(jsonwebtoken.verify);

["CORS_ALLOW_ORIGIN"].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} env must be set!`);
  }
});

const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Authorization",
  "Access-Control-Allow-Origin": process.env.CORS_ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "OPTIONS,GET",
  "Access-Control-Allow-Credentials": true,
};

export const promiseTimeout = async (ms, promise) => {
  // Create a promise that rejects in <ms> milliseconds
  let id;
  let timeout = new Promise((resolve, reject) => {
    id = setTimeout(() => {
      clearTimeout(id);
      reject("Timed out in " + ms + "ms.");
    }, ms);
  });

  // race between our timeout and the passed in promise
  const res = await Promise.race([promise, timeout]);

  // clear timeout so it does not run into nodejs ...
  // TODO: cancel the given promise? we need bluebird maybe
  if (id) clearTimeout(id);

  return res;
};

export const addLambdaUtil = ({ cors = false }, handler) => (
  event,
  context,
  callback
) => {
  const sendResponse = (body, headers = {}, statusCode = 200) => {
    let _headers = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (cors) {
      _headers = {
        ..._headers,
        ...CORS_HEADERS,
      };
    }

    callback(null, {
      statusCode: statusCode,
      headers: _headers,
      body: JSON.stringify(body),
    });
  };

  const sendErrorResponse = (body, statusCode = 500) =>
    sendResponse({ ...body, error: true }, undefined, statusCode);

  return handler(event, context, callback, {
    sendResponse,
    sendErrorResponse,
    redirect: (location) =>
      callback(undefined, {
        statusCode: 302,
        headers: {
          Location: location,
        },
      }),
  }).catch((error) => {
    console.trace(error);
    return sendErrorResponse({ message: error.message, error });
  });
};

const verifyJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_TOKEN env variable must be set.");
  }
};

export const jwt = {
  sign: (data) => {
    verifyJwtSecret();
    return sign(data, process.env.JWT_SECRET);
  },
  verify: (token) => {
    verifyJwtSecret();
    return verify(token, process.env.JWT_SECRET);
  },
};
