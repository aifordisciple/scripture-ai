"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Bot,
  Calendar,
  Users,
  ChevronRight,
  Rocket
} from "lucide-react";
import { OnboardingStep, OnboardingStepData } from "./shared/OnboardingStep";

const WELCOME_STEPS: OnboardingStepData[] = [
  {
    id: "welcome",
    title: "欢迎来到 Scripture AI",
    description: "你的智能读经伙伴，帮助你深入理解神的话语，建立持续的读经习惯。",
    icon: <Sparkles className="w-12 h-12 text-purple-500" />,
  },
  {
    id: "reading",
    title: "沉浸式阅读",
    description: "支持中英双语对照，自定义字体和行距，让阅读更加舒适。还可以高亮标记和添加笔记。",
    icon: <BookOpen className="w-12 h-12 text-emerald-500" />,
  },
  {
    id: "ai",
    title: "AI 智能助手",
    description: "遇到难懂的经文？AI 助手可以为你提供深度解读、背景知识和灵修建议。",
    icon: <Bot className="w-12 h-12 text-blue-500" />,
  },
  {
    id: "plan",
    title: "读经计划",
    description: "选择适合你的读经计划，每日打卡追踪进度，保持连续阅读的火苗。",
    icon: <Calendar className="w-12 h-12 text-indigo-500" />,
  },
  {
    id: "group",
    title: "小组共读",
    description: "创建或加入读经小组，与弟兄姊妹一起读经，互相鼓励，共同成长。",
    icon: <Users className="w-12 h-12 text-pink-500" />,
  },
  {
    id: "start",
    title: "开始你的读经之旅",
    description: "点击左上角的书卷名称，选择你想阅读的经文。也可以使用快捷键 / 搜索。",
    icon: <Rocket className="w-12 h-12 text-amber-500" />,
  },
];

interface WelcomeOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeOnboarding({ onComplete, onSkip }: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <OnboardingStep
      steps={WELCOME_STEPS}
      currentStep={currentStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={onSkip}
      onComplete={onComplete}
      title="功能介绍"
    />
  );
}

export default WelcomeOnboarding;