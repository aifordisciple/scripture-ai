// components/settings/NotificationSettings.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, Mail, Globe, Volume2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationPreferences {
  emailNotifyFeedback: boolean;
  emailNotifySystem: boolean;
  browserNotify: boolean;
  soundNotify: boolean;
}

export function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifyFeedback: true,
    emailNotifySystem: true,
    browserNotify: true,
    soundNotify: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        setPreferences({
          emailNotifyFeedback: data.emailNotifyFeedback ?? true,
          emailNotifySystem: data.emailNotifySystem ?? true,
          browserNotify: data.browserNotify ?? true,
          soundNotify: data.soundNotify ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        // Also save to localStorage for immediate use
        localStorage.setItem('notification-preferences', JSON.stringify(preferences));
        onOpenChange(false);
      } else {
        addToast({ type: 'error', message: t('settings.saveFailed') });
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      addToast({ type: 'error', message: t('settings.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  // Request browser notification permission when enabling browser notifications
  const handleBrowserNotifyToggle = async () => {
    if (!preferences.browserNotify) {
      // Enabling - request permission
      const { requestBrowserNotificationPermission } = await import('@/lib/notification-service');
      const granted = await requestBrowserNotificationPermission();
      if (!granted) {
        addToast({ type: 'warning', message: t('settings.browserNotifyDenied') });
        return;
      }
    }
    handleToggle('browserNotify');
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('settings.notificationSettings')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 邮件通知 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                {t('settings.emailNotification')}
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label htmlFor="email-feedback" className="text-sm">{t('settings.feedbackNotify')}</Label>
                  <p className="text-xs text-gray-500">{t('settings.feedbackNotifyDesc')}</p>
                </div>
                <Switch
                  id="email-feedback"
                  checked={preferences.emailNotifyFeedback}
                  onCheckedChange={() => handleToggle('emailNotifyFeedback')}
                />
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label htmlFor="email-system" className="text-sm">{t('settings.systemNotify')}</Label>
                  <p className="text-xs text-gray-500">{t('settings.systemNotifyDesc')}</p>
                </div>
                <Switch
                  id="email-system"
                  checked={preferences.emailNotifySystem}
                  onCheckedChange={() => handleToggle('emailNotifySystem')}
                />
              </div>
            </div>

            {/* 浏览器通知 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Globe className="w-4 h-4" />
                {t('settings.browserNotification')}
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label htmlFor="browser-notify" className="text-sm">{t('settings.pushNotify')}</Label>
                  <p className="text-xs text-gray-500">{t('settings.pushNotifyDesc')}</p>
                </div>
                <Switch
                  id="browser-notify"
                  checked={preferences.browserNotify}
                  onCheckedChange={handleBrowserNotifyToggle}
                />
              </div>
            </div>

            {/* 声音提醒 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Volume2 className="w-4 h-4" />
                {t('settings.soundNotification')}
              </div>

              <div className="flex items-center justify-between pl-6">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-notify" className="text-sm">{t('settings.notifySound')}</Label>
                  <p className="text-xs text-gray-500">{t('settings.notifySoundDesc')}</p>
                </div>
                <Switch
                  id="sound-notify"
                  checked={preferences.soundNotify}
                  onCheckedChange={() => handleToggle('soundNotify')}
                />
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('settings.saveSettings')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}