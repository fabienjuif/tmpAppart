import { DynamoDB } from "aws-sdk";
import { chunk } from "lodash";
import {
  addMonths,
  addDays,
  formatISO,
  parseISO,
  isDate,
  eachDayOfInterval,
} from "date-fns";
import { promiseTimeout, addLambdaUtil, jwt } from "../util";
import { createNetatmoAPI } from "../lib";
import getTemps from "./temp";

const TIMEZONE_OFFSET_MS = new Date().getTimezoneOffset() * 60000;

[
  "NETATMO_HOME_ID",
  "NETATMO_DEVICE_ID",
  "NETATMO_ROOM_ID",
  "NETATMO_MODULE_ID",
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} env must be set!`);
  }
});

const dynamoDb = new DynamoDB.DocumentClient();

const dateToString = (date) => {
  return formatISO(isDate(date) ? date : parseISO(date), {
    representation: "date",
  });
};

const getOutdoorValues = async (query) => {
  console.log(`Fetching outdoor values for ${query.year}-${query.month}`);

  const values = await getTemps(query);
  return values.map(({ date, ...rest }) => ({
    date: dateToString(date),
    outdoor: rest,
  }));
};

const getIndoorValues = (api) => async (utcStart, utcEnd) => {
  console.log(
    `Fetching indoor values for ${utcEnd.getUTCFullYear()}-${
      utcEnd.getUTCMonth() + 1
    }`
  );
  const dateBegin = new String(utcStart.getTime() / 1000);
  const dateEnd = new String(utcEnd.getTime() / 1000);
  const realTime = false;
  const scale = "1day";

  const [roomMeasure, measure] = await Promise.all([
    api.getRoomMeasure({
      homeId: process.env.NETATMO_HOME_ID,
      roomId: process.env.NETATMO_ROOM_ID,
      type: "Temperature",
      scale,
      dateBegin,
      dateEnd,
      realTime,
    }),
    api.getMeasure({
      deviceId: process.env.NETATMO_DEVICE_ID,
      moduleId: process.env.NETATMO_MODULE_ID,
      type: "sum_boiler_on,sum_boiler_off",
      scale,
      dateBegin,
      dateEnd,
      realTime,
    }),
  ]);

  let lastStepTime = 0;

  return roomMeasure.body.flatMap(({ beg_time, step_time, value }, bodyIndex) =>
    value.map((val, valueIndex) => {
      // this is because of netatmo API that return undefined sometimes...
      lastStepTime = step_time === undefined ? lastStepTime : step_time;

      const localDate = new Date(
        (beg_time + valueIndex * lastStepTime) * 1000 - TIMEZONE_OFFSET_MS
      );

      return {
        date: dateToString(localDate),
        indoor: {
          celsius: val[0],
          percentBoiler:
            measure.body[bodyIndex].value[valueIndex][0] /
            (measure.body[bodyIndex].value[valueIndex][0] +
              measure.body[bodyIndex].value[valueIndex][1]),
        },
      };
    })
  );
};

export const list = addLambdaUtil(
  { cors: true },
  async (event, context, callback, { sendResponse, sendErrorResponse }) => {
    context.callbackWaitsForEmptyEventLoop = false; // FIXME: until I find a way to cancel promise in "promiseTimeout"

    const infos = {
      requests: {
        indoor: false,
        outdoor: false,
      },
      newData: {
        indoor: false,
        outdoor: false,
      },
    };

    const { Authorization } = event.headers;
    if (!Authorization) {
      return sendErrorResponse({
        message: '"Authorization" header must be set.',
      });
    }
    const token = await jwt.verify(Authorization.replace("Bearer ", ""));
    if (!token) {
      return sendErrorResponse({
        message: "no token found.",
      });
    }

    const { year, month } = event.queryStringParameters || {};
    if (!year) {
      return sendErrorResponse({
        message: 'query param "year" must be set.',
      });
    }
    if (!month) {
      return sendErrorResponse({
        message: 'query param "month" must be set.',
      });
    }

    const api = createNetatmoAPI();
    api.setTokens(token);

    const dateS = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const dateE = addDays(addMonths(dateS, 1), -1);
    const utcStart = new Date(
      Date.UTC(dateS.getUTCFullYear(), dateS.getUTCMonth(), dateS.getUTCDate())
    );
    const utcEnd = new Date(
      Date.UTC(dateE.getUTCFullYear(), dateE.getUTCMonth(), dateE.getUTCDate())
    );

    const eachDays = eachDayOfInterval({ start: dateS, end: dateE });
    const daysInMonth = eachDays.length;

    const { Items: allValues } = await dynamoDb
      .query({
        TableName: process.env.DYNAMODB_TABLE,
        KeyConditionExpression:
          "#client_id = :client_id and begins_with(#date, :date)",
        ExpressionAttributeNames: {
          "#client_id": "client_id",
          "#date": "date",
        },
        ExpressionAttributeValues: {
          ":client_id": token.clientId,
          ":date": `${year}-${month}-`,
        },
      })
      .promise();

    const valuesInRange = allValues.filter(
      ({ date }) =>
        date <= dateToString(utcEnd) && date >= dateToString(utcStart)
    );

    const knownOutdoorValues = valuesInRange
      .filter(({ outdoor }) => outdoor)
      .map(({ date, outdoor }) => ({ date, outdoor }));
    const knownIndoorValues = valuesInRange
      .filter(({ indoor }) => indoor)
      .map(({ date, indoor }) => ({ date, indoor }));

    infos.requests.outdoor = knownOutdoorValues.length < daysInMonth;
    infos.requests.indoor = knownIndoorValues.length < daysInMonth;

    let indoorError = false;
    let [outdoorValues = [], indoorValues = []] = await Promise.all([
      knownOutdoorValues.length >= daysInMonth
        ? knownOutdoorValues
        : promiseTimeout(15000, getOutdoorValues({ year, month })).catch(
            console.warn
          ),
      knownIndoorValues.length >= daysInMonth
        ? knownIndoorValues
        : promiseTimeout(
            15000,
            getIndoorValues(api)(addDays(utcStart, -1), addDays(utcEnd, 1))
          ).catch((err) => {
            indoorError = true;
            console.warn(err);
          }),
    ]);

    if (outdoorValues.length < daysInMonth) {
      outdoorValues = eachDays
        .map(
          (day) =>
            outdoorValues.find(({ date }) => date === dateToString(day)) ||
            knownOutdoorValues.find(({ date }) => date === dateToString(day))
        )
        .filter(Boolean);
    }
    if (indoorValues.length < daysInMonth) {
      indoorValues = eachDays
        .map(
          (day) =>
            indoorValues.find(({ date }) => date === dateToString(day)) ||
            knownIndoorValues.find(({ date }) => date === dateToString(day)) ||
            // in case we didn't find value and this is past, and with no error we add a fake value
            // so next time we call this function it doesn't ask for data that is not there to netatmo
            (!indoorError &&
              day.getTime() <= Date.now() && {
                date: dateToString(day),
                indoor: { noValue: true, celsius: 0, percentBoiler: 0 },
              })
        )
        .filter(Boolean);
    }

    // final values
    const values = eachDays.map((day) => {
      const dayStr = dateToString(day);
      const indoorItem = indoorValues.find(({ date }) => date === dayStr);
      const outdoorItem = outdoorValues.find(({ date }) => date === dayStr);

      return {
        date: dayStr,
        indoor: indoorItem?.indoor,
        outdoor: outdoorItem?.outdoor,
      };
    });

    // write the values in database if needed
    if (
      knownOutdoorValues.length < daysInMonth ||
      knownIndoorValues.length < daysInMonth
    ) {
      infos.newData.outdoor = knownOutdoorValues.length < daysInMonth;
      infos.newData.indoor = knownIndoorValues.length < daysInMonth;

      // 25 is the dynamo limit
      console.log(
        "token.clientId",
        token.clientId,
        JSON.stringify(values, null, 2)
      );
      const chunks = chunk(values, 25);
      await Promise.all(
        chunks.map((chunk) =>
          dynamoDb
            .batchWrite({
              RequestItems: {
                [process.env.DYNAMODB_TABLE]: chunk.map((item) => ({
                  PutRequest: {
                    Item: {
                      ...item,
                      client_id: token.clientId,
                    },
                  },
                })),
              },
            })
            .promise()
        )
      );
    }

    return sendResponse({ infos, data: values });
  }
);
