import supabase from "@/Superbase/client";
import { ImageOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FileItem } from "../Types/Files";

export const LoadSignedImage: React.FC<LoadSignedImageProps> = ({
  imageData,
}) => {
  const [loading, setLoading] = useState(true);
  const [imageURL, setImageURL] = useState("");
  const [failed, setFailed] = useState(false);

  async function fetchImageURL() {
    const { data, error } = await supabase.storage
      .from("portfolio")
      .createSignedUrl(imageData.name, 60 * 60);

    if (error) {
      setLoading(() => false);
      setFailed(() => true);
      return;
    }
    console.log(data);
    setLoading(() => false);
    setImageURL(() => data.signedUrl);
  }

  useEffect(() => {
    fetchImageURL();
  }, []);

  return (
    <div className="w-30 h-30">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-xl bg-gray-200 animate-pulse"></div>
        </div>
      ) : failed ? (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="w-3/4 h-3/4" />
        </div>
      ) : null}
      <img
        key={imageData.id}
        srcSet={imageURL}
        alt={imageData.id}
        className="w-3/4 h-3/4 rounded-xl"
      />
      {loading ? (
        <div>
          <div className="h-3.5 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-2.5 w-1/2 mt-1 rounded-full bg-gray-200 animate-pulse "></div>
        </div>
      ) : (
        <div>
          <h3 className="w-full scrollbar-hidden overflow-auto scroll-auto whitespace-nowrap">
            {imageData.name}
          </h3>
          <p className="text-xs text-gray-500">
            {(+imageData.metadata.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}
    </div>
  );
};

interface LoadSignedImageProps {
  imageData: FileItem;
}
