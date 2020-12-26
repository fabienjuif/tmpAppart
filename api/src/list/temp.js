import fetch from "node-fetch";

const average = (array, field) => {
  if (array.length <= 0) return undefined;
  const sum = array.reduce((acc, curr) => acc + curr[field], 0);
  return sum / array.length;
};

const OPENDATASOFT_WEATHER_API_URI = process.env.OPENDATASOFT_WEATHER_API_URI;
if (!OPENDATASOFT_WEATHER_API_URI) {
  throw new Error("OPENDATASOFT_WEATHER_API_URI env must be set!");
}

export default async ({ year, month }) => {
  const uri = OPENDATASOFT_WEATHER_API_URI.replace("%%year%%", year).replace(
    "%%month%%",
    month
  );
  const res = await fetch(uri);

  const { records } = await res.json();
  records.reverse();

  const temps = [];
  let dayRecords = [];
  let date;
  records.forEach(({ fields }, index, array) => {
    const currDate = new Date(fields.date);

    if (
      !date ||
      currDate.getDate() !== date.getDate() ||
      array.length === index + 1
    ) {
      if (dayRecords.length > 0) {
        const datum = {
          date,
          humidity: average(dayRecords, "u") / 100,
          celsius: average(dayRecords, "tc"),
        };
        if (!Number.isNaN(datum.humidity) && !Number.isNaN(datum.celsius)) {
          temps.push(datum);
        }
      }

      date = currDate;
      dayRecords = [];
    }

    dayRecords.push(fields);
  });

  return temps;
};
