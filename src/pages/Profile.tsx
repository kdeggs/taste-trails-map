import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  MapPin,
  Star,
  List,
  Calendar
} from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-soft pb-20">
      {/* Header */}
      <header className="p-4 pt-8">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </header>

      <div className="p-4 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{user.email}</CardTitle>
                <CardDescription>Taste Trails Explorer</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-lg font-bold">0</div>
              <div className="text-xs text-muted-foreground">Places</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 text-secondary mx-auto mb-2" />
              <div className="text-lg font-bold">0</div>
              <div className="text-xs text-muted-foreground">Reviews</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <List className="h-6 w-6 text-accent mx-auto mb-2" />
              <div className="text-lg font-bold">0</div>
              <div className="text-xs text-muted-foreground">Lists</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-tertiary mx-auto mb-2" />
              <div className="text-lg font-bold">0</div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors btn-press cursor-pointer">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Edit Profile</p>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors btn-press cursor-pointer">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors btn-press cursor-pointer">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Privacy & Security</p>
                  <p className="text-sm text-muted-foreground">Control your privacy settings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Support & Help
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors btn-press cursor-pointer">
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Help Center</p>
                  <p className="text-sm text-muted-foreground">Get answers to common questions</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors btn-press cursor-pointer">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Contact Support</p>
                  <p className="text-sm text-muted-foreground">Get help from our team</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full btn-interactive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </PageTransition>
  );
}