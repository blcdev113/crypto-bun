'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Share2, Users, CheckCircle, Loader2, QrCode, User, Mail, Calendar } from 'lucide-react';
import QRCode from 'qrcode.react';
import { supabase } from '@/src/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  created_at: string;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function SharePage() {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const referralLink = user ? `${appUrl}/signup?ref=${user.referral_code}` : '';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get user ID from cookie
      const userId = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];

      if (!userId) {
        setError('Please log in to view your referral information');
        setLoading(false);
        return;
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, referral_code, created_at')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user data');
      }

      if (!userData) {
        setError('User not found');
        setLoading(false);
        return;
      }

      setUser(userData);

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('referred_by', userId)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Failed to fetch referrals:', referralsError);
        // Don't throw error here, just log it
      } else {
        setReferrals(referralsData || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!user?.referral_code) return;
    
    try {
      await navigator.clipboard.writeText(user.referral_code);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading your referral data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link 
            href="/signup"
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Signup
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="bg-[#1E293B] rounded-lg w-full max-w-md p-8 text-center">
          <div className="text-gray-400 mb-4">User data not found</div>
          <Link 
            href="/signup"
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Share With Friends</h1>
          <p className="text-gray-400">
            Invite friends to TX Exchange and earn rewards together
          </p>
        </div>

        {/* User Info & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Referral Code Card */}
          <div className="bg-[#1E293B] rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Share2 className="w-6 h-6 text-[#22C55E] mr-2" />
              <h2 className="text-xl font-semibold">Your Referral Code</h2>
            </div>
            
            <div className="bg-[#2D3748] rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-[#22C55E] mb-2">
                  {user.referral_code}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center justify-center mx-auto bg-[#374151] hover:bg-[#4A5568] px-4 py-2 rounded-lg transition-colors"
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
          <div className="bg-[#1E293B] rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-[#22C55E] mr-2" />
              <h2 className="text-xl font-semibold">Referral Stats</h2>
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
        <div className="bg-[#1E293B] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Share Your Link</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Referral Link */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Referral Link
              </label>
              <div className="bg-[#2D3748] rounded-lg p-3 mb-4">
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
        <div className="bg-[#1E293B] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Invited Friends</h2>
          
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                        <User size={16} className="mr-2" />
                        Name
                      </div>
                    </th>
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
                    <tr key={referral.id} className="border-b border-gray-700 hover:bg-[#2D3748] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{referral.name}</div>
                      </td>
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

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link 
            href="/dashboard"
            className="bg-[#2D3748] hover:bg-[#374151] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}