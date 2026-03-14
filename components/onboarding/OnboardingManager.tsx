"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useBibleStore } from "@/store/useBibleStore";
import { WelcomeOnboarding } from "./WelcomeOnboarding";
import { ReadingOnboarding } from "./ReadingOnboarding";
import { OnboardingStatus } from "@/store/types";

// 引导类型
type OnboardingType = keyof OnboardingStatus;

export function OnboardingManager() {
  const { data: session, status } = useSession();
  const {
    onboarding,
    initOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useBibleStore();

  const [activeOnboarding, setActiveOnboarding] = useState<OnboardingType | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 从云端加载引导状态
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && !initialized) {
      fetch("/api/user/onboarding")
        .then(res => res.json())
        .then(data => {
          if (data.onboarding) {
            initOnboarding(data.onboarding);
          }
          setInitialized(true);
        })
        .catch(() => {
          setInitialized(true);
        });
    } else if (status === "unauthenticated") {
      setInitialized(true);
    }
  }, [status, session?.user?.id, initialized, initOnboarding]);

  // 检查是否需要显示欢迎引导
  useEffect(() => {
    if (!initialized) return;
    if (status !== "authenticated") return;

    // 首次登录显示欢迎引导
    if (!onboarding.welcome.shown && !onboarding.welcome.completed) {
      setActiveOnboarding("welcome");
      startOnboarding("welcome");
    }
  }, [initialized, status, onboarding.welcome, startOnboarding]);

  // 处理引导完成
  const handleComplete = useCallback((type: OnboardingType) => {
    completeOnboarding(type);
    setActiveOnboarding(null);
  }, [completeOnboarding]);

  // 处理跳过引导
  const handleSkip = useCallback((type: OnboardingType) => {
    skipOnboarding(type);
    setActiveOnboarding(null);
  }, [skipOnboarding]);

  // 监听手动触发引导的事件
  useEffect(() => {
    const handleStartOnboarding = (e: CustomEvent) => {
      const type = e.detail as OnboardingType;
      if (type && !onboarding[type].completed) {
        setActiveOnboarding(type);
        startOnboarding(type);
      }
    };

    const handleResetOnboarding = (e: CustomEvent) => {
      const type = e.detail as OnboardingType | undefined;
      // 重置状态后触发引导
      setTimeout(() => {
        if (type) {
          setActiveOnboarding(type);
          startOnboarding(type);
        } else {
          // 重置所有，显示欢迎引导
          setActiveOnboarding("welcome");
          startOnboarding("welcome");
        }
      }, 100);
    };

    window.addEventListener("start-onboarding", handleStartOnboarding as EventListener);
    window.addEventListener("reset-onboarding", handleResetOnboarding as EventListener);

    return () => {
      window.removeEventListener("start-onboarding", handleStartOnboarding as EventListener);
      window.removeEventListener("reset-onboarding", handleResetOnboarding as EventListener);
    };
  }, [onboarding, startOnboarding]);

  // 渲染当前激活的引导
  if (!activeOnboarding) return null;

  switch (activeOnboarding) {
    case "welcome":
      return (
        <WelcomeOnboarding
          onComplete={() => handleComplete("welcome")}
          onSkip={() => handleSkip("welcome")}
        />
      );
    case "reading":
      return (
        <ReadingOnboarding
          onComplete={() => handleComplete("reading")}
          onSkip={() => handleSkip("reading")}
        />
      );
    // 可以添加其他引导类型
    default:
      return null;
  }
}

// 辅助函数：触发特定引导
export function triggerOnboarding(type: OnboardingType) {
  window.dispatchEvent(new CustomEvent("start-onboarding", { detail: type }));
}

// 辅助函数：重置并触发引导
export function resetAndTriggerOnboarding(type?: OnboardingType) {
  window.dispatchEvent(new CustomEvent("reset-onboarding", { detail: type }));
}

export default OnboardingManager;