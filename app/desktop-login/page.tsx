// app/desktop-login/page.tsx
/**
 * Desktop Login Page
 *
 * This page is designed for the Tauri desktop app's WebView login flow.
 * After successful login, it sends the token back to the desktop app via IPC.
 * If accessed from a regular browser, it redirects to the home page.
 */

"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Type declaration for Tauri window object
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
      };
    };
  }
}

export default function DesktopLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTauri, setIsTauri] = useState(false);
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Check if running in Tauri environment
  useEffect(() => {
    const checkTauri = () => {
      const hasTauri = typeof window !== "undefined" && "__TAURI__" in window;
      setIsTauri(hasTauri);

      // If not in Tauri, redirect to home page
      if (!hasTauri) {
        console.log("Not in Tauri environment, redirecting to home...");
        // Uncomment the following line in production
        // router.push("/");
      }
    };

    checkTauri();
  }, [router]);

  // Send token to Tauri desktop app via IPC
  const sendTokenToDesktop = async (token: string, userId: string) => {
    if (!isTauri || !window.__TAURI__) {
      console.error("Not in Tauri environment");
      return;
    }

    try {
      // Store the token in Tauri
      await window.__TAURI__.core.invoke("store_token", {
        key: "auth-token",
        value: token,
      });

      // Notify desktop app that login is complete
      await window.__TAURI__.core.invoke("login_complete", {
        userId: userId,
      });

      console.log("Token sent to desktop app successfully");
    } catch (error) {
      console.error("Failed to send token to desktop:", error);
      throw error;
    }
  };

  // Get token from session after login
  const getTokenFromSession = async (): Promise<{ token: string; userId: string } | null> => {
    try {
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.id) {
        // Generate or get token - you may need to adjust this based on your auth setup
        // For now, we'll use a combination of session data
        const tokenResponse = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (tokenResponse.ok) {
          const { token } = await tokenResponse.json();
          return { token, userId: session.user.id };
        }

        // SECURITY WARNING: This base64 fallback is NOT secure — it can be trivially decoded.
        // In production, replace with a properly signed JWT from the server.
        // TODO: Remove this fallback and require server-issued tokens only.
        const token = btoa(JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        }));

        return { token, userId: session.user.id };
      }

      return null;
    } catch (error) {
      console.error("Failed to get token from session:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login logic
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError("邮箱或密码错误");
        } else {
          // Get token and send to desktop app
          const tokenData = await getTokenFromSession();

          if (tokenData && isTauri) {
            await sendTokenToDesktop(tokenData.token, tokenData.userId);
          }

          // Show success message briefly before window closes
          setError("");
          setLoading(false);

          // In Tauri, the window will be closed by the callback
          // In browser, redirect to home
          if (!isTauri) {
            router.push("/");
          }
        }
      } else {
        // Register logic
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }

        // Login after registration
        await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        // Get token and send to desktop app
        const tokenData = await getTokenFromSession();

        if (tokenData && isTauri) {
          await sendTokenToDesktop(tokenData.token, tokenData.userId);
        }

        if (!isTauri) {
          router.push("/");
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "发生错误，请重试";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Back button for non-Tauri environments
  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground dark:text-foreground mb-2 tracking-tight">
            AI读
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            {isTauri ? "登录以同步您的数据" : "欢迎回来"}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border dark:border-border">
          <h2 className="text-xl font-semibold text-center mb-6 text-foreground dark:text-foreground tracking-[-0.022em]">
            {isLogin ? "登录账户" : "创建账户"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="昵称"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="邮箱地址"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="密码"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "登录" : "注册"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "还没有账号？" : "已有账号？"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline ml-1 font-semibold"
            >
              {isLogin ? "去注册" : "去登录"}
            </button>
          </div>
        </div>

        {/* Back button for non-Tauri */}
        {!isTauri && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 w-full mt-4 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
        )}

        {/* Tauri indicator */}
        {isTauri && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            桌面端登录模式
          </p>
        )}
      </div>
    </div>
  );
}