import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Globe,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Shield,
  Users,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import API from "@/hooks/useApi";
import { toast } from "sonner";

const TABS = [
  { id: "account", label: "My Account", icon: User },
  { id: "users", label: "Manage Users", icon: Users },
  { id: "log", label: "Users Log", icon: FileText },
];

// Avatar initials from companyName or companyUrl
function Avatar({ companyName, companyUrl, size = "lg" }) {
  const initials = companyName
    ? companyName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (companyUrl || "U").slice(0, 2).toUpperCase();
  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : "h-9 w-9 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg`}
    >
      {initials}
    </div>
  );
}

// My Account Tab — visible to all user types
function MyAccountTab({ user }) {
  const [email,       setEmail]       = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyUrl,  setCompanyUrl]  = useState("");
  const [userType,    setUserType]    = useState("");
  const [userName,    setUserName]    = useState("");
  const [phone,       setPhone]       = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [savingPass,  setSavingPass]  = useState(false);
  const [currentPass, setCurrentPass] = useState("••••••••");
  const [showCurrent, setShowCurrent] = useState(false);

  const isUser = user?.userType === 'user';

  // Load profile from DB on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res  = await API.get("/settings/profile");
        const data = res.data;

        setEmail(data.email       || "");
        setCompanyUrl(data.companyUrl || "");
        setUserType(data.userType   || "");
        setPhone(data.phone         || "");
        setCurrentPass(data.password || "••••••••");

        if (data.userType === 'user') {
          // user → show userName in name field
          setUserName(data.userName || "");
          setCompanyName("");
          // Show masked password placeholder for view
          setCurrentPass("••••••••");
        } else {
          // store_admin / super_admin → show companyName
          setCompanyName(data.companyName || data.companyId || "");
          setUserName("");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    loadProfile();
  }, [user?.userId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await API.put("/settings/profile", { phone });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

 const handlePasswordUpdate = async () => {
  // Validation
  if (!newPassword) { toast.error("New password is required"); return; }
  if (newPassword.length < 8) { toast.error("Minimum 8 characters"); return; }
  if (!/[A-Z]/.test(newPassword)) { toast.error("Must contain at least one uppercase letter"); return; }
  if (!/[0-9]/.test(newPassword)) { toast.error("Must contain at least one number"); return; }
  if (newPassword !== confirmPass) { toast.error("Passwords do not match"); return; }

  setSavingPass(true);
  try {
    await API.put("/settings/password", { newPassword });
    toast.success("Password updated successfully!");
    setNewPassword("");
    setConfirmPass("");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update password");
  } finally {
    setSavingPass(false);
  }
};
  // Readonly fields — store_admin shows companyName, user shows userName
  const readonlyFields = isUser
    ? [
        { icon: Mail,   value: email,      placeholder: "Email" },
        { icon: Shield, value: userType,   placeholder: "Role" },
        { icon: User,   value: userName,   placeholder: "User Name" },
        { icon: Globe,  value: companyUrl, placeholder: "Company URL" },
      ]
    : [
        { icon: Mail,   value: email,       placeholder: "Email" },
        { icon: Shield, value: userType,    placeholder: "Role" },
        { icon: User,   value: companyName, placeholder: "Company Name" },
        { icon: Globe,  value: companyUrl,  placeholder: "Company URL" },
      ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Profile Photo */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar companyName={companyName || userName} companyUrl={companyUrl} size="lg" />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Upload your company logo</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2 text-xs"><Upload className="h-3.5 w-3.5" /> Upload Photo</Button>
              <Button size="sm" variant="ghost" className="gap-2 text-xs text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Basic Information */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>

          {/* Readonly fields */}
          <div className="space-y-3">
            {readonlyFields.map(({ icon: Icon, value, placeholder }) => (
              <div key={placeholder} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={value}
                  disabled
                  readOnly
                  placeholder={placeholder}
                  className="pl-10 bg-secondary/50 border-0 text-muted-foreground cursor-not-allowed"
                />
              </div>
            ))}
          </div>

          {/* Phone — editable for all */}
          <div className="pt-2 border-t border-border">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number"
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleUpdate} disabled={saving} size="sm" className="gap-2">
              {saving ? "Saving..." : <><Check className="h-3.5 w-3.5" /> Update</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPhone("")}>Cancel</Button>
          </div>
        </div>

        {/* Password Section */}
        
<div className="bg-card border border-border rounded-2xl p-6 space-y-4">
  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
    Update Password
  </h3>

  <div className="space-y-3">
    {/* New password */}
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type={showNew ? "text" : "password"}
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        placeholder="New Password"
        className="pl-10 pr-10"
      />
      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>

    {/* Confirm password */}
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type={showConfirm ? "text" : "password"}
        value={confirmPass}
        onChange={e => setConfirmPass(e.target.value)}
        placeholder="Confirm Password"
        className="pl-10 pr-10"
      />
      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>

  <div className="flex gap-2 pt-2">
    <Button onClick={handlePasswordUpdate} disabled={savingPass} size="sm" className="gap-2">
      {savingPass ? "Updating..." : <><Check className="h-3.5 w-3.5" /> Update Password</>}
    </Button>
    <Button size="sm" variant="ghost" onClick={() => { setNewPassword(""); setConfirmPass(""); }}>
      Cancel
    </Button>
  </div>
</div>

      </div>
    </motion.div>
  );
}

