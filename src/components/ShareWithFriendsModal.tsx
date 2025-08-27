import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode.react';

interface ShareWithFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareWithFriendsModal: React.FC<ShareWithFriendsModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedQR, setSavedQR] = useState(false);

  const invitationCode = "9HDDRD0RS000";
  const invitationLink = `https://txexui.com?code=${invitationCode.toLowerCase()}`;
  const recommendedPeople = 0;

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
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
      link.download = 'tx-exchange-referral-qr.png';
      link.href = canvas.toDataURL();
      link.click();
      setSavedQR(true);
      setTimeout(() => setSavedQR(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-lg p-8 m-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#22C55E] mb-2">Share With Friends</h1>
          <p className="text-gray-300 text-lg">Let wealth be free together</p>
        </div>

        {/* Invitation Code */}
        <div className="mb-6">
          <label className="block text-white text-lg font-medium mb-3">
            My invitation code
          </label>
          <div className="flex">
            <input
              type="text"
              value={invitationCode}
              readOnly
              className="flex-1 bg-[#374151] text-white px-4 py-3 rounded-l-lg text-lg font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyCode}
              className={`px-6 py-3 rounded-r-lg font-medium transition-all duration-200 ${
                copiedCode 
                  ? 'bg-green-600 text-white' 
                  : 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
              }`}
            >
              {copiedCode ? (
                <div className="flex items-center">
                  <Check size={18} className="mr-1" />
                  Copied
                </div>
              ) : (
                'Click copy'
              )}
            </button>
          </div>
        </div>

        {/* Invitation Link */}
        <div className="mb-8">
          <label className="block text-white text-lg font-medium mb-3">
            My invitation code link
          </label>
          <div className="flex">
            <input
              type="text"
              value={invitationLink}
              readOnly
              className="flex-1 bg-[#374151] text-white px-4 py-3 rounded-l-lg text-sm focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-6 py-3 rounded-r-lg font-medium transition-all duration-200 ${
                copiedLink 
                  ? 'bg-green-600 text-white' 
                  : 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
              }`}
            >
              {copiedLink ? (
                <div className="flex items-center">
                  <Check size={18} className="mr-1" />
                  Copied
                </div>
              ) : (
                'Click copy'
              )}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center mb-6">
          <div id="qr-code" className="inline-block bg-white p-4 rounded-lg">
            <QRCode 
              value={invitationLink}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Save QR Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleSaveQR}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
              savedQR 
                ? 'bg-green-600 text-white' 
                : 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
            }`}
          >
            {savedQR ? (
              <div className="flex items-center">
                <Check size={18} className="mr-2" />
                QR Code Saved
              </div>
            ) : (
              'Click save'
            )}
          </button>
        </div>

        {/* Recommended People Counter */}
        <div className="text-center">
          <p className="text-[#22C55E] text-lg font-medium">
            Recommended number of people: <span className="text-2xl font-bold">{recommendedPeople}</span>
          </p>
        </div>

        {/* Benefits Info */}
        <div className="mt-6 p-4 bg-[#2D3748] rounded-lg">
          <h3 className="text-white font-medium mb-2">Referral Benefits:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Earn commission from your friends' trading fees</li>
            <li>• Get bonus rewards for active referrals</li>
            <li>• Build your network and grow together</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShareWithFriendsModal;