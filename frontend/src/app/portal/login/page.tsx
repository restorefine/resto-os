"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { portalLogin } from "@/lib/auth";
import { useStore } from "@/store/useStore";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function PortalLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const setCurrentUser = useStore((s) => s.setCurrentUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const user = await portalLogin(data.email, data.password);
      setCurrentUser(user);
      router.push(`/portal/${user.id}`);
    } catch {
      setError("root", { message: "Invalid email or password" });
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left — black brand panel */}
      <div className="hidden lg:flex w-[46%] bg-black flex-col justify-between p-10 shrink-0">
        <div className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans">
          RestoRefine Studios
        </div>

        <div>
          <div
            className="text-white font-black leading-none tracking-tighter select-none"
            style={{ fontSize: "clamp(56px, 6.5vw, 88px)" }}
          >
            CLIENT
          </div>
          <div
            className="text-white font-black leading-none tracking-tighter select-none"
            style={{ fontSize: "clamp(56px, 6.5vw, 88px)" }}
          >
            PORTAL
            <span className="text-red-600">.</span>
          </div>
          <div
            className="mt-3 select-none"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <em
              className="text-white/80 font-light italic"
              style={{ fontSize: "clamp(28px, 3.5vw, 46px)" }}
            >
              Your account,
            </em>
            <br />
            <em
              className="text-white/80 font-light italic"
              style={{ fontSize: "clamp(28px, 3.5vw, 46px)" }}
            >
              at a glance
            </em>
            <span className="text-red-600" style={{ fontSize: "clamp(28px, 3.5vw, 46px)" }}>.</span>
          </div>

          <p className="mt-8 text-white/35 text-sm font-sans leading-relaxed max-w-xs">
            View your contract, invoices, video approvals, and content calendar
            — all in one place.
          </p>
        </div>

        <div className="text-white/20 text-[10px] tracking-[0.2em] uppercase font-sans">
          Powered by RestoRefine Studios · © 2026
        </div>
      </div>

      {/* Right — white form panel */}
      <div className="flex-1 bg-white flex items-center justify-center px-8">
        <motion.div
          className="w-full max-w-[360px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <span className="text-black font-black text-2xl tracking-tighter">
              CLIENT<span className="text-red-600"> PORTAL</span>
            </span>
          </div>

          <div className="mb-9">
            <p className="text-[10px] tracking-[0.22em] uppercase text-gray-400 font-sans mb-2">
              Client Sign In
            </p>
            <p className="text-gray-500 text-sm font-sans leading-relaxed">
              Access your RestoRefine Studios client portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 font-sans mb-2">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="w-full border border-gray-200 px-4 py-3 text-sm font-sans text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-150"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-sans">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 font-sans mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full border border-gray-200 px-4 py-3 pr-11 text-sm font-sans text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-sans">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p className="text-xs text-red-600 font-sans -mt-1">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[11px] tracking-[0.25em] uppercase font-bold py-4 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {isPending ? "Signing In..." : "Access Portal"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-300 font-sans">
            RestoRefine Studios · Glasgow · 0141 266 0065
          </p>
        </motion.div>
      </div>
    </div>
  );
}
