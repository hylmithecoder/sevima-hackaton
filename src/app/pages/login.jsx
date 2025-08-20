"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

      const res = await fetch("https://ilmeee.com/api_sevima/data_user/");
      const users = await res.json();
      console.log(users);
      const user = users.find((u) => u.username === username);
      console.log(user);
      if (!user) {
        setError("User tidak ditemukan");
        return;
      }

      const validPassword = await bcrypt.compare(password, user.password);
      console.log(validPassword);
      if (!validPassword) {
        setError("Password salah");
        return;
      }
      localStorage.setItem("user", JSON.stringify(user));
      // ✅ Redirect sesuai role
      if (user.role === "satpam") {
        navigate.push("/mobile");
      } else if (user.role === "admin") {
        navigate.push("/dashboard");
      } else {
        setError("Role tidak dikenali");
      
    } 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block mb-2 text-gray-600">Username</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-gray-600">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Login
        </button>
      </form>
    </div>
  );
}
