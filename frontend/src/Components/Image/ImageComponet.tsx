import React, { useEffect, useState } from "react";
import { tailwindMerge } from "../../Utils/tailwindMerge";
import supabase from "@/Superbase/client";
import { Loader2 } from "lucide-react";

export const ImageComponet: React.FC<propsType> = ({ source, alternative }) => {
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>(source);

  const FetchImageFromSupabase = async (fileName: string) => {
    const { data } = await supabase.storage
      .from("portfolio")
      .getPublicUrl(fileName);

    setImageUrl(data.publicUrl || fileName);
  };

  useEffect(() => {
    FetchImageFromSupabase(source);
  }, [source]);

  return (
    <div className="relative h-full w-full">
      {!imageLoaded && (
        <div className="flex justify-center items-center h-full w-full animate-spin absolute top-0 left-0 bg-white">
          <Loader2 size={24} />
        </div>
      )}
      <img
        className={tailwindMerge(
          "h-full max-w-full object-cover transition-all",
          !imageLoaded && "blur-load",
        )}
        src={imageUrl}
        alt={alternative}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};

interface propsType {
  source: string;
  alternative: string;
}
