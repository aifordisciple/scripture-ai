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
import { useTranslation } from "@/lib/i18n";

interface ReadingOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ReadingOnboarding({ onComplete, onSkip }: ReadingOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();

  const READING_STEPS: OnboardingStepData[] = [
    {
      id: "book-select",
      title: t('onboarding.selectBookTitle'),
      description: t('onboarding.selectBookDesc'),
      icon: <Menu className="w-12 h-12 text-blue-500" />,
    },
    {
      id: "chapter-nav",
      title: t('onboarding.chapterNavTitle'),
      description: t('onboarding.chapterNavDesc'),
      icon: <ChevronLeft className="w-12 h-12 text-emerald-500" />,
    },
    {
      id: "highlight",
      title: t('onboarding.highlightTitle'),
      description: t('onboarding.highlightDesc'),
      icon: <Highlighter className="w-12 h-12 text-yellow-500" />,
    },
    {
      id: "note",
      title: t('onboarding.addNoteTitle'),
      description: t('onboarding.addNoteDesc'),
      icon: <FileText className="w-12 h-12 text-amber-500" />,
    },
    {
      id: "bilingual",
      title: t('onboarding.bilingualTitle'),
      description: t('onboarding.bilingualDesc'),
      icon: <Languages className="w-12 h-12 text-purple-500" />,
    },
  ];

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
      title={t('onboarding.readingFeatures')}
    />
  );
}

export default ReadingOnboarding;
