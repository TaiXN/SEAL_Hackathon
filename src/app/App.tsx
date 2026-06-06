import { RouterProvider } from "react-router-dom";
import { router } from "./routes"; // Import cái bản đồ routes bà vừa làm xong

export default function App() {
  // Trả về cái trục thang máy (RouterProvider) bao bọc toàn bộ dự án
  return <RouterProvider router={router} />;
}
