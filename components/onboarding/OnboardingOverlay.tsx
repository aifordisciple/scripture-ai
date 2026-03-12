// components/onboarding/OnboardingOverlay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Bot, BookOpenCheck, Maximize, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBibleStore } from "@/store/useBibleStore";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "发现你的灵修伙伴",
    description: "Magic Ball 是你的智能读经助手，帮助你快速访问 AI 功能，让读经更有深度。",
    icon: <Sparkles className="w-12 h-12 text-purple-500" />,
  },
  {
    id: "swipe-left",
    title: "左滑开启 AI 解读",
    description: "向左滑动 Magic Ball，即可打开 AI 侧边栏，获得深度经文解读。",
    icon: <Bot className="w-12 h-12 text-blue-500" />,
    animation: "swipe-left",
  },
  {
    id: "long-press",
    title: "长按快捷菜单",
    description: "长按 Magic Ball 0.4 秒，即可展开快捷菜单，快速选择 AI 解读模式。",
    icon: <Move className="w-12 h-12 text-indigo-500" />,
    animation: "long-press",
  },
  {
    id: "swipe-up",
    title: "上滑选择书卷",
    description: "向上滑动 Magic Ball，快速选择要阅读的书卷和章节。",
    icon: <BookOpenCheck className="w-12 h-12 text-emerald-500" />,
    animation: "swipe-up",
  },
  {
    id: "swipe-down",
    title: "下滑切换全屏",
    description: "向下滑动 Magic Ball，切换全屏模式，沉浸式读经。",
    icon: <Maximize className="w-12 h-12 text-amber-500" />,
    animation: "swipe-down",
  },
];

interface OnboardingOverlayProps {
  onComplete?: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setHasCompletedOnboarding, hasCompletedOnboarding } = useBibleStore();

  // 如果已完成引导，不显示
  if (hasCompletedOnboarding) return null;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* 跳过按钮 */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容区域 */}
          <div className="p-8 pt-6">
            {/* 步骤指示器 */}
            <div className="flex justify-center gap-2 mb-8">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "w-6 bg-gradient-to-r from-blue-500 to-purple-500"
                      : index < currentStep
                      ? "bg-blue-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              ))}
            </div>

            {/* 动画演示区域 */}
            <div className="flex justify-center mb-6">
              <motion.div
                key={step.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
                  "border-2 border-slate-200 dark:border-slate-700"
                )}
              >
                {step.icon}
              </motion.div>
            </div>

            {/* 标题和描述 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* 手势提示动画 */}
            {step.animation && (
              <div className="mt-6 flex justify-center">
                <GestureHint type={step.animation} />
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isFirstStep
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </button>

            <button
              onClick={handleNext}
              className={cn(
                "flex items-center gap-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                "text-white shadow-lg shadow-blue-500/25",
                "active:scale-95"
              )}
            >
              {isLastStep ? "开始使用" : "下一步"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 手势提示动画组件
function GestureHint({ type }: { type: string }) {
  return (
    <div className="relative w-32 h-20">
      {/* Magic Ball 模拟 */}
      <motion.div
        className={cn(
          "absolute w-10 h-10 rounded-full",
          "bg-gradient-to-br from-blue-400 to-purple-500",
          "flex items-center justify-center",
          "shadow-lg"
        )}
        animate={getAnimation(type)}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut"
        }}
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </motion.div>

      {/* 箭头指示 */}
      <motion.div
        className="absolute text-slate-400"
        animate={getArrowAnimation(type)}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut"
        }}
        style={getArrowPosition(type)}
      >
        {getArrowIcon(type)}
      </motion.div>
    </div>
  );
}

function getAnimation(type: string) {
  switch (type) {
    case "swipe-left":
      return { x: [0, -30, 0] };
    case "swipe-right":
      return { x: [0, 30, 0] };
    case "swipe-up":
      return { y: [0, -20, 0] };
    case "swipe-down":
      return { y: [0, 20, 0] };
    case "long-press":
      return { scale: [1, 1.1, 1] };
    default:
      return {};
  }
}

function getArrowAnimation(type: string) {
  switch (type) {
    case "swipe-left":
      return { opacity: [0.3, 1, 0.3], x: [0, -10, 0] };
    case "swipe-up":
      return { opacity: [0.3, 1, 0.3], y: [0, -10, 0] };
    case "swipe-down":
      return { opacity: [0.3, 1, 0.3], y: [0, 10, 0] };
    case "long-press":
      return { opacity: [0.3, 1, 0.3] };
    default:
      return {};
  }
}

function getArrowPosition(type: string): React.CSSProperties {
  switch (type) {
    case "swipe-left":
      return { right: "0", top: "50%", transform: "translateY(-50%)" };
    case "swipe-up":
      return { top: "0", left: "50%", transform: "translateX(-50%)" };
    case "swipe-down":
      return { bottom: "0", left: "50%", transform: "translateX(-50%)" };
    default:
      return {};
  }
}

function getArrowIcon(type: string) {
  switch (type) {
    case "swipe-left":
      return <ChevronLeft className="w-5 h-5" />;
    case "swipe-up":
      return <ChevronLeft className="w-5 h-5 rotate-90" />;
    case "swipe-down":
      return <ChevronRight className="w-5 h-5 rotate-90" />;
    case "long-press":
      return <span className="text-xs">按住</span>;
    default:
      return null;
  }
}

export default OnboardingOverlay;