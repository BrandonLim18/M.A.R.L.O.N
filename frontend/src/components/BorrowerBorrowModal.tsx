import { useState } from "react";
import { Book } from "../types";
import ConfirmModal from "./ConfirmModal";

type Props = {
  open: boolean;
  books: Book[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
};

export default function BorrowerBorrowModal({ open, books, onClose, onSubmit }: Props) {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [contactNumber, setContactNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const availableBooks = books.filter((b) => b.copies_available > 0);

  const handleSubmit = async () => {
    if (!selectedBookId || !contactNumber.trim()) {
      setError("Please select a book and provide contact number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit({
        book: selectedBookId,
        borrower_contact_number: contactNumber,
      });
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to borrow book.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBookId(null);
    setContactNumber("");
    setError("");
  };

  if (!open) return null;

  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Borrow a Book</h2>

          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Book
              </label>
              <select
                value={selectedBookId || ""}
                onChange={(e) => setSelectedBookId(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Choose a book --</option>
                {availableBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} by {book.author} ({book.copies_available} available)
                  </option>
                ))}
              </select>
            </div>

            {selectedBook && (
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Duration:</span> 14 days upon admin approval
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Your phone number"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading || !selectedBookId || !contactNumber.trim()}
              className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Borrowing..." : "Borrow"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Borrow Request"
        message={`Request to borrow "${selectedBook?.title}"? The 14-day borrowing period will begin once approved by an admin.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          handleSubmit();
        }}
      />
    </>
  );
}
