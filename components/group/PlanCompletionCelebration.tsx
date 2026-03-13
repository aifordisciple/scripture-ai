"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, PartyPopper, X, Download } from "lucide-react";

interface PlanCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  stats: {
    completedDays: number;
    chaptersRead: number;
    streakDays: number;
    memberCount?: number;
  };
  churchName?: string;
}

// Simple confetti effect using DOM elements
const createConfettiPiece = () => {
  const colors = ['#f59e0b', '#eab308', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#10b981', '#3b82f6', '#8b5cf6'];
  const confetti = document.createElement('div');
  confetti.style.cssText = `
    position: fixed;
    width: 10px;
    height: 10px;
    background: ${colors[Math.floor(Math.random() * colors.length)]};
    left: ${Math.random() * 100}vw;
    top: -10px;
    opacity: 1;
    pointer-events: none;
    z-index: 10000;
    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
    transform: rotate(${Math.random() * 360}deg);
  `;
  document.body.appendChild(confetti);

  const duration = 3000 + Math.random() * 2000;
  const animation = confetti.animate([
    { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
    { transform: `translateY(100vh) rotate(${720 + Math.random() * 360}deg)`, opacity: 0 }
  ], {
    duration,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  });

  animation.onfinish = () => confetti.remove();
};

const fireConfetti = () => {
  for (let i = 0; i < 50; i++) {
    setTimeout(createConfettiPiece, i * 30);
  }
  // Second burst
  setTimeout(() => {
    for (let i = 0; i < 30; i++) {
      setTimeout(createConfettiPiece, i * 40);
    }
  }, 500);
};

export function PlanCompletionCelebration({
  isOpen,
  onClose,
  planName,
  stats,
  churchName
}: PlanCompletionCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !showConfetti) {
      setShowConfetti(true);
      // Fire confetti with a slight delay for better effect
      setTimeout(fireConfetti, 300);
      setTimeout(fireConfetti, 800);
    }
  }, [isOpen, showConfetti]);

  const generateCertificate = () => {
    // Create a simple certificate data URL
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // Inner border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 720, 520);

    // Title
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('读经计划完成证书', 400, 120);

    // Trophy emoji (as text)
    ctx.font = '64px serif';
    ctx.fillText('🏆', 400, 200);

    // Plan name
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 32px serif';
    ctx.fillText(planName, 400, 280);

    // Stats
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText(`完成天数: ${stats.completedDays} 天`, 400, 350);
    ctx.fillText(`阅读章节: ${stats.chaptersRead} 章`, 400, 390);
    ctx.fillText(`连续打卡: ${stats.streakDays} 天`, 400, 430);

    // Church name
    if (churchName) {
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#a16207';
      ctx.fillText(churchName, 400, 480);
    }

    // Date
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#a16207';
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(today, 400, 520);

    // Download
    const link = document.createElement('a');
    link.download = `${planName}-完成证书.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Card */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 dark:border-amber-700 shadow-2xl">
                <CardContent className="p-6 text-center">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {/* Trophy animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 10 }}
                    className="mb-4"
                  >
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                      🎉 恭喜完成！
                    </h2>
                    <p className="text-lg text-amber-700 dark:text-amber-300 font-medium mb-4">
                      {planName}
                    </p>
                  </motion.div>

                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-3 mb-6"
                  >
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.completedDays}
                      </div>
                      <div className="text-xs text-muted-foreground">天数</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.chaptersRead}
                      </div>
                      <div className="text-xs text-muted-foreground">章节</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4" />
                        {stats.streakDays}
                      </div>
                      <div className="text-xs text-muted-foreground">连续</div>
                    </div>
                  </motion.div>

                  {/* Achievement badges */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-2 mb-6"
                  >
                    <span className="text-3xl">🏆</span>
                    <span className="text-3xl">🎯</span>
                    <span className="text-3xl">⭐</span>
                  </motion.div>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-amber-700 dark:text-amber-300 mb-6"
                  >
                    {stats.memberCount && stats.memberCount > 1
                      ? `与 ${stats.memberCount} 位组员共同完成了这个读经计划！`
                      : "你完成了一个读经计划！继续保持，养成每日读经的好习惯。"}
                  </motion.p>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-2"
                  >
                    <Button
                      variant="outline"
                      onClick={generateCertificate}
                      className="flex-1 gap-1"
                    >
                      <Download className="w-4 h-4" />
                      下载证书
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 gap-1 bg-amber-500 hover:bg-amber-600"
                    >
                      <PartyPopper className="w-4 h-4" />
                      太棒了！
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}