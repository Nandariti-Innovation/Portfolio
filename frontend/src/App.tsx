import { Router } from "@/Routers/Router";
import { useFetchHomePage } from "./Hooks/FetchHomePage";
import { useEffect } from "react";
import { ContactModalProvider } from "@/components/ContactModalProvider";

const App = () => {
  const { fetchHomePageData, pageDataLoading } = useFetchHomePage();

  useEffect(() => {
    fetchHomePageData();
  }, [fetchHomePageData]);

  return (
    <ContactModalProvider>
      <Router pageDataLoading={pageDataLoading} />
    </ContactModalProvider>
  );
};

export default App;