// Add User Modal — only for store_admin and super_admin
function AddUserModal({ onClose, onSuccess, companyName }) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await API.post("/settings/add-user", { email, password, userName });
      toast.success("User added successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Add New User
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="User name"
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="User email"
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleAdd}
            disabled={loading}
            className="flex-1 gap-2"
          >
            {loading ? (
              "Adding..."
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Add User
              </>
            )}
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Manage Users Tab — only for store_admin and super_admin
function ManageUsersTab({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [removing, setRemoving] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/settings/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRemove = async (userId) => {
    setRemoving(userId);
    try {
      await API.delete(`/settings/users/${userId}`);
      toast.success("User removed");
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with Add User button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Team Members</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {users.length} users in your company
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Email</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No users yet — add your first team member
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {users.map((u, i) => (
              <motion.div
                key={u.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {u.email.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground truncate">
                    {u.email}
                  </span>
                </div>
                <div className="col-span-3 text-sm text-foreground">
                  {u.userName || "-"}
                </div>
                <div className="col-span-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      u.userType === "store_admin"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {u.userType === "store_admin" ? "Store Admin" : "User"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      u.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(u.userId)}
                    disabled={
                      removing === u.userId || u.userId === user?.userId
                    }
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    {removing === u.userId ? (
                      <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <AddUserModal
            onClose={() => setShowModal(false)}
            onSuccess={fetchUsers}
            companyName={user?.companyName}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Users Log Tab — only for store_admin and super_admin
function UsersLogTab() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/settings/users-log");
        setLogs(res.data);
      } catch {
        toast.error("Failed to load logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-4">Email</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-2">Company</div>
        <div className="col-span-4">Date</div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No activity logs yet</p>
        </div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-border last:border-0 text-sm hover:bg-secondary/20 transition-colors">
            <div className="col-span-4 text-foreground truncate">{log.email}</div>
            <div className="col-span-2 text-muted-foreground capitalize">{log.userType}</div>
            <div className="col-span-2 text-muted-foreground truncate">{log.companyId}</div>
            <div className="col-span-4 text-muted-foreground text-xs">
              {new Date(log.loginAt).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}

// Main Settings Page
export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const { user } = useAuth();

  // Filter tabs based on user type — 'user' only sees My Account
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "users" || tab.id === "log") {
      return (
        user?.userType === "store_admin" || user?.userType === "super_admin"
      );
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Page header with avatar */}
      <div className="flex items-center gap-4">
        <Avatar companyName={user?.companyName} companyUrl={user?.companyUrl} />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.companyName || "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.companyUrl || ""} · {user?.email || ""}
          </p>
        </div>
      </div>

      {/* Role-based tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "account" && <MyAccountTab key="account" user={user} />}
        {activeTab === "users" && <ManageUsersTab key="users" user={user} />}
        {activeTab === "log" && <UsersLogTab key="log" />}
      </AnimatePresence>
    </motion.div>
  );
}
