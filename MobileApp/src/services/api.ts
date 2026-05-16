import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.254.5:8000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercept requests to inject the token from AsyncStorage
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const api = {
  // --- AUTHENTICATION ---
  login: async (credentials: any) => {
    const response = await apiClient.post("/accounts/login/", credentials);
    if (response.data.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },

  register: async (formData: FormData) => {
    const response = await apiClient.post("/accounts/register/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  verifyEmail: async (data: { email: string; otp: string }) => {
    const response = await apiClient.post("/accounts/verify-otp/", data);
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem("auth_token");
  },

  // --- DATA FETCHING ---
  getProfile: async () => {
    const response = await apiClient.get("/accounts/profile/");
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    const response = await apiClient.put(
      "/accounts/update-profile/",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  getBooks: async () => {
    const response = await apiClient.get("/books/");
    return response.data;
  },

  getBorrowings: async () => {
    const response = await apiClient.get("/borrowings/");
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get("/history/");
    return response.data;
  },

  // --- BORROWING ACTIONS ---
  approveBorrowing: async (id: number) => {
    const response = await apiClient.post(`/borrowings/${id}/approve/`);
    return response.data;
  },

  rejectBorrowing: async (id: number) => {
    const response = await apiClient.post(`/borrowings/${id}/reject/`);
    return response.data;
  },

  returnBook: async (id: number) => {
    const response = await apiClient.post(`/borrowings/${id}/return_book/`);
    return response.data;
  },

  // --- BOOKS & CATALOG ACTIONS ---
  createBook: async (data: any) => {
    const response = await apiClient.post("/books/", data);
    return response.data;
  },

  updateBook: async (id: number, data: any) => {
    const response = await apiClient.put(`/books/${id}/`, data);
    return response.data;
  },

  deleteBook: async (id: number) => {
    const response = await apiClient.delete(`/books/${id}/`);
    return response.data;
  },

  borrowBook: async (data: {
    book: number;
    borrower_contact_number: string;
  }) => {
    const response = await apiClient.post("/borrowings/borrow_for_me/", data);
    return response.data;
  },

  sendChatMessage: async (message: string) => {
    const response = await apiClient.post('/chat/', { message });
    return response.data;
  },
};
