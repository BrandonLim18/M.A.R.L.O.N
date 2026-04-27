import { Book, Borrowing, HistoryItem } from "../types";

const API_BASE = "http://127.0.0.1:8000/api";

export type ProfileData = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  address: string | null;
  age: number | null;
  birthday: string | null;
  role: "admin" | "borrower";
  username?: string;
  profile_picture?: string;
  bio?: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  let data: any = null;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    if (data && typeof data === 'object') {
      const errorMsg = Object.entries(data)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join("\n");
      throw new Error(errorMsg || "Something went wrong.");
    }
    throw new Error(data?.error || data?.detail || "Something went wrong.");
  }

  return data as T;
}

const getHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
};

export const api = {
  getBooks: async (): Promise<Book[]> => {
    const res = await fetch(`${API_BASE}/books/`, {
      headers: getHeaders(),
    });
    return handleResponse<Book[]>(res);
  },

  getBorrowings: async (): Promise<Borrowing[]> => {
    const res = await fetch(`${API_BASE}/borrowings/`, {
      headers: getHeaders(),
    });
    return handleResponse<Borrowing[]>(res);
  },

  getHistory: async (): Promise<HistoryItem[]> => {
    const res = await fetch(`${API_BASE}/history/`, {
      headers: getHeaders(),
    });
    return handleResponse<HistoryItem[]>(res);
  },

  getProfile: async (): Promise<ProfileData> => {
    const res = await fetch(`${API_BASE}/accounts/profile/`, {
      headers: getHeaders(),
    });
    return handleResponse<ProfileData>(res);
  },

  createBook: async (bookData: Partial<Book>): Promise<Book> => {
    const res = await fetch(`${API_BASE}/books/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(bookData),
    });
    return handleResponse<Book>(res);
  },

  updateBook: async (id: number, bookData: Partial<Book>): Promise<Book> => {
    const res = await fetch(`${API_BASE}/books/${id}/`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(bookData),
    });
    return handleResponse<Book>(res);
  },

  deleteBook: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/books/${id}/`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    await handleResponse(res);
  },

  createBorrowing: async (data: any): Promise<Borrowing> => {
    const res = await fetch(`${API_BASE}/borrowings/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Borrowing>(res);
  },

  borrowForMe: async (data: any): Promise<Borrowing> => {
    const res = await fetch(`${API_BASE}/borrowings/borrow_for_me/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Borrowing>(res);
  },

  returnBook: async (id: number): Promise<Borrowing> => {
    const res = await fetch(`${API_BASE}/borrowings/${id}/return_book/`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<Borrowing>(res);
  },

  approveBorrowing: async (id: number): Promise<Borrowing> => {
    const res = await fetch(`${API_BASE}/borrowings/${id}/approve/`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<Borrowing>(res);
  },

  rejectBorrowing: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/borrowings/${id}/reject/`, {
      method: "POST",
      headers: getHeaders(),
    });
    await handleResponse(res);
  },

  login: async (credentials: { email: string; password: string }): Promise<{ token: string }> => {
    const res = await fetch(`${API_BASE}/accounts/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse<{ token: string }>(res);

    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }

    return data;
  },

  register: async (formData: FormData): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/accounts/register/`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<{ message: string }>(res);
  },

  updateProfile: async (formData: FormData): Promise<ProfileData> => {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE}/accounts/update-profile/`, {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse<ProfileData>(res);
  },

  logout: () => localStorage.removeItem("authToken"),

  isAuthenticated: () => !!localStorage.getItem("authToken"),
};
