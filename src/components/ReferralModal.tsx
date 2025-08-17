import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, QrCode, CheckCircle, User, Mail, Calendar } from 'lucide-react';
import QRCode from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: string;
  email: string;
  referral_code: string;
  created_at: string;
}

interface Referral {
  id: string;
  email: string;
  created_at: string;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const appUrl = window.location.origin;
  const referralLink = userData ? `${appUrl}/?ref=${userData.referral_code}` : '';

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch user data
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select('id, email, referral_code, created_at')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user data');
      }

      setUserData(userInfo);

      // Fetch referrals
      const { data: referralData, error: referralError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      if (referralError) {
        console.error('Failed to fetch referrals:', referralError);
      } else {
        setReferrals(referralData || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!userData?.referral_code) return;
    
    try {
      await navigator.clipboard.writeText(userData.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-2xl p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-white">Loading your referral data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="text-red-400 mb-4">{error}</div>
          <button 
            onClick={onClose}
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Share With Friends</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* User Info & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Referral Code Card */}
            <div className="bg-[#2D3748] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Share2 className="w-6 h-6 text-[#22C55E] mr-2" />
                <h3 className="text-xl font-semibold">Your Referral Code</h3>
              </div>
              
              <div className="bg-[#374151] rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-[#22C55E] mb-2">
                    {userData?.referral_code}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center justify-center mx-auto bg-[#4A5568] hover:bg-[#2D3748] px-4 py-2 rounded-lg transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle size={16} className="mr-2 text-[#22C55E]" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="bg-[#2D3748] rounded-lg p-6">
              <div className="flex items-center mb-4">
                <User className="w-6 h-6 text-[#22C55E] mr-2" />
                <h3 className="text-xl font-semibold">Referral Stats</h3>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-[#22C55E] mb-2">
                  {referrals.length}
                </div>
                <div className="text-gray-400">
                  {referrals.length === 1 ? 'Friend Invited' : 'Friends Invited'}
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link & QR Code */}
          <div className="bg-[#2D3748] rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Share Your Link</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referral Link */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Referral Link
                </label>
                <div className="bg-[#374151] rounded-lg p-3 mb-4">
                  <div className="text-sm font-mono break-all text-gray-300 mb-3">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center">
                <label className="block text-sm text-gray-400 mb-2">
                  QR Code
                </label>
                <div className="bg-white p-4 rounded-lg">
                  <QRCode 
                    value={referralLink}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Scan to open signup page
                </p>
              </div>
            </div>
          </div>

          {/* Invited Users Table */}
          <div className="bg-[#2D3748] rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Invited Friends</h3>
            
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No friends invited yet</p>
                <p className="text-sm text-gray-500">
                  Share your referral code to start earning rewards!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        <div className="flex items-center">
                          <Mail size={16} className="mr-2" />
                          Email
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2" />
                          Joined
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="border-b border-gray-700 hover:bg-[#374151] transition-colors">
                        <td className="py-3 px-4">
                          <div className="text-gray-300">{referral.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-400">{formatDate(referral.created_at)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;