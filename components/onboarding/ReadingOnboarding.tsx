"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  FileText,
  Languages,
  Menu
} from "lucide-react";
import { OnboardingStep, OnboardingStepData } from "./shared/OnboardingStep";

const READING_STEPS: OnboardingStepData[] = [
  {
    id: "book-select",
    title: "选择书卷",
    description: "点击左上角的书卷名称，打开书卷选择器，快速跳转到你想阅读的经文。",
    icon: <Menu className="w-12 h-12 text-blue-500" />,
  },
  {
    id: "chapter-nav",
    title: "章节导航",
    description: "使用左右箭头或滑动屏幕，在章节之间快速切换。",
    icon: <ChevronLeft className="w-12 h-12 text-emerald-500" />,
  },
  {
    id: "highlight",
    title: "经文高亮",
    description: "长按经文可以选择高亮颜色，标记对你有帮助的经文。再次点击可以更换颜色或取消。",
    icon: <Highlighter className="w-12 h-12 text-yellow-500" />,
  },
  {
    id: "note",
    title: "添加笔记",
    description: "点击经文旁边的笔记图标，为这节经文添加你的思考和感悟。",
    icon: <FileText className="w-12 h-12 text-amber-500" />,
  },
  {
    id: "bilingual",
    title: "中英对照",
    description: "点击右上角的语言按钮，开启中英双语对照模式，深入研读经文。",
    icon: <Languages className="w-12 h-12 text-purple-500" />,
  },
];

interface ReadingOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ReadingOnboarding({ onComplete, onSkip }: ReadingOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < READING_STEPS.length - 1) {
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
      steps={READING_STEPS}
      currentStep={currentStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={onSkip}
      onComplete={onComplete}
      title="阅读功能"
    />
  );
}

export default ReadingOnboarding;