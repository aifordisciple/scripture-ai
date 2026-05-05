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
      <DialogContent className="sm:max-w-md bg-card dark:bg-card border-border dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold tracking-[-0.022em]">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('auth.enterName')}
                  className="pl-9 border-border dark:border-border focus:ring-primary/20 focus:border-primary rounded-full bg-secondary dark:bg-background"
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
                  placeholder={t('auth.enterEmail')}
                  className="pl-9 border-border dark:border-border focus:ring-primary/20 focus:border-primary rounded-full bg-secondary dark:bg-background"
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
                  placeholder={t('auth.enterPassword')}
                  className="pl-9 border-border dark:border-border focus:ring-primary/20 focus:border-primary rounded-full bg-secondary dark:bg-background"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-apple-focus text-white rounded-full active:scale-95" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? t('auth.login') : t('auth.register')}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-4">
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-primary hover:text-apple-focus hover:underline ml-1 font-semibold"
          >
            {isLogin ? t('auth.goToRegister') : t('auth.goToLogin')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
