"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface OnboardingStepData {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  highlightSelector?: string; // CSS 选择器，用于高亮特定元素
}

interface OnboardingStepProps {
  steps: OnboardingStepData[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  title?: string;
}

export function OnboardingStep({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  title
}: OnboardingStepProps) {
  const { t } = useTranslation();
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
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
            onClick={onSkip}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容区域 */}
          <div className="p-8 pt-6">
            {/* 步骤指示器 */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
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

            {/* 标题 */}
            {title && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                {title}
              </p>
            )}

            {/* 图标或图片区域 */}
            {step.icon && (
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
            )}

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
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={onPrev}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isFirstStep
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('onboarding.prevStep')}
            </button>

            <button
              onClick={isLastStep ? onComplete : onNext}
              className={cn(
                "flex items-center gap-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                "text-white shadow-lg shadow-blue-500/25",
                "active:scale-95"
              )}
            >
              {isLastStep ? t('onboarding.done') : t('onboarding.nextStep')}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default OnboardingStep;
