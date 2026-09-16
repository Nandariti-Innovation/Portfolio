import { ProjectFormInput } from "@/Components/ProjectForm/ProjectFormInput";
import { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "@/StateManagement/Redux/slices/authentication";
import supabase from "@/Superbase/client";
import { AtSign, Loader2, RectangleEllipsis } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading: loginStateLoading, error: loginStateError } = useSelector(
    (state: RootState) => state.authentication,
  );
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");

  const handleUserLogin = async () => {
    // Handle user login logic here
    dispatch(loginStart());
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (error?.message.includes("Email not confirmed")) {
      alert("Please confirm your email before logging in.");
    }

    if (error) {
      console.error("Login failed:", error);
      dispatch(loginFailure(error.message));
      return;
    }

    dispatch(loginSuccess(user?.id));
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-sidebar">
      <div className="bg-background w-fit h-fit py-4 px-6 rounded-lg shadow-md">
        <h2 className="block text-xl font-medium text-gray-700 m-0">
          User login
        </h2>
        <p className="text-sm text-gray-500 mb-5 mt-2.5 leading-normal">
          Enter your email and password below to login and start working
        </p>
        <form onSubmit={(e) => e.preventDefault()}>
          <ProjectFormInput
            heading="Email id:"
            placeholder="Enter email here..."
            icon={<AtSign size={18} />}
            inputName="email"
            projectTitle={userEmail}
            updateTitle={(value) => setUserEmail(() => value)}
            isRequired={true}
            inputType="email"
          />
          <ProjectFormInput
            heading="Password:"
            placeholder="Enter password here..."
            icon={<RectangleEllipsis size={18} />}
            inputName="password"
            projectTitle={userPassword}
            updateTitle={(value) => setUserPassword(() => value)}
            isRequired={true}
            inputType="password"
          />
          {loginStateError && (
            <p className="text-sm text-red-500 mt-1 first-letter:uppercase">
              {loginStateError}
            </p>
          )}
          <button
            onClick={() => handleUserLogin()}
            className="cursor-pointer inline-flex h-8.75 items-center justify-center rounded bg-blue-400 px-3.75 font-medium leading-none text-blue-50 outline-none outline-offset-1 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-blue-600 select-none mt-4 w-full"
          >
            {loginStateLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
