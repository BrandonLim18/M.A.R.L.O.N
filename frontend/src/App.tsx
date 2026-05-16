import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import BookFormModal from "./components/BookFormModal";
import BorrowFormModal from "./components/BorrowFormModal";
import BorrowerBorrowModal from "./components/BorrowerBorrowModal";
import MyBorrowings from "./components/MyBorrowings";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import VerifyEmail from "./components/VerifyEmail";
import Profilepage from "./components/Profilepage";
import { api, ProfileData } from "./services/api";
import { Book, Borrowing, HistoryItem } from "./types";

const GENRES = [
  "All",
  "Romance",
  "Fantasy",
  "Science Fiction",
  "Historical Fiction",
  "Networking & Systems Administration",
  "Programming & Software Development",
  "Other",
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => api.isAuthenticated());

  const [authView, setAuthView] = useState<"login" | "register" | "verify">(
    "login",
  );
  const [emailForVerification, setEmailForVerification] = useState("");

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userRole, setUserRole] = useState<"admin" | "borrower" | null>(null);
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);

  const [bookSearch, setBookSearch] = useState("");
  const [borrowingSearch, setBorrowingSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All"); // New state for filtering

  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUserProfile(profile);
      setUserRole(profile.role);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [booksData, borrowingsData, historyData] = await Promise.all([
        api.getBooks(),
        api.getBorrowings(),
        api.getHistory(),
      ]);
      setBooks(booksData);
      setBorrowings(borrowingsData);
      setHistory(historyData);
    } catch (err: any) {
      const message = err.message || "Failed to fetch data.";
      if (
        message
          .toLowerCase()
          .includes("authentication credentials were not provided") ||
        message.toLowerCase().includes("invalid token")
      ) {
        api.logout();
        setIsLoggedIn(false);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchAll();
    }
  }, [isLoggedIn]);

  // UPDATED: Now filters by both Search Text AND Genre
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch = [
        book.title,
        book.author,
        book.genre || "",
        book.isbn || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(bookSearch.toLowerCase());

      const matchesGenre =
        selectedGenre === "All" || book.genre === selectedGenre;

      return matchesSearch && matchesGenre;
    });
  }, [books, bookSearch, selectedGenre]);

  const activeBorrowings = useMemo(
    () => borrowings.filter((item) => !item.return_date),
    [borrowings],
  );

  const filteredBorrowings = useMemo(() => {
    return activeBorrowings.filter((item) =>
      [
        item.borrower_name,
        item.borrower_contact_number,
        item.borrower_email_address,
        item.book_details?.title || "",
        item.borrow_date,
        item.due_date,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(borrowingSearch.toLowerCase()),
    );
  }, [activeBorrowings, borrowingSearch]);

  const historyRecords = useMemo(() => {
    return history.map((historyItem) => {
      const relatedBorrowing = borrowings.find(
        (b) => b.id === historyItem.transaction,
      );
      return {
        ...historyItem,
        borrower_name: relatedBorrowing?.borrower_name || "-",
        borrower_contact_number:
          relatedBorrowing?.borrower_contact_number || "-",
        borrower_email_address: relatedBorrowing?.borrower_email_address || "-",
        book_title:
          relatedBorrowing?.book_details?.title ||
          `Book ID: ${relatedBorrowing?.book || "-"}`,
        overdue_days: relatedBorrowing?.overdue_days ?? 0,
      };
    });
  }, [history, borrowings]);

  const filteredHistory = useMemo(() => {
    return historyRecords.filter((item) =>
      [
        item.id,
        item.transaction,
        item.borrower_name,
        item.borrower_contact_number,
        item.borrower_email_address,
        item.book_title,
        item.borrow_date,
        item.return_date || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(historySearch.toLowerCase()),
    );
  }, [historyRecords, historySearch]);

  const availableBooksCount = useMemo(
    () => books.filter((b) => b.copies_available > 0).length,
    [books],
  );
  const overdueCount = useMemo(
    () =>
      activeBorrowings.filter((item) => (item.overdue_days || 0) > 0).length,
    [activeBorrowings],
  );

  const handleCreateBook = async (data: Partial<Book>) => {
    try {
      await api.createBook(data);
      setBookModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditBook = async (data: Partial<Book>) => {
    if (!editingBook) return;
    try {
      await api.updateBook(editingBook.id, data);
      setEditingBook(null);
      setBookModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteBookId) return;
    try {
      await api.deleteBook(deleteBookId);
      setDeleteBookId(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBorrowBook = async (data: any) => {
    try {
      await api.createBorrowing(data);
      setBorrowModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBorrowForMe = async (data: any) => {
    try {
      await api.borrowForMe(data);
      setBorrowModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReturnBook = async (id: number) => {
    try {
      await api.returnBook(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveBorrowing(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this request?"))
      return;
    try {
      await api.rejectBorrowing(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
    setUserRole(null);
    setUserProfile(null);
  };

  const pageTitleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle:
        userRole === "borrower"
          ? "Your library account overview."
          : "Overview of library books, transactions, and records.",
    },
    books: {
      title: userRole === "borrower" ? "Available Books" : "Books Management",
      subtitle:
        userRole === "borrower"
          ? "Browse and borrow available books from our library."
          : "Add, edit, search, and manage available books.",
    },
    borrowings: {
      title: "Borrowings",
      subtitle: "Track active borrowing records and return transactions.",
    },
    "my-borrowings": {
      title: "My Borrowings",
      subtitle: "View your active borrowings and deadlines.",
    },
    history: {
      title: "History",
      subtitle: "Review completed return records and borrowing history.",
    },
    profile: {
      title: "Profile",
      subtitle: "View personal account information.",
    },
  };

  if (!isLoggedIn) {
    if (authView === "verify")
      return (
        <VerifyEmail
          email={emailForVerification}
          onSuccess={() => setAuthView("login")}
        />
      );
    return (
      <LoginPage
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setCurrentPage("dashboard");
        }}
        onRegisterSuccess={(email) => {
          setEmailForVerification(email);
          setAuthView("verify");
        }}
      />
    );
  }

  // --- REUSABLE GENRE FILTER COMPONENT ---
  const GenreFilter = ({ activeColor }: { activeColor: string }) => (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide w-full mask-edges">
      {GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => setSelectedGenre(genre)}
          className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all shadow-sm ${
            selectedGenre === genre
              ? `${activeColor} text-white ring-2 ring-offset-2 ring-blue-100`
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        userRole={userRole || undefined}
      />

      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        <Header
          title={pageTitleMap[currentPage]?.title || "Dashboard"}
          subtitle={pageTitleMap[currentPage]?.subtitle || ""}
        />

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg p-8 text-slate-600">
            Loading data...
          </div>
        ) : (
          <div className="overflow-y-auto pr-2 pb-10 flex-1">
            {currentPage === "dashboard" && userRole === "admin" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  <StatCard label="Total Books" value={books.length} />
                  <StatCard
                    label="Available Titles"
                    value={availableBooksCount}
                  />
                  <StatCard
                    label="Active Borrowings"
                    value={activeBorrowings.length}
                  />
                  <StatCard label="Overdue Records" value={overdueCount} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 p-6 h-fit">
                    <h3 className="text-2xl font-bold text-slate-800 mb-5">
                      Recent Borrowings
                    </h3>
                    <div className="space-y-3">
                      {borrowings.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 flex justify-between items-center shadow-sm"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.borrower_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.book_details?.title ||
                                `Book ID: ${item.book}`}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${item.return_date ? "bg-slate-200 text-slate-700" : item.status === "Pending" ? "bg-slate-100 text-slate-600" : (item.overdue_days || 0) > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {item.return_date
                              ? "Returned"
                              : item.status === "Pending"
                                ? "Pending"
                                : (item.overdue_days || 0) > 0
                                  ? `Overdue: ${item.overdue_days || 0} day(s)`
                                  : "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 p-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-5">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          setBookModalOpen(true);
                        }}
                        className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">Add Book</p>
                        <p className="text-sm text-blue-100 mt-1">
                          Register a new book in the system.
                        </p>
                      </button>
                      <button
                        onClick={() => setCurrentPage("books")}
                        className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">Manage Books</p>
                        <p className="text-sm text-amber-100 mt-1">
                          Edit or remove book records.
                        </p>
                      </button>
                      <button
                        onClick={() => setCurrentPage("history")}
                        className="rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">View History</p>
                        <p className="text-sm text-violet-100 mt-1">
                          Check completed borrowing records.
                        </p>
                      </button>
                      <button
                        onClick={() => setCurrentPage("borrowings")}
                        className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                      >
                        <p className="font-bold text-lg">Borrowings</p>
                        <p className="text-sm text-emerald-100 mt-1">
                          Manage borrowing transactions.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentPage === "dashboard" && userRole === "borrower" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <StatCard
                    label="Available Books"
                    value={availableBooksCount}
                  />
                  <StatCard
                    label="My Active Borrowings"
                    value={activeBorrowings.length}
                  />
                  <StatCard label="Overdue Items" value={overdueCount} />
                </div>
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 p-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-5">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setCurrentPage("books")}
                      className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                    >
                      <p className="font-bold text-lg">Borrow a Book</p>
                      <p className="text-sm text-emerald-100 mt-1">
                        Browse and borrow from available books.
                      </p>
                    </button>
                    <button
                      onClick={() => setCurrentPage("my-borrowings")}
                      className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-5 text-left shadow-lg hover:scale-[1.02] transition"
                    >
                      <p className="font-bold text-lg">My Borrowings</p>
                      <p className="text-sm text-blue-100 mt-1">
                        View your borrowings and deadlines.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentPage === "books" && userRole === "admin" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                {/* Search & Header Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search by title, author, genre, or ISBN"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => {
                      setEditingBook(null);
                      setBookModalOpen(true);
                    }}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition whitespace-nowrap"
                  >
                    + Add Book
                  </button>
                </div>

                {/* Genre Filter Pills */}
                <GenreFilter activeColor="bg-blue-600" />

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left min-w-[1000px] bg-white">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="py-4 px-4 font-bold rounded-tl-2xl">
                          Title
                        </th>
                        <th className="py-4 px-4 font-bold">Author</th>
                        <th className="py-4 px-4 font-bold">Category</th>
                        <th className="py-4 px-4 font-bold">ISBN</th>
                        <th className="py-4 px-4 font-bold">Year</th>
                        <th className="py-4 px-4 font-bold text-center">
                          Available
                        </th>
                        <th className="py-4 px-4 font-bold text-center">
                          Borrowed
                        </th>
                        <th className="py-4 px-4 font-bold text-center">
                          Status
                        </th>
                        <th className="py-4 px-4 font-bold rounded-tr-2xl text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr
                          key={book.id}
                          className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                        >
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {book.title}
                          </td>
                          <td className="py-4 px-4 text-slate-700 font-medium">
                            {book.author}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                              {book.genre || "Other"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500 text-sm">
                            {book.isbn || "-"}
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {book.year_published || "-"}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800 text-center">
                            {book.copies_available}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800 text-center">
                            {book.copies_borrowed}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full font-bold ${book.copies_available > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                            >
                              {book.copies_available > 0
                                ? "Available"
                                : "Borrowed"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingBook(book);
                                  setBookModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteBookId(book.id)}
                                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredBooks.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="py-16 text-center text-slate-500 font-medium text-lg"
                          >
                            No books found in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "books" && userRole === "borrower" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                {/* Search Row */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by title, author, genre, or ISBN"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Genre Filter Pills */}
                <GenreFilter activeColor="bg-emerald-600" />

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left min-w-[900px] bg-white">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="py-4 px-4 font-bold rounded-tl-2xl">
                          Title
                        </th>
                        <th className="py-4 px-4 font-bold">Author</th>
                        <th className="py-4 px-4 font-bold">Category</th>
                        <th className="py-4 px-4 font-bold">Year</th>
                        <th className="py-4 px-4 font-bold text-center">
                          Status
                        </th>
                        <th className="py-4 px-4 font-bold rounded-tr-2xl text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => {
                        const isAvailable = book.copies_available > 0;
                        return (
                          <tr
                            key={book.id}
                            className="border-b border-slate-100 hover:bg-emerald-50/40 transition"
                          >
                            <td className="py-5 px-4 font-bold text-slate-800">
                              {book.title}
                            </td>
                            <td className="py-5 px-4 text-slate-700 font-medium">
                              {book.author}
                            </td>
                            <td className="py-5 px-4">
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                {book.genre || "Other"}
                              </span>
                            </td>
                            <td className="py-5 px-4 text-slate-500">
                              {book.year_published || "-"}
                            </td>
                            <td className="py-5 px-4 text-center">
                              {isAvailable ? (
                                <span className="text-sm font-bold text-emerald-600">
                                  {book.copies_available} Available
                                </span>
                              ) : (
                                <span className="text-sm font-bold text-slate-400">
                                  Currently Borrowed
                                </span>
                              )}
                            </td>
                            <td className="py-5 px-4 flex justify-end">
                              <button
                                disabled={!isAvailable}
                                onClick={() => {
                                  setEditingBook(book);
                                  setBorrowModalOpen(true);
                                }}
                                className={`px-5 py-2.5 rounded-xl font-bold shadow-sm transition ${isAvailable ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                              >
                                Request Borrow
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredBooks.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-16 text-center text-slate-500 font-medium text-lg"
                          >
                            No available books found in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* (Other Pages remain unchanged: borrowings, my-borrowings, history, profile) */}
            {currentPage === "borrowings" && userRole === "admin" && (
              // ... existing code
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search borrower, contact, email, book, or date"
                    value={borrowingSearch}
                    onChange={(e) => setBorrowingSearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => setBorrowModalOpen(true)}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    New Borrowing
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-4 pr-4 font-bold">Borrower</th>
                        <th className="py-4 pr-4 font-bold">Contact</th>
                        <th className="py-4 pr-4 font-bold">Email</th>
                        <th className="py-4 pr-4 font-bold">Book</th>
                        <th className="py-4 pr-4 font-bold">Borrow Date</th>
                        <th className="py-4 pr-4 font-bold">Due Date</th>
                        <th className="py-4 pr-4 font-bold">Status</th>
                        <th className="py-4 pr-4 font-bold">Overdue</th>
                        <th className="py-4 pr-4 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBorrowings.map((item) => {
                        const isPending = item.status === "Pending";
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                          >
                            <td className="py-5 pr-4 font-semibold text-slate-800">
                              {item.borrower_name}
                            </td>
                            <td className="py-5 pr-4">
                              {item.borrower_contact_number}
                            </td>
                            <td className="py-5 pr-4">
                              {item.borrower_email_address}
                            </td>
                            <td className="py-5 pr-4">
                              {item.book_details?.title ||
                                `Book ID: ${item.book}`}
                            </td>
                            <td className="py-5 pr-4">{item.borrow_date}</td>
                            <td className="py-5 pr-4">
                              {isPending ? (
                                <span className="text-slate-400">TBD</span>
                              ) : (
                                item.due_date
                              )}
                            </td>
                            <td className="py-5 pr-4">
                              <span
                                className={`text-xs px-4 py-2 rounded-full font-bold ${isPending ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}
                              >
                                {isPending ? "Pending" : "Active"}
                              </span>
                            </td>
                            <td className="py-5 pr-4">
                              <span
                                className={`text-xs px-4 py-2 rounded-full font-bold ${isPending ? "text-slate-400 bg-transparent px-0" : (item.overdue_days || 0) > 0 ? "bg-red-100 text-red-700" : "text-slate-600 bg-transparent px-0"}`}
                              >
                                {isPending
                                  ? "-"
                                  : `${item.overdue_days || 0} day(s)`}
                              </span>
                            </td>
                            <td className="py-5 pr-4">
                              {isPending ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 text-sm transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(item.id)}
                                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 font-medium shadow-sm hover:bg-red-50 text-sm transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReturnBook(item.id)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow hover:opacity-95"
                                >
                                  Return
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}{" "}
                      {filteredBorrowings.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-10 text-center text-slate-500"
                          >
                            No active borrowing records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "my-borrowings" && userRole === "borrower" && (
              <MyBorrowings
                borrowings={activeBorrowings}
                onReturnBook={handleReturnBook}
              />
            )}

            {currentPage === "history" && userRole === "admin" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search history ID, borrower, email, book, or date"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full md:max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-4 pr-4 font-bold">ID</th>
                        <th className="py-4 pr-4 font-bold">Borrower</th>
                        <th className="py-4 pr-4 font-bold">Contact</th>
                        <th className="py-4 pr-4 font-bold">Email</th>
                        <th className="py-4 pr-4 font-bold">Book</th>
                        <th className="py-4 pr-4 font-bold">Borrow Date</th>
                        <th className="py-4 pr-4 font-bold">Return Date</th>
                        <th className="py-4 pr-4 font-bold">Overdue</th>
                        <th className="py-4 pr-4 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                        >
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {item.id}
                          </td>
                          <td className="py-5 pr-4 font-semibold text-slate-800">
                            {item.borrower_name}
                          </td>
                          <td className="py-5 pr-4">
                            {item.borrower_contact_number}
                          </td>
                          <td className="py-5 pr-4">
                            {item.borrower_email_address}
                          </td>
                          <td className="py-5 pr-4">{item.book_title}</td>
                          <td className="py-5 pr-4">{item.borrow_date}</td>
                          <td className="py-5 pr-4">
                            {item.return_date || "-"}
                          </td>
                          <td className="py-5 pr-4">
                            <span
                              className={`text-xs px-4 py-2 rounded-full font-bold ${(item.overdue_days || 0) > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {item.overdue_days || 0} day(s)
                            </span>
                          </td>
                          <td className="py-5 pr-4">
                            <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold text-sm">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}{" "}
                      {filteredHistory.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="py-10 text-center text-slate-500"
                          >
                            No history records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPage === "profile" && (
              <Profilepage borrowings={borrowings} history={history} />
            )}
          </div>
        )}

        {/* Modals */}
        {userRole === "admin" && (
          <>
            <BookFormModal
              open={bookModalOpen}
              onClose={() => {
                setBookModalOpen(false);
                setEditingBook(null);
              }}
              onSubmit={editingBook ? handleEditBook : handleCreateBook}
              editingBook={editingBook}
            />
            <BorrowFormModal
              open={borrowModalOpen}
              books={books}
              onClose={() => setBorrowModalOpen(false)}
              onSubmit={handleBorrowBook}
            />
            <ConfirmModal
              open={deleteBookId !== null}
              title="Delete Book"
              message="Are you sure you want to delete this book record?"
              onCancel={() => setDeleteBookId(null)}
              onConfirm={handleDeleteBook}
            />
          </>
        )}

        {userRole === "borrower" && (
          <BorrowerBorrowModal
            open={borrowModalOpen}
            books={books}
            onClose={() => {
              setBorrowModalOpen(false);
              setEditingBook(null);
            }}
            onSubmit={handleBorrowForMe}
          />
        )}
      </main>
    </div>
  );
}

export default App;
