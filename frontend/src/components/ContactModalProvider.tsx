import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ContactModalContext } from "@/hooks/useContactModal";

const ContactModal = lazy(() =>
  import("./ContactModal").then((module) => ({ default: module.ContactModal })),
);

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openContact = useCallback(() => setIsOpen(true), []);
  const closeContact = useCallback(() => setIsOpen(false), []);
  const value = useMemo(
    () => ({ openContact, closeContact }),
    [openContact, closeContact],
  );

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <ContactModal onClose={closeContact} />
        </Suspense>
      )}
    </ContactModalContext.Provider>
  );
}
