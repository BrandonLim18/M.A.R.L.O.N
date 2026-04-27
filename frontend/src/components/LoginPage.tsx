import React, { useState } from "react";
import { api } from "../services/api";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onRegisterSuccess: (email: string) => void; // Added this line
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onRegisterSuccess }) => { // Extracted it here
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return email.includes("@");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      await api.login({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message || "Login failed. Check your credentials.";
      setError(msg.includes("401") ? "Invalid email or password" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("username", username);
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      if (profilePicture) {
        formData.append("profile_picture", profilePicture);
      }

      await api.register(formData);
      onRegisterSuccess(email);
    } catch (err: any) {
      const msg = err.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setUsername("");
    setProfilePicture(null);
    setError("");
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">M.A.R.L.O.N</h1>
          <p className="text-slate-500 mt-2">Library Management System</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
              mode === "register"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Profile Picture (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;