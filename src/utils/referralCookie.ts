// Utility functions for handling referral cookies in Vite/React

export const setReferralCookie = (referralCode: string) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days
  
  document.cookie = `ref=${referralCode}; expires=${expires.toUTCString()}; path=/; secure; samesite=lax`;
};

export const getReferralCookie = (): string | null => {
  const cookies = document.cookie.split('; ');
  const refCookie = cookies.find(row => row.startsWith('ref='));
  return refCookie ? refCookie.split('=')[1] : null;
};

export const clearReferralCookie = () => {
  document.cookie = 'ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// Check URL for referral code and set cookie
export const handleReferralFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    setReferralCookie(refCode);
    
    // Clean URL by removing the ref parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('ref');
    window.history.replaceState({}, '', newUrl.toString());
  }
};