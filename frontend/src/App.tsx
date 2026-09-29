import { Router } from "@/Routers/Router";
import { ContactModalProvider } from "@/Components/ContactModalProvider";

const App = () => (
  <ContactModalProvider>
    <Router />
  </ContactModalProvider>
);

export default App;
