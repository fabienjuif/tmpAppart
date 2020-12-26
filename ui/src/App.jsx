import { useState } from "react";
import Chart from "./Chart";
import AuthProvider from "./Auth";

const App = () => {
  const [hide, setHide] = useState({ humidity: false });

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
          <Chart year={2020} hide={hide} />
          <Chart year={2019} hide={hide} />
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
