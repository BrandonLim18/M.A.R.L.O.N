import React from "react";

const ProfilePage: React.FC = () => {
  // Dummy data as requested for the UI layout
  const userData = {
    name: "Marlon Brandon Lim",
    email: "marlon.lim@example.com",
    address: "123 Innovation Drive, Tech City, PH 1234",
    age: 24,
    birthday: "April 19, 2002",
    role: "System Administrator",
    joinDate: "January 2024",
    bio: "Passionate about library management systems and building efficient frontend architectures."
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-4xl font-bold shadow-inner">
                {userData.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{userData.name}</h2>
            <p className="text-blue-600 font-semibold">{userData.role}</p>
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">12</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Books</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">4</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">Personal Information</h3>
              <button className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition">
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-lg font-semibold text-slate-800">{userData.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Birthday</p>
                <p className="text-lg font-semibold text-slate-800">{userData.birthday}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Age</p>
                <p className="text-lg font-semibold text-slate-800">{userData.age} Years Old</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Address</p>
                <p className="text-lg font-semibold text-slate-800">{userData.address}</p>
              </div>
            </div>

            <div className="mt-10">
              <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Biography</h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 italic">
                "{userData.bio}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings / Recent Activity */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: "Borrowed", book: "The Great Gatsby", date: "2 hours ago" },
            { action: "Returned", book: "Clean Code", date: "Yesterday" },
            { action: "Updated", book: "Profile Information", date: "3 days ago" },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.action === 'Borrowed' ? 'bg-emerald-100 text-emerald-600' : 
                  item.action === 'Returned' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="text-xs font-bold">{item.action[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{item.action} <span className="text-slate-500 font-normal">"{item.book}"</span></p>
                  <p className="text-xs text-slate-400 font-medium">{item.date}</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
