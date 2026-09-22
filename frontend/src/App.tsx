import { Router } from "@/Routers/Router";
import { useFetchHomePage } from "./Hooks/FetchHomePage";
import { useEffect } from "react";
import { ContactModalProvider } from "@/components/ContactModalProvider";
import { DashboardAccessProvider } from "@/features/dashboardAccess/DashboardAccess";

const App = () => {
  const { fetchHomePageData, pageDataLoading } = useFetchHomePage();

  useEffect(() => {
    fetchHomePageData();
  }, [fetchHomePageData]);

  return (
    <ContactModalProvider>
      <DashboardAccessProvider><Router pageDataLoading={pageDataLoading} /></DashboardAccessProvider>
    </ContactModalProvider>
  );
};

export default App;
