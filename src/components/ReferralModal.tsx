import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useUser } from '../context/UserContext';
import QRCode from 'qrcode.react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useUser();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !userProfile) return null;

  const invitationCode = userProfile.unique_id;
  const referralLink = `https://txexui.com?code=${invitationCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveQR = () => {
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `referral-qr-${invitationCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

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
            <div className="flex-1 bg-[#4A5568] text-white px-4 py-3 rounded-l-lg font-mono">
              {invitationCode}
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
            <div className="flex-1 bg-[#4A5568] text-white px-4 py-3 rounded-l-lg text-sm break-all">
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
        <div className="text-center mb-6">
          <div id="qr-code" className="inline-block bg-white p-4 rounded-lg">
            <QRCode 
              value={referralLink}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSaveQR}
          className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white py-3 rounded-lg font-medium transition-colors mb-4"
        >
          Click save
        </button>

        {/* Recommended number */}
        <div className="text-center">
          <span className="text-[#22C55E] text-sm">Recommended number of people: </span>
          <span className="text-white text-sm font-bold">0</span>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;