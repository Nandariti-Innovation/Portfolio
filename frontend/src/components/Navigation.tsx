import { useState } from "react";
import { useContactModal } from "@/hooks/useContactModal";
import { Menu, X } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/StateManagement/Redux/reduxStore";

export const Navigation = () => {
  const [open, setOpen] = useState(false);
  const { openContact } = useContactModal();
  const { navbar_data } = useSelector((state: RootState) => state.navbar);

  return (
    <header className="nav-shell">
      <a className="brand" href="#home" aria-label="Home">
        DG<span>.</span>
      </a>
      <nav className={open ? "nav-links open" : "nav-links"}>
        {navbar_data.map((link) => {
          const isContactRoute = /^\/?contact\/?$/.test(
            link.navbar_link as string,
          );
          return isContactRoute ? (
            <button
              key={link.navbar_id}
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setOpen(false);
                openContact();
              }}
            >
              {link.navbar_title}
            </button>
          ) : (
            <a
              key={link.navbar_id}
              href={link.navbar_link}
              onClick={() => setOpen(false)}
            >
              {link.navbar_title}
            </a>
          );
        })}
      </nav>
      <button
        type="button"
        className="availability inline-flex cursor-pointer border-0 bg-transparent"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(false);
          openContact();
        }}
      >
        <i /> Available for work
      </button>
      <button
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
};
