import { useState } from "react";
import {
  Shield,
  Save,
  Smartphone,
  Mail,
  Key,
  QrCode,
  RefreshCw,
  Copy,
  X,
  Download,
} from "lucide-react";

export function AccountSettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [authMethod, setAuthMethod] = useState<'totp' | 'sms'>('totp');

  const backupCodes = [
    'A1B2-C3D4-E5F6',
    'G7H8-I9J0-K1L2',
    'M3N4-O5P6-Q7R8',
    'S9T0-U1V2-W3X4',
    'Y5Z6-A7B8-C9D0',
    'E1F2-G3H4-I5J6',
    'K7L8-M9N0-O1P2',
    'Q3R4-S5T6-U7V8'
  ];

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your profile and security settings
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Profile Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-semibold">
                AD
              </div>
              <div>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm">
                  Change Avatar
                </button>
                <p className="text-xs text-zinc-500 mt-2">
                  JPG, PNG or GIF (max. 2MB)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  defaultValue="Admin"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  defaultValue="User"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                defaultValue="admin@example.com"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm">
              Update Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-lg font-semibold mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Add an extra layer of security to your account
          </p>

          <div className="space-y-4">
            {/* MFA Status */}
            <div className={`p-4 rounded-lg border ${mfaEnabled ? 'bg-green-500/5 border-green-500/20' : 'bg-zinc-950 border-zinc-800'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {mfaEnabled ? (
                    <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <Shield className="w-5 h-5 text-zinc-400 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${mfaEnabled ? 'text-green-400' : ''}`}>
                      {mfaEnabled ? '2FA Enabled' : '2FA Disabled'}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {mfaEnabled 
                        ? 'Your account is protected with two-factor authentication' 
                        : 'Enable 2FA to secure your account'}
                    </p>
                  </div>
                </div>
                {!mfaEnabled && (
                  <button
                    onClick={() => setShow2FASetup(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm font-medium"
                  >
                    Enable 2FA
                  </button>
                )}
              </div>
            </div>

            {/* Authentication Methods (only show when 2FA is enabled) */}
            {mfaEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Authentication Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                      <input
                        type="radio"
                        name="authMethod"
                        value="totp"
                        checked={authMethod === 'totp'}
                        onChange={() => setAuthMethod('totp')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="w-4 h-4 text-zinc-400" />
                          <span className="font-medium">Authenticator App (TOTP)</span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                            Recommended
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          Use Google Authenticator, Authy, or similar apps
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                      <input
                        type="radio"
                        name="authMethod"
                        value="sms"
                        checked={authMethod === 'sms'}
                        onChange={() => setAuthMethod('sms')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-zinc-400" />
                          <span className="font-medium">SMS Authentication</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          Receive codes via text message
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Backup Codes */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-400">Backup Codes</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Save backup codes to access your account if you lose your authentication device
                      </p>
                      <button
                        onClick={() => setShowBackupCodes(true)}
                        className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        View Backup Codes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manage 2FA */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShow2FASetup(true)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm"
                  >
                    Reconfigure 2FA
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
                        setMfaEnabled(false);
                      }
                    }}
                    className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-md transition-colors text-sm border border-red-600/20"
                  >
                    Disable 2FA
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
          <div className="space-y-3">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Chrome on Mac OS</span>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">
                      Current
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    San Francisco, CA • Last active: Now
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium mb-1">Safari on iPhone</p>
                  <p className="text-sm text-zinc-400">
                    San Francisco, CA • Last active: 2 hours ago
                  </p>
                </div>
                <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Revoke
                </button>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-md transition-colors text-sm border border-red-600/20">
              Sign Out All Other Sessions
            </button>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="pt-6 border-t border-red-900/20">
          <h3 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Permanently delete your account and all associated data
          </p>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm font-medium">
            Delete Account
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <div>
                <h2 className="text-xl font-semibold">Setup Two-Factor Authentication</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {authMethod === 'totp' ? 'Scan QR code with your authenticator app' : 'We\'ll send a code to your phone'}
                </p>
              </div>
              <button
                onClick={() => setShow2FASetup(false)}
                className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {authMethod === 'totp' ? (
                <>
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4">
                      <QrCode className="w-32 h-32 text-zinc-900" />
                    </div>
                    <p className="text-sm text-zinc-400 text-center mb-2">
                      Scan this QR code with your authenticator app
                    </p>
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-sm">
                      <code>JBSWY3DPEHPK3PXP</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('JBSWY3DPEHPK3PXP');
                          alert('Secret key copied!');
                        }}
                        className="p-1 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>

                  {/* Verification Code */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm font-medium">
                    Send Verification Code
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/50">
              <button
                onClick={() => setShow2FASetup(false)}
                className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMfaEnabled(true);
                  setShow2FASetup(false);
                  alert('2FA enabled successfully!');
                }}
                className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <div>
                <h2 className="text-xl font-semibold">Backup Codes</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Save these codes in a secure location
                </p>
              </div>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-amber-400 font-medium mb-2">
                  ⚠️ Important
                </p>
                <p className="text-sm text-zinc-400">
                  Each backup code can only be used once. Store them securely and don't share them with anyone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-sm text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    alert('Backup codes copied to clipboard!');
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
                <button className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('Generate new backup codes? Your current codes will be invalidated.')) {
                    alert('New backup codes generated!');
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-md transition-colors text-sm border border-blue-600/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generate New Codes
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/50">
              <button
                onClick={() => setShowBackupCodes(false)}
                className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
