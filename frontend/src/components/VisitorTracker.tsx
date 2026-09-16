import { useEffect, useState } from 'react';
import supabase from '@/Superbase/client';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/StateManagement/Redux/reduxStore';
import { attachResumeTracking, setVisitorRoute } from '@/utils/visitorTracking';

export function VisitorTracker() {
  const { pathname, search } = useLocation();
  const { isAuth } = useSelector((state: RootState) => state.authentication);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      if (session) setVisitorRoute(window.location.pathname, '', true);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    setVisitorRoute(pathname, search, isAuth || hasSession !== false);
  }, [pathname, search, isAuth, hasSession]);
  useEffect(() => attachResumeTracking(), []);
  return null;
}
