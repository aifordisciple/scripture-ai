"use client";

import { useState } from "react";
import { Ticket, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinByInviteDialogProps {
  onSuccess?: () => void;
}

export function JoinByInviteDialog({ onSuccess }: JoinByInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 6) {
      setError("请输入6位邀请码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/church/join-by-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() })
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.success) {
        setOpen(false);
        setCode("");
        // Call success callback to refresh group list
        onSuccess?.();
      }
    } catch (error) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Ticket className="w-4 h-4" />
          邀请码加入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>通过邀请码加入小组</DialogTitle>
          <DialogDescription>
            输入6位邀请码加入家庭或小组读经团契
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">邀请码</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setError("");
              }}
              placeholder="输入6位邀请码"
              className="text-center text-xl tracking-widest font-mono"
              maxLength={6}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button
            onClick={handleJoin}
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            加入小组
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}