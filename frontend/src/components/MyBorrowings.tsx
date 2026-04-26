import { Borrowing } from "../types";

type Props = {
  borrowings: Borrowing[];
  onReturnBook?: (id: number) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  isAdmin?: boolean;
};

export default function MyBorrowings({ borrowings, onReturnBook, onApprove, onReject, isAdmin }: Props) {
  const activeBorrowings = borrowings.filter((b) => b.status !== "Returned");

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-7">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Borrowings & Deadlines</h2>

      {activeBorrowings.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <p>You don't have any active borrowings.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-4 pr-4 font-bold">Book Title</th>
                <th className="py-4 pr-4 font-bold">Author</th>
                <th className="py-4 pr-4 font-bold">Borrow Date</th>
                <th className="py-4 pr-4 font-bold">Due Date</th>
                <th className="py-4 pr-4 font-bold">Status</th>
                <th className="py-4 pr-4 font-bold">Days Left</th>
                {(onApprove || onReturnBook) && <th className="py-4 pr-4 font-bold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {activeBorrowings.map((item) => {
                const isPending = item.status === "Pending";
                const dueDate = new Date(item.due_date);
                const today = new Date();
                const daysLeft = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = !isPending && daysLeft < 0;

                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-blue-50/60 transition"
                  >
                    <td className="py-5 pr-4 font-semibold text-slate-800">
                      {item.book_details?.title || `Book ID: ${item.book}`}
                    </td>
                    <td className="py-5 pr-4 text-slate-700">
                      {item.book_details?.author || "-"}
                    </td>
                    <td className="py-5 pr-4 text-slate-700">{item.borrow_date}</td>
                    <td className="py-5 pr-4">
                      <span
                        className={`font-semibold ${
                          isPending ? "text-slate-400" : isOverdue ? "text-red-600" : "text-slate-800"
                        }`}
                      >
                        {isPending ? "TBD" : item.due_date}
                      </span>
                    </td>
                    <td className="py-5 pr-4">
                      <span
                        className={`text-xs px-4 py-2 rounded-full font-bold ${
                          isPending
                            ? "bg-slate-100 text-slate-600"
                            : isOverdue
                            ? "bg-red-100 text-red-700"
                            : daysLeft <= 3
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isPending ? "Pending" : isOverdue ? "Overdue" : daysLeft <= 3 ? "Due Soon" : "Active"}
                      </span>
                    </td>
                    <td className="py-5 pr-4">
                      <span
                        className={`font-semibold ${
                          isPending
                            ? "text-slate-400"
                            : isOverdue
                            ? "text-red-600"
                            : daysLeft <= 3
                            ? "text-yellow-600"
                            : "text-slate-800"
                        }`}
                      >
                        {isPending ? "-" : isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                      </span>
                    </td>
                    {(onApprove || onReturnBook) && (
                      <td className="py-5 pr-4">
                        {isPending && isAdmin && onApprove && onReject && (
                          <div className="flex gap-2">
                            <button onClick={() => onApprove(item.id)} className="text-xs px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors">Approve</button>
                            <button onClick={() => onReject(item.id)} className="text-xs px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors">Reject</button>
                          </div>
                        )}
                        {!isPending && onReturnBook && isAdmin && (
                          <button onClick={() => onReturnBook(item.id)} className="text-xs px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors">Return Book</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
