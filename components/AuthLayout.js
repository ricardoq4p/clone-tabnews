// components/AuthLayout.js

export default function AuthLayout({ title, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* 🔮 Glow 1 */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-3xl rounded-full top-[-100px] left-[-100px]" />

      {/* 🔮 Glow 2 */}
      <div className="absolute w-[500px] h-[500px] bg-purple-500/20 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

      {/* 🔥 Card */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 w-full max-w-md p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          {title}
        </h1>

        {children}
      </div>
    </div>
  );
}
