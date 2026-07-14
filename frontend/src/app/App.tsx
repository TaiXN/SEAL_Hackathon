import { RouterProvider } from "react-router-dom";
<<<<<<< HEAD
import { router } from "./router";
=======
import { router } from "./routes";
>>>>>>> Tri-dev-pr
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <RouterProvider router={router} />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
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
