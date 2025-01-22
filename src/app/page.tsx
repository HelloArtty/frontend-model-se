'use client';
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [foodData, setFoodData] = useState<any[]>([]);

  // Fetch data from food_data.json
  useEffect(() => {
    const fetchFoodData = async () => {
      try {
        const response = await fetch("/food_data.json");
        if (!response.ok) {
          throw new Error("Failed to load food data");
        }
        const data = await response.json();
        console.log("Food data received from backend:", data);
        setFoodData(data);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error instanceof Error ? error.message : "Failed to load food data",
        });
      }
    };

    fetchFoodData();
  }, []);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleSubmit = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "ใส่รูปก่อนนะจ๊ะหล่อน",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8080/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }

      const data = await response.json();
      console.log("Prediction Result:", data);

      if (typeof data === "number") {
        setResult({ id: data });
      } else if (data && typeof data.class === "number") {
        setResult({ id: data.class });
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error instanceof Error ? error.message : "Server ดับไหมจ๊ะ",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFoodName = (id: number | undefined) => {
    if (id === undefined || id === null) {
      return { th: "ไม่พบข้อมูล", en: "Data not found" };
    }

    const food = foodData.find((item) => item.id === id);
    if (!food) {
      console.log(`Food with ID ${id} not found`);
    }
    return food ? food.name : { th: "ไม่พบข้อมูล", en: "Data not found" };
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
        <h1 className="text-3xl font-bold text-gray-700 mb-8">
          Test Predict Food
        </h1>
        <div
          {...getRootProps()}
          className="w-96 h-60 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white rounded-lg cursor-pointer hover:shadow-lg transition"
        >
          <input {...getInputProps()} />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Uploaded preview"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <p className="text-gray-500">
              ใส่รูปสิจ๊ะเบ๊บ
            </p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "สักครู่จ้า~~" : "กดจ้า"}
        </button>

        {result && (
          <div className="mt-8 w-96 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Prediction</h2>
            <p className="text-gray-600">
              <strong>Class ID:</strong> {result.id}
            </p>
            <p className="text-gray-600">
              <strong>Thai Name:</strong> {getFoodName(result.id)?.th || "N/A"}
            </p>
            <p className="text-gray-600">
              <strong>English Name:</strong> {getFoodName(result.id)?.en || "N/A"}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
