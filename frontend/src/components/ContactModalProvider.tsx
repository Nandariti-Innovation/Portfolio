import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ContactModal } from "./ContactModal";
import { ContactModalContext } from "@/hooks/useContactModal";

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
      {isOpen && <ContactModal onClose={closeContact} />}
    </ContactModalContext.Provider>
  );
}
