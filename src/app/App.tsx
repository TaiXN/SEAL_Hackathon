import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
// 1. IMPORT TOASTER VÀO
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <RouterProvider router={router} />

      {/* 2. ĐẶT MÁY PHÁT SÓNG Ở ĐÂY (Nó sẽ tàng hình cho tới khi được gọi) */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000, // Hiển thị 3 giây rồi tự biến mất
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </>
  );
}

export default App;
