import { useEffect, useState } from "react";
import {
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryLine,
  VictoryBar,
  VictoryVoronoiContainer,
  VictoryTooltip,
  VictoryArea,
} from "victory";
import { useToken } from "./Auth";

var PERCENT = new Intl.NumberFormat(undefined, {
  style: "percent",
});

const DATE = {
  format: (date) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date),
};

const TEMPERATURE = {
  format: (value) =>
    `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(value)}°C`,
};

const Month = ({ year, month, hide = { humidity: false } }) => {
  const [chart, setChart] = useState({ data: [], maxima: undefined });
  const token = useToken();

  useEffect(() => {
    const getData = () => {
      Promise.all(
        Array.from({ length: 12 }).map((_, index) =>
          fetch(
            `${process.env.REACT_APP_API_BASE_URI}/data?month=${String(
              index + 1
            ).padStart(2, "0")}&year=${year}`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          )
            .then((d) => d.json())
            .catch(console.warn)
        )
      ).then((data) => {
        const indoorTemps = [];
        const indoorBoiler = [];
        const outdoorTemps = [];
        const outdoorHumidity = [];

        data
          .filter(Boolean)
          .filter(({ error }) => !error)
          .map(({ data }) => data)
          .flat()
          .forEach(({ date, indoor, outdoor }) => {
            const x = new Date(date).getTime();

            if (indoor && !indoor.noValue) {
              indoorTemps.push({
                tooltipLabel: `indoor: ${TEMPERATURE.format(indoor.celsius)}`,
                x,
                y: indoor.celsius,
              });
              indoorBoiler.push({
                tooltipLabel: `boiler: ${PERCENT.format(indoor.percentBoiler)}`,
                x,
                y: indoor.percentBoiler,
              });
            }
            if (outdoor) {
              outdoorTemps.push({
                tooltipLabel: `outdoor: ${TEMPERATURE.format(outdoor.celsius)}`,
                x,
                y: outdoor.celsius,
              });
              outdoorHumidity.push({
                tooltipLabel: `humidity: ${PERCENT.format(outdoor.humidity)}`,
                x,
                y: outdoor.humidity,
              });
            }
          });

        const chartData = [
          indoorBoiler,
          outdoorHumidity,
          indoorTemps,
          outdoorTemps,
        ];
        const tempMaxima = Math.max(
          ...indoorTemps.map((d) => d.y),
          ...outdoorTemps.map((d) => d.y)
        );

        setChart({
          data: chartData,
          tempMaxima: tempMaxima,
        });
      });
    };

    if (token) {
      getData();
    }
  }, [month, token, year]);

  if (chart.data.length <= 0) return null;

  return (
    <VictoryChart
      theme={VictoryTheme.material}
      height={600}
      width={2000}
      scale={{ x: "time", y: "linear" }}
      containerComponent={
        <VictoryVoronoiContainer
          voronoiDimension="x"
          labelComponent={
            <VictoryTooltip cornerRadius={10} flyoutStyle={{ fill: "white" }} />
          }
          labels={({ datum }) => datum.tooltipLabel || datum.y}
        />
      }
    >
      <VictoryArea
        data={chart.data[1]}
        barRatio={0.1}
        alignment="start"
        interpolation="stepBefore"
        style={{
          data: {
            fill: hide.humidity ? "transparent" : "rgb(201, 238, 247)",
          },
        }}
      />
      <VictoryBar
        data={chart.data[0]}
        barRatio={0.7}
        alignment="start"
        style={{ data: { fill: "rgb(153, 63, 35)" } }}
      />

      <VictoryLine
        data={chart.data[2]}
        y={(datum) => datum.y / chart.tempMaxima}
        style={{ data: { stroke: "red" } }}
      />
      <VictoryLine
        data={chart.data[3]}
        y={(datum) => datum.y / chart.tempMaxima}
        style={{ data: { stroke: "green" } }}
      />

      <VictoryAxis
        tickFormat={DATE.format}
        tickValues={Array.from({ length: 12 })
          .map((_, index) => new Date(`${year}-${index + 1}-01`).getTime())
          .concat(new Date(`${year}-12-31`).getTime())}
      />
      <VictoryAxis dependentAxis tickFormat={PERCENT.format} />
      <VictoryAxis
        dependentAxis
        orientation="right"
        tickFormat={(t) => TEMPERATURE.format(t * chart.tempMaxima)}
      />
    </VictoryChart>
  );
};

export default Month;
