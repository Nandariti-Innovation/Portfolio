import { BottomButtonCurveImg } from "@/Components/BottomButtonCurveImg/BottomButtonCurveImg";
import { useSelector } from "react-redux";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { useNavigate } from "react-router-dom";

export const MyServices = () => {
  const { services } = useSelector((state: RootState) => state.services);
  const navigate = useNavigate();

  return (
    <div className="w-full h-fit bg-footerBgColor py-10 max-lg:rounded-none overflow-hidden">
      <h2 className="text-lightthemebg text-5xl text-center font-medium max-lg:text-3xl">
        My <span className="text-leadcolor-600">Services</span>
      </h2>
      <div className="flex items-center justify-evenly flex-wrap my-10 max-lg:my-5 max-lg:gap-y-10">
        {services.map((elem) => (
          <div
            key={"services_" + elem.services_id}
            onClick={() => navigate("/contact")}
            className="bg-glassmorphism rounded-2xl w-[400px] h-[450px] backdrop-blur-sm border border-solid border-[rgba(255, 255, 255, 0.5)]"
          >
            <h3 className="h-[100px] font-medium text-3xl text-lightthemebg pl-5 content-center border-b border-solid border-[rgba(255, 255, 255, 0.5)]">
              {elem.service_name}
            </h3>
            <div className="relative w-full h-[350px] flex items-center justify-center group cursor-pointer">
              <div className="absolute bottom-10 bg-[#757575] w-[300px] rounded-3xl h-64 z-0 group-hover:scale-y-105"></div>
              <div className="absolute bottom-5 bg-[#9E9D9D] w-[350px] rounded-3xl h-64 z-10 group-hover:scale-y-105"></div>
              <div className="absolute bottom-0 w-full h-64 rounded-3xl z-20 cursor-pointer">
                <BottomButtonCurveImg
                  imgURL={elem.service_image}
                  outlineClassCss={"outline-footerBgColor"}
                  inheritClr={"#272727"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
