import { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import { fetchProjectsList } from "@/StateManagement/Redux/slices/projects";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function Sitemap() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.projects);

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjectsList());
    }
  }, [projects, dispatch]);

  return (
    <footer className="bg-gray-50 text-sm text-gray-700 px-6 py-12 border-t border-gray-200 h-dvh w-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div>
          <h3 className="font-semibold mb-3">Main</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to={`/projects`}
                className="hover:underline hover:text-gray-900"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                to={`/contact`}
                className="hover:underline hover:text-gray-900"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Projects</h3>
          <ul className="space-y-2">
            {projects.map((elem) => (
              <li key={elem.project_id}>
                <Link
                  to={`/project/${elem.project_id}`}
                  className="hover:underline hover:text-gray-900"
                >
                  {elem.project_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Blogs</h3>
          <ul className="space-y-2"></ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Designs</h3>
          <ul className="space-y-2"></ul>
        </div>
      </div>
    </footer>
  );
}
