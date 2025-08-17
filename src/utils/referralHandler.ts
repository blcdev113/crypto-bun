// Referral code handling utilities
export class ReferralHandler {
  private static COOKIE_NAME = 'ref';
  private static COOKIE_EXPIRY_DAYS = 30;

  // Extract referral code from URL
  static extractReferralFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  }

  // Set referral code in cookie
  static setReferralCookie(referralCode: string): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.COOKIE_EXPIRY_DAYS);
    
    document.cookie = `${this.COOKIE_NAME}=${referralCode}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  }

  // Get referral code from cookie
  static getReferralFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.COOKIE_NAME) {
        return value;
      }
    }
    return null;
  }

  // Clear referral cookie
  static clearReferralCookie(): void {
    document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  // Process referral on page load
  static processReferralOnLoad(): void {
    const referralFromUrl = this.extractReferralFromUrl();
    if (referralFromUrl) {
      this.setReferralCookie(referralFromUrl);
      
      // Clean URL without refreshing page
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  // Get active referral code (from URL or cookie)
  static getActiveReferralCode(): string | null {
    return this.extractReferralFromUrl() || this.getReferralFromCookie();
  }
}