// components/auth/AuthDialog.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBibleStore } from "@/store/useBibleStore";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

export function AuthDialog() {
  const { isAuthOpen, setAuthOpen } = useBibleStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useTranslation();

  // 表单状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // --- 登录逻辑 ---
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError(t('auth.emailOrPasswordError'));
        } else {
          setAuthOpen(false);
          router.refresh(); // 刷新页面以更新 Session 状态
        }
      } else {
        // --- 注册逻辑 ---
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }

        // 注册成功后直接登录
        await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        
        setAuthOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAuthOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t('auth.enterName')}
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
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                  type="password"
                  placeholder={t('auth.enterPassword')}
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

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? t('auth.login') : t('auth.register')}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500 mt-4">
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-blue-600 hover:underline ml-1 font-medium"
          >
            {isLogin ? t('auth.goToRegister') : t('auth.goToLogin')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
