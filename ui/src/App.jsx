import { useState } from "react";
import Chart from "./Chart";
import AuthProvider from "./Auth";

const App = () => {
  const [hide, setHide] = useState({ humidity: false });

  const year = new Date().getUTCFullYear();

  return (
    <AuthProvider>
      <div>
        <input
          type="checkbox"
          value={hide.humidity}
          onChange={() =>
            setHide((old) => ({ ...old, humidity: !old.humidity }))
          }
        />
        Hide Humidity
        <div style={{ position: "relative" }}>
          {year}
          <Chart year={year} hide={hide} />
          {year - 1}
          <Chart year={year - 1} hide={hide} />
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
