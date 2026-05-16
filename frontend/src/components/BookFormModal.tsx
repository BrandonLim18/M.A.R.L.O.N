import { useEffect, useState } from "react";
import { Book } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Book>) => void;
  editingBook?: Book | null;
};

// The official list of genres (matching Django)
const GENRES = [
  "Romance",
  "Fantasy",
  "Science Fiction",
  "Historical Fiction",
  "Networking & Systems Administration",
  "Programming & Software Development",
  "Other",
];

const initialState = {
  title: "",
  author: "",
  isbn: "",
  genre: "Other", // Default to Other
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
        genre: editingBook.genre || "Other",
        year_published: editingBook.year_published || "",
        copies_available: editingBook.copies_available,
      });
    } else {
      setForm(initialState);
    }
  }, [editingBook, open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
      genre: form.genre || "Other",
      year_published: form.year_published || null,
      copies_borrowed: editingBook?.copies_borrowed ?? 0,
      status: form.copies_available === 0 ? "Borrowed" : "Available",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">
          {editingBook ? "Edit Book" : "Add New Book"}
        </h3>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">
              Title *
            </label>
            <input
              name="title"
              placeholder="Book Title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-slate-300 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">
              Author *
            </label>
            <input
              name="author"
              placeholder="Author Name"
              value={form.author}
              onChange={handleChange}
              className="w-full border border-slate-300 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">
              Category / Genre
            </label>
            <select
              name="genre"
              value={form.genre}
              onChange={handleChange}
              className="w-full border border-slate-300 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 cursor-pointer"
            >
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">
              ISBN
            </label>
            <input
              name="isbn"
              placeholder="ISBN Number"
              value={form.isbn}
              onChange={handleChange}
              className="w-full border border-slate-300 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">
              Year Published
            </label>
            <input
              type="number"
              name="year_published"
              placeholder="YYYY"
              value={form.year_published}
              onChange={handleChange}
              className="w-full border border-slate-300 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 ml-1">
              Copies Available *
            </label>
            <input
              type="number"
              name="copies_available"
              placeholder="1"
              value={form.copies_available}
              onChange={handleChange}
              className="w-full border border-slate-300 bg-slate-50 focus:bg-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              min={0}
              required
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              {editingBook ? "Save Changes" : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
