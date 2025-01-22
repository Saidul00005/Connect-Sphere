// // api/api.ts
// import axios from "axios";
// import { useSession } from "next-auth/react";

// let accessToken: string | null = null;

// // Function to get the access token from the session
// const getSessionToken = () => {
//   const session = useSession();
//   if (session?.data?.user?.token) {
//     accessToken = session.data.user.token;
//   }
// };

// // Initialize the Axios instance
// const api = axios.create({
//   baseURL: process.env.BACKEND_URL,
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: accessToken ? `Bearer ${accessToken}` : "",
//   },
// });

// // Interceptor to refresh the token if necessary
// api.interceptors.request.use((config) => {
//   if (!accessToken) {
//     getSessionToken();
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//   }
//   return config;
// }, error => {
//   Promise.reject(error);
// });