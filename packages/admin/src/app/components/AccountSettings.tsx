import { useEffect, useState } from "react";
import {
  Shield,
  Save,
  QrCode,
  Copy,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { api } from "../api/client";

interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  twoFactorEnabled: boolean;
}

export function AccountSettings() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [enable2faMsg, setEnable2faMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [enable2faSaving, setEnable2faSaving] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disable2faMsg, setDisable2faMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.auth.me()
      .then(res => {
        const d = res.data as Me;
        setMe(d);
        setFirstName(d.firstName);
        setLastName(d.lastName);
        setEmail(d.email);
        setMfaEnabled(d.twoFactorEnabled);
      })
      .catch(() => setLoadError("Failed to load account data."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.users.update(me!.id, { firstName, lastName, email });
      setProfileMsg({ ok: true, text: "Profile updated." });
      window.setTimeout(() => setProfileMsg(null), 3000);
    } catch {
      setProfileMsg({ ok: false, text: "Failed to save profile." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPassMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    setPassSaving(true);
    setPassMsg(null);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassMsg({ ok: true, text: "Password updated." });
      window.setTimeout(() => setPassMsg(null), 3000);
    } catch (err: unknown) {
      setPassMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to change password." });
    } finally {
      setPassSaving(false);
    }
  }

  async function openSetup2FA() {
    try {
      const res = await api.auth.setup2fa();
      setSetupData(res.data as { secret: string; qrCode: string });
      setTotpCode("");
      setEnable2faMsg(null);
      setShow2FASetup(true);
    } catch (err: unknown) {
      setEnable2faMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to initialize 2FA setup." });
      setShow2FASetup(true);
    }
  }

  async function handleEnable2FA() {
    setEnable2faSaving(true);
    setEnable2faMsg(null);
    try {
      const res = await api.auth.enable2fa(totpCode);
      const codes = (res.data as { backupCodes: string[] }).backupCodes;
      setBackupCodes(codes);
      setMfaEnabled(true);
      setShow2FASetup(false);
      setShowBackupCodes(true);
    } catch (err: unknown) {
      setEnable2faMsg({ ok: false, text: err instanceof Error ? err.message : "Invalid code." });
    } finally {
      setEnable2faSaving(false);
    }
  }

  async function handleDisable2FA() {
    if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    setDisable2faMsg(null);
    try {
      await api.auth.disable2fa(disablePassword);
      setMfaEnabled(false);
      setDisablePassword("");
    } catch (err: unknown) {
      setDisable2faMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to disable 2FA." });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">{loadError}</p>
      </div>
    );
  }

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>

            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? "text-green-400" : "text-red-400"}`}>{profileMsg.text}</p>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            {passMsg && (
              <p className={`text-sm ${passMsg.ok ? "text-green-400" : "text-red-400"}`}>{passMsg.text}</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={passSaving}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm disabled:opacity-50"
            >
              {passSaving ? "Updating…" : "Update Password"}
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
            <div className={`p-4 rounded-lg border ${mfaEnabled ? "bg-green-500/5 border-green-500/20" : "bg-zinc-950 border-zinc-800"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Shield className={`w-5 h-5 mt-0.5 ${mfaEnabled ? "text-green-400" : "text-zinc-400"}`} />
                  <div>
                    <p className={`font-medium ${mfaEnabled ? "text-green-400" : ""}`}>
                      {mfaEnabled ? "2FA Enabled" : "2FA Disabled"}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {mfaEnabled
                        ? "Your account is protected with two-factor authentication"
                        : "Enable 2FA to secure your account"}
                    </p>
                  </div>
                </div>
                {!mfaEnabled && (
                  <button
                    onClick={openSetup2FA}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm font-medium"
                  >
                    Enable 2FA
                  </button>
                )}
              </div>
            </div>

            {mfaEnabled && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={openSetup2FA}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm"
                  >
                    Reconfigure 2FA
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium">Enter password to disable 2FA</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={e => setDisablePassword(e.target.value)}
                      placeholder="••••••••"
                      className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm"
                    />
                    <button
                      onClick={handleDisable2FA}
                      className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-md transition-colors text-sm border border-red-600/20"
                    >
                      Disable 2FA
                    </button>
                  </div>
                  {disable2faMsg && (
                    <p className={`text-sm ${disable2faMsg.ok ? "text-green-400" : "text-red-400"}`}>{disable2faMsg.text}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={profileSaving}
          className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {profileSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && setupData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <div>
                <h2 className="text-xl font-semibold">Setup Two-Factor Authentication</h2>
                <p className="text-sm text-zinc-400 mt-1">Scan QR code with your authenticator app</p>
              </div>
              <button
                onClick={() => setShow2FASetup(false)}
                className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                {setupData.qrCode ? (
                  <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg mb-4" />
                ) : (
                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4">
                    <QrCode className="w-32 h-32 text-zinc-900" />
                  </div>
                )}
                <p className="text-sm text-zinc-400 text-center mb-2">
                  Or enter the secret manually:
                </p>
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-sm">
                  <code>{setupData.secret}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(setupData.secret)}
                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Enter Verification Code</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 text-center text-2xl tracking-widest font-mono"
                />
              </div>

              {enable2faMsg && (
                <p className={`text-sm ${enable2faMsg.ok ? "text-green-400" : "text-red-400"}`}>{enable2faMsg.text}</p>
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
                onClick={handleEnable2FA}
                disabled={enable2faSaving || totpCode.length < 6}
                className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50"
              >
                {enable2faSaving ? "Verifying…" : "Verify & Enable"}
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
                <p className="text-sm text-zinc-400 mt-1">Save these codes in a secure location</p>
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
                <p className="text-sm text-amber-400 font-medium mb-2">Important</p>
                <p className="text-sm text-zinc-400">
                  Each backup code can only be used once. Store them securely and don't share them.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-sm text-center">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(backupCodes.join("\n"))}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "backup-codes.txt";
                    a.click();
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
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
