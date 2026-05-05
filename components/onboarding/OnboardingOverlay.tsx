// components/onboarding/OnboardingOverlay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Bot, BookOpenCheck, Maximize, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBibleStore } from "@/store/useBibleStore";
import { useTranslation } from "@/lib/i18n";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation?: string;
}

interface OnboardingOverlayProps {
  onComplete?: () => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setHasCompletedOnboarding, hasCompletedOnboarding } = useBibleStore();
  const { t } = useTranslation();

  const ONBOARDING_STEPS: OnboardingStep[] = [
    {
      id: "welcome",
      title: t('onboarding.discoverTitle'),
      description: t('onboarding.discoverDesc'),
      icon: <Sparkles className="w-12 h-12 text-purple-500" />,
    },
    {
      id: "swipe-left",
      title: t('onboarding.swipeLeftTitle'),
      description: t('onboarding.swipeLeftDesc'),
      icon: <Bot className="w-12 h-12 text-blue-500" />,
      animation: "swipe-left",
    },
    {
      id: "long-press",
      title: t('onboarding.longPressTitle'),
      description: t('onboarding.longPressDesc'),
      icon: <Move className="w-12 h-12 text-primary" />,
      animation: "long-press",
    },
    {
      id: "swipe-up",
      title: t('onboarding.swipeUpTitle'),
      description: t('onboarding.swipeUpDesc'),
      icon: <BookOpenCheck className="w-12 h-12 text-emerald-500" />,
      animation: "swipe-up",
    },
    {
      id: "swipe-down",
      title: t('onboarding.swipeDownTitle'),
      description: t('onboarding.swipeDownDesc'),
      icon: <Maximize className="w-12 h-12 text-amber-500" />,
      animation: "swipe-down",
    },
  ];

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
          className="relative w-full max-w-md bg-card rounded-3xl overflow-hidden"
        >
          {/* 跳过按钮 */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground transition-colors"
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
                      ? "w-6 bg-primary"
                      : index < currentStep
                      ? "bg-primary"
                      : "bg-accent dark:bg-accent"
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
                  "bg-secondary",
                  "border-2 border-border"
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
                <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                  {step.title}
                </h2>
                <p className="text-muted-foreground dark:text-foreground text-sm leading-relaxed">
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
          <div className="flex items-center justify-between px-6 py-4 bg-accent/50 dark:bg-accent/50">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                isFirstStep
                  ? "text-foreground dark:text-muted-foreground cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-accent"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('onboarding.prevStep')}
            </button>

            <button
              onClick={handleNext}
              className={cn(
                "flex items-center gap-1 px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
                "bg-primary text-primary-foreground",
                "active:scale-95"
              )}
            >
              {isLastStep ? t('onboarding.getStarted') : t('onboarding.nextStep')}
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
  const { t } = useTranslation();

  return (
    <div className="relative w-32 h-20">
      {/* Magic Ball 模拟 */}
      <motion.div
        className={cn(
          "absolute w-10 h-10 rounded-full",
          "bg-primary",
          "flex items-center justify-center"
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
        className="absolute text-muted-foreground"
        animate={getArrowAnimation(type)}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut"
        }}
        style={getArrowPosition(type)}
      >
        {getArrowIcon(type, t)}
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

function getArrowIcon(type: string, t: (key: string, params?: Record<string, string | number>) => string) {
  switch (type) {
    case "swipe-left":
      return <ChevronLeft className="w-5 h-5" />;
    case "swipe-up":
      return <ChevronLeft className="w-5 h-5 rotate-90" />;
    case "swipe-down":
      return <ChevronRight className="w-5 h-5 rotate-90" />;
    case "long-press":
      return <span className="text-xs">{t('onboarding.hold')}</span>;
    default:
      return null;
  }
}

export default OnboardingOverlay;
