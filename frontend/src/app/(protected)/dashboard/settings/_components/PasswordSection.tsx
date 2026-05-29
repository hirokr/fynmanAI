"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordInputField } from "@/app/auth/reset-pass/_components/PasswordInputField";
import { useDashboardData } from "../../_components/DashboardDataProvider";

export default function PasswordSection() {
  const { changePassword, isLoading } = useDashboardData();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 pt-6" id="security">
      <div className="pb-4 border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Security
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Update your password to keep your account secure.
        </p>
      </div>

      <div className="space-y-4">
        <PasswordInputField
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showPasswords}
          onToggleVisibility={() => setShowPasswords((prev) => !prev)}
        />
        <PasswordInputField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          visible={showPasswords}
          onToggleVisibility={() => setShowPasswords((prev) => !prev)}
        />
        <PasswordInputField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showPasswords}
          onToggleVisibility={() => setShowPasswords((prev) => !prev)}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            className="w-auto px-6"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Updating..." : "Change Password"}
          </Button>
        </div>
      </div>
    </section>
  );
}
