import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { store } from "./StateManagement/Redux/reduxStore";
import "./index.css";
import { SettingContextProvider } from "./StateManagement/ContextAPI/SettingContext/SettingContextProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SettingContextProvider>
          <App />
        </SettingContextProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
