import { useMemo, useState } from "react";
import { Book } from "../types";


type Props = {
  open: boolean;
  books: Book[];
  onClose: () => void;
  onSubmit: (data: any) => void;
};


export default function BorrowFormModal({
  open,
  books,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    borrower_name: "",
    borrower_contact_number: "",
    borrower_email_address: "",
    book: "",
    borrow_date: "",
    due_date: "",
  });


  const availableBooks = useMemo(
    () =>
      books.filter(
        (book) => book.copies_available > 0 && book.status === "Available"
      ),
    [books]
  );


  if (!open) return null;


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();


    onSubmit({
      ...form,
      book: Number(form.book),
      borrow_date: form.borrow_date || undefined,
      due_date: form.due_date || undefined,
    });
  };


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-5">Borrow Book</h3>


        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="borrower_name"
            placeholder="Borrower Name"
            value={form.borrower_name}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
            required
          />
          <input
            name="borrower_contact_number"
            placeholder="Contact Number"
            value={form.borrower_contact_number}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
            required
          />
          <input
            type="email"
            name="borrower_email_address"
            placeholder="Email Address"
            value={form.borrower_email_address}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3 md:col-span-2"
            required
          />
          <select
            name="book"
            value={form.book}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3 md:col-span-2"
            required
          >
            <option value="">Select Available Book</option>
            {availableBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author} ({book.copies_available} available)
              </option>
            ))}
          </select>
          <input
            type="date"
            name="borrow_date"
            value={form.borrow_date}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
          />
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
          />


          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm Borrow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
