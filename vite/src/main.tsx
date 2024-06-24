// src/main.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { getAccessToken } from "@trufflehq/sdk";

const Main = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          setAccessToken(token);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching access token:", error);
        setIsAuthenticated(false);
      }
    };

    fetchAccessToken();
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <App accessToken={accessToken} />
      ) : (
        <div>You're not logged in!</div>
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
