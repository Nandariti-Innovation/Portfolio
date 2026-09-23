import { Router } from "@/Routers/Router";
import { ContactModalProvider } from "@/components/ContactModalProvider";

const App = () => (
  <ContactModalProvider>
    <Router />
  </ContactModalProvider>
);

export default App;
