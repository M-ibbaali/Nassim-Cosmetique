"use client";

import { useState, useEffect } from "react";
import { getCurrentProfile, getAllProfiles, updateProfile, updateEmployeeRole, uploadAvatar, createNewStaffUser } from "@/services/profiles";
import { Profile } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { User, Users, Shield, Camera, Sparkles, Crown, UserCheck, Save, UserPlus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, isRTL } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add User states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [creating, setCreating] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [current, all] = await Promise.all([
        getCurrentProfile(),
        getAllProfiles()
      ]);
      setProfile(current);
      setAllProfiles(all);
      if (current) {
        setFullName(current.full_name || "");
        setAvatarUrl(current.avatar_url || "");
      }
    } catch (err) {
      toast.error(isRTL ? "فشل تحميل البيانات" : "Failed to load settings data");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarUrl });
      toast.success(t.common.success + "! ✨");
    } catch (err) {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(userId: string, targetRole: 'admin' | 'staff') {
    const promise = updateEmployeeRole(userId, targetRole);
    
    toast.promise(promise, {
      loading: isRTL ? 'جاري تحديث الصلاحيات...' : 'Updating permissions...',
      success: () => {
        loadData();
        return isRTL ? `تم تحديث الصلاحيات إلى ${targetRole}` : `Permissions updated to ${targetRole}`;
      },
      error: isRTL ? 'فشل تحديث الصلاحيات' : 'Failed to update user role',
    });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(isRTL ? "جاري رفع الصورة..." : "Uploading image...");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { publicUrl } = await uploadAvatar(formData);
      setAvatarUrl(publicUrl);
      toast.success(isRTL ? "تم الرفع! وتذكر حفظ التغييرات." : "Avatar uploaded! Remember to save changes.", { id: toastId });
    } catch (err) {
      toast.error(isRTL ? "فشل رفع الصورة" : "Failed to upload image.", { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createNewStaffUser(newEmail, newPassword, newName, newRole);
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      loadData();
      toast.success(isRTL ? `مرحباً بك في الفريق، ${newName}!` : `Welcome to the team, ${newName}! 🎀`, { duration: 5000 });
    } catch (err: any) {
      toast.error(err.message || (isRTL ? "فشل إنشاء المستخدم" : 'Failed to create user.'));
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">{t.common.loading}...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("text-center md:text-left", isRTL && "md:text-right")}>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t.settings.title}</h2>
        <p className="text-sm text-muted-foreground font-medium">{t.settings.subtitle}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-accent/20 p-1 rounded-2xl h-14">
          <TabsTrigger value="profile" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-black uppercase text-[10px] tracking-widest">
            <User className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.settings.myProfile}
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-black uppercase text-[10px] tracking-widest">
            <Users className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.settings.teamManagement}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <form onSubmit={handleUpdateProfile}>
              <CardHeader className={isRTL ? "text-right" : "text-left"}>
                <CardTitle className="text-xl font-black">{t.settings.editProfile}</CardTitle>
                <CardDescription className="font-medium">{isRTL ? "قم بتحديث معلوماتك الشخصية وكيف يراك الآخرون." : "Update your personal information and how others see you."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                   <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center overflow-hidden border-2 border-primary/20 relative group">
                     {avatarUrl ? (
                       <img src={avatarUrl} className="w-full h-full object-cover" />
                     ) : (
                       <User className="w-12 h-12 text-muted-foreground" />
                     )}
                     {uploading && (
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       </div>
                     )}
                   </div>
                   <input 
                     type="file" 
                     id="avatar-upload" 
                     className="hidden" 
                     accept="image/*"
                     onChange={handleAvatarUpload}
                   />
                   <Button 
                    variant="outline" 
                    size="sm" 
                    type="button" 
                    disabled={uploading}
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                   >
                     {uploading ? (isRTL ? "جاري الرفع..." : "Uploading...") : t.settings.avatar}
                   </Button>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className={cn("text-xs font-black uppercase tracking-widest block", isRTL && "text-right")}>{t.settings.fullName}</Label>
                    <Input 
                      id="name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
                      className={cn("h-12 rounded-xl bg-accent/5 focus:ring-primary/20", isRTL && "text-right")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={cn("text-xs font-black uppercase tracking-widest block", isRTL && "text-right")}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</Label>
                    <Input 
                      id="email" 
                      value={profile?.id ? (isRTL ? "موثق عبر Supabase" : "Authenticated via Supabase") : ""} 
                      disabled 
                      className={cn("bg-muted/50 text-muted-foreground font-medium h-12 rounded-xl border-dashed", isRTL && "text-right")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className={cn("flex border-t pt-6", isRTL ? "justify-start" : "justify-end")}>
                <Button type="submit" disabled={saving} className="bg-gradient-to-r from-pink-500 to-violet-500 shadow-lg shadow-pink-500/20 rounded-xl font-black px-8">
                  <Save className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {saving ? (isRTL ? "جاري الحفظ..." : "Saving...") : t.settings.saveChanges}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
              <div className={isRTL ? "text-right" : "text-left"}>
                <CardTitle className="text-xl font-black">{t.settings.teamManagement}</CardTitle>
                <CardDescription className="font-medium text-xs sm:text-sm">{isRTL ? "عرض وإدارة صلاحيات جميع موظفي المتجر." : "View and manage permissions for all shop employees."}</CardDescription>
              </div>
              <Button size="sm" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 rounded-xl font-black uppercase text-[10px] tracking-widest h-10" onClick={() => setShowAddModal(true)}>
                <UserPlus className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.settings.addUser}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {allProfiles.map((p) => (
                  <div key={p.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-accent/30 bg-accent/5 gap-4", isRTL && "sm:flex-row-reverse")}>
                    <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border flex-shrink-0">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className={cn("flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
                        <p className="font-bold text-sm truncate">{p.full_name || (isRTL ? "مستخدم غير معروف" : "Unknown User")}</p>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                             p.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                           }`}>
                             {p.role === 'admin' ? t.settings.admin : t.settings.staff}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    {profile?.role === 'admin' && profile.id !== p.id && (
                      <div className={cn("flex w-full sm:w-auto", isRTL && "flex-row-reverse")}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full sm:w-auto rounded-lg font-bold text-[10px] uppercase tracking-widest h-9 bg-white sm:bg-transparent shadow-sm sm:shadow-none border sm:border-transparent"
                          onClick={() => handleRoleChange(p.id, p.role === 'admin' ? 'staff' : 'admin')}
                        >
                          {p.role === 'admin' ? (
                            <><Shield className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {isRTL ? "تنزيل الرتبة" : "Demote"}</>
                          ) : (
                            <><ShieldAlert className={cn("w-4 h-4 text-primary", isRTL ? "ml-2" : "mr-2")} /> {isRTL ? "ترقية لمدير" : "Make Admin"}</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl border-none rounded-[2rem] overflow-hidden">
            <form onSubmit={handleAddUser}>
              <CardHeader className={cn("bg-accent/10 py-8", isRTL ? "text-right" : "text-left")}>
                <CardTitle className="text-2xl font-black">{isRTL ? "إضافة موظف جديد" : "Add New Staff Member"}</CardTitle>
                <CardDescription className="font-medium">{isRTL ? "إنشاء حساب جديد لموظفي فريقك." : "Create a new account for your shop employees."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-8">
                <div className="space-y-2">
                  <Label htmlFor="newName" className={cn("text-xs font-black uppercase tracking-widest block", isRTL && "text-right")}>{t.settings.fullName}</Label>
                  <Input 
                    id="newName" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder={isRTL ? "أدخل الاسم الكامل" : "Enter full name"} 
                    className={cn("h-12 rounded-xl", isRTL && "text-right")}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className={cn("text-xs font-black uppercase tracking-widest block", isRTL && "text-right")}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</Label>
                  <Input 
                    id="newEmail" 
                    type="email"
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="staff@example.com" 
                    className={cn("h-12 rounded-xl", isRTL && "text-right")}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className={cn("text-xs font-black uppercase tracking-widest block", isRTL && "text-right")}>{isRTL ? "كلمة المرور الأولية" : "Initial Password"}</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder={isRTL ? "6 أحرف كحد أدنى" : "Min. 6 characters"} 
                    minLength={6}
                    className={cn("h-12 rounded-xl", isRTL && "text-right")}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className={cn("text-xs font-black uppercase tracking-widest block", isRTL && "text-right")}>{t.settings.role}</Label>
                  <div className={cn("flex gap-4", isRTL && "flex-row-reverse")}>
                    <label className={cn("flex items-center gap-2 cursor-pointer bg-accent/5 px-4 py-2 rounded-xl border border-transparent", newRole === 'staff' && "border-primary/20 bg-primary/5")}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="staff" 
                        checked={newRole === 'staff'} 
                        onChange={() => setNewRole('staff')} 
                        className="accent-primary"
                      />
                      <span className="text-sm font-bold">{t.settings.staff}</span>
                    </label>
                    <label className={cn("flex items-center gap-2 cursor-pointer bg-accent/5 px-4 py-2 rounded-xl border border-transparent", newRole === 'admin' && "border-primary/20 bg-primary/5")}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="admin" 
                        checked={newRole === 'admin'} 
                        onChange={() => setNewRole('admin')} 
                        className="accent-primary"
                      />
                      <span className="text-sm font-bold text-primary">{t.settings.admin}</span>
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className={cn("flex gap-3 pt-6 pb-8 border-t font-semibold", isRTL ? "justify-start" : "justify-end")}>
                <Button variant="ghost" type="button" className="rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => setShowAddModal(false)}>{t.common.cancel}</Button>
                <Button type="submit" disabled={creating} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-black px-8">
                  {creating ? (isRTL ? "جاري الإنشاء..." : "Creating...") : (isRTL ? "إنشاء مستخدم" : "Create User")}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
