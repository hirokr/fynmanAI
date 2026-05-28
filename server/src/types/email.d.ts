export type VerificationEmailProps = {
  userName?: string;
  otpCode?: string;
  verificationLink?: string;
  expiryMinutes?: number;
  supportEmail?: string;
  brandName?: string;
};

export type WelcomeEmailProps = {
  userName?: string;
  dashboardLink?: string;
  supportEmail?: string;
  brandName?: string;
};
