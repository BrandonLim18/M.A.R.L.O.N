import { useEffect, useState } from "react";
import { Book } from "../types";


type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Book>) => void;
  editingBook?: Book | null;
};


const initialState = {
  title: "",
  author: "",
  isbn: "",
  genre: "",
  year_published: "",
  copies_available: 1,
};


export default function BookFormModal({
  open,
  onClose,
  onSubmit,
  editingBook,
}: Props) {
  const [form, setForm] = useState<any>(initialState);


  useEffect(() => {
    if (editingBook) {
      setForm({
        title: editingBook.title || "",
        author: editingBook.author || "",
        isbn: editingBook.isbn || "",
        genre: editingBook.genre || "",
        year_published: editingBook.year_published || "",
        copies_available: editingBook.copies_available,
      });
    } else {
      setForm(initialState);
    }
  }, [editingBook, open]);


  if (!open) return null;


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;


    setForm((prev: any) => ({
      ...prev,
      [name]:
        name === "copies_available" || name === "year_published"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();


   onSubmit({
  ...form,
  isbn: form.isbn || null,
  genre: form.genre || null,
  year_published: form.year_published || null,
  copies_borrowed: editingBook?.copies_borrowed ?? 0,
  status: form.copies_available === 0 ? "Borrowed" : "Available",
});


  };


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-5">
          {editingBook ? "Edit Book" : "Add New Book"}
        </h3>


        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="title"
            placeholder="Book Title"
            value={form.title}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
            required
          />
          <input
            name="author"
            placeholder="Author"
            value={form.author}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
            required
          />
          <input
            name="isbn"
            placeholder="ISBN"
            value={form.isbn}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
          />
          <input
            name="genre"
            placeholder="Genre"
            value={form.genre}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
          />
          <input
            type="number"
            name="year_published"
            placeholder="Year Published"
            value={form.year_published}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
          />
          <input
            type="number"
            name="copies_available"
            placeholder="Available Copies"
            value={form.copies_available}
            onChange={handleChange}
            className="border border-slate-300 rounded-xl px-4 py-3"
            min={0}
            required
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
              className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {editingBook ? "Save Changes" : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
