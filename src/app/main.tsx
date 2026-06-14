import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Trỏ đúng đường dẫn vào file App.tsx
// @ts-ignore
import "../styles/index.css"; // Nhớ trỏ đúng file CSS của bà nha

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
