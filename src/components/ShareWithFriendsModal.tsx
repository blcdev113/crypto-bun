import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { useUser } from '../context/UserContext';
import QRCode from 'qrcode.react';

interface ShareWithFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareWithFriendsModal: React.FC<ShareWithFriendsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useUser();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, active: 0 });

  const referralCode = userProfile?.referral_code || userProfile?.unique_id || '';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  useEffect(() => {
    // Fetch referral stats (mock data for now)
    if (userProfile) {
      setReferralStats({ total: 0, active: 0 });
    }
  }, [userProfile]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleSaveQR = () => {
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `referral-qr-${referralCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-6 m-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#22C55E] mb-2">Share With Friends</h2>
          <p className="text-gray-300">Let wealth be free together</p>
        </div>

        {/* My invitation code */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            My invitation code
          </label>
          <div className="flex">
            <div className="flex-1 bg-[#374151] text-white px-4 py-3 rounded-l-lg font-mono">
              {referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-3 rounded-r-lg transition-colors flex items-center"
            >
              {copiedCode ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Click copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* My invitation code link */}
        <div className="mb-8">
          <label className="block text-white text-sm font-medium mb-2">
            My invitation code link
          </label>
          <div className="flex">
            <div className="flex-1 bg-[#374151] text-white px-4 py-3 rounded-l-lg text-sm break-all">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-3 rounded-r-lg transition-colors flex items-center"
            >
              {copiedLink ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Click copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-8">
          <div id="qr-code" className="bg-white p-4 rounded-lg mb-4">
            <QRCode 
              value={referralLink}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <button
            onClick={handleSaveQR}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            <Download size={16} className="mr-2" />
            Click save
          </button>
        </div>

        {/* Referral Stats */}
        <div className="text-center">
          <p className="text-[#22C55E] text-lg">
            Recommended number of people: <span className="font-bold">{referralStats.total}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareWithFriendsModal;