"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Bot,
  Calendar,
  Users,
  ChevronRight,
  Rocket,
  MoveHorizontal,
  CircleDot
} from "lucide-react";
import { OnboardingStep, OnboardingStepData } from "./shared/OnboardingStep";
import { useTranslation } from "@/lib/i18n";

interface WelcomeOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeOnboarding({ onComplete, onSkip }: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();

  const WELCOME_STEPS: OnboardingStepData[] = [
    {
      id: "welcome",
      title: t('onboarding.welcomeTitle'),
      description: t('onboarding.welcomeDesc'),
      icon: <Sparkles className="w-12 h-12 text-purple-500" />,
    },
    {
      id: "reading",
      title: t('onboarding.immersiveReadingTitle'),
      description: t('onboarding.immersiveReadingDesc'),
      icon: <BookOpen className="w-12 h-12 text-emerald-500" />,
    },
    {
      id: "ai",
      title: t('onboarding.aiAssistantTitle'),
      description: t('onboarding.aiAssistantDesc'),
      icon: <Bot className="w-12 h-12 text-blue-500" />,
    },
    {
      id: "plan",
      title: t('onboarding.readingPlanTitle'),
      description: t('onboarding.readingPlanDesc'),
      icon: <Calendar className="w-12 h-12 text-primary" />,
    },
    {
      id: "group",
      title: t('onboarding.groupReadingTitle'),
      description: t('onboarding.groupReadingDesc'),
      icon: <Users className="w-12 h-12 text-pink-500" />,
    },
    {
      id: "swipe",
      title: t('onboarding.swipeNavTitle'),
      description: t('onboarding.swipeNavDesc'),
      icon: <MoveHorizontal className="w-12 h-12 text-cyan-500" />,
    },
    {
      id: "magic-ball",
      title: t('onboarding.magicBallTitle'),
      description: t('onboarding.magicBallDesc'),
      icon: <CircleDot className="w-12 h-12 text-amber-500" />,
    },
    {
      id: "start",
      title: t('onboarding.startJourneyTitle'),
      description: t('onboarding.startJourneyDesc'),
      icon: <Rocket className="w-12 h-12 text-amber-500" />,
    },
  ];

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
      title={t('onboarding.featureGuide')}
    />
  );
}

export default WelcomeOnboarding;
