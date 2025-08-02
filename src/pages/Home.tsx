import { useState, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Star, Users, TrendingUp, LogOut, Edit3, Trash2, MoreVertical } from "lucide-react";
import Map from "@/components/Map";
import { CheckInDialog } from "@/components/CheckInDialog";
import { CheckInDetailsDialog } from "@/components/CheckInDetailsDialog";

interface CheckIn {
  id: string;
  visited_at: string;
  notes?: string;
  rating?: number;
  restaurants: {
    id: string;
    name: string;
    address: string;
    image_url?: string;
  };
  profiles: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export default function Home() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    placesVisited: 0,
    averageRating: 0,
    following: 0,
    thisMonth: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [deleteCheckInId, setDeleteCheckInId] = useState<string | null>(null);
  const [viewingCheckIn, setViewingCheckIn] = useState<CheckIn | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    try {
      await Promise.all([loadStats(), loadRecentCheckIns()]);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("rating, visited_at")
      .eq("user_id", user.id);

    const placesVisited = checkIns?.length || 0;
    const averageRating = checkIns?.length
      ? checkIns.reduce((sum, checkIn) => sum + (checkIn.rating || 0), 0) / checkIns.length
      : 0;

    const thisMonth = checkIns?.filter(checkIn => {
      const visitDate = new Date(checkIn.visited_at);
      const now = new Date();
      return visitDate.getMonth() === now.getMonth() && 
             visitDate.getFullYear() === now.getFullYear();
    }).length || 0;

    setStats({
      placesVisited,
      averageRating: Math.round(averageRating * 10) / 10,
      following: 0, // Placeholder for future social features
      thisMonth,
    });
  };

  const loadRecentCheckIns = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("check_ins")
      .select(`
        id,
        visited_at,
        notes,
        rating,
        restaurants (
          id,
          name,
          address,
          image_url
        )
      `)
      .eq("user_id", user.id)
      .order("visited_at", { ascending: false })
      .limit(5);

    // Transform data to match the interface (adding mock profiles for now)
    const transformedData = data?.map(item => ({
      ...item,
      profiles: {
        id: user.id,
        display_name: user.email?.split('@')[0] || 'User',
        avatar_url: undefined
      }
    })) || [];

    setRecentCheckIns(transformedData);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleCheckInComplete = () => {
    setShowCheckInDialog(false);
    setSelectedRestaurant(null);
    setEditingCheckIn(null);
    loadUserData();
    toast({
      title: editingCheckIn ? "Check-in updated!" : "Check-in saved!",
      description: editingCheckIn ? "Your restaurant visit has been updated." : "Your restaurant visit has been recorded.",
    });
  };

  const handleEditCheckIn = (checkIn: CheckIn) => {
    setEditingCheckIn(checkIn);
    setSelectedRestaurant(checkIn.restaurants);
    setShowCheckInDialog(true);
  };

  const handleDeleteCheckIn = async (checkInId: string) => {
    try {
      const { error } = await supabase
        .from("check_ins")
        .delete()
        .eq("id", checkInId);

      if (error) throw error;

      loadUserData();
      toast({
        title: "Check-in deleted",
        description: "Your restaurant visit has been removed.",
      });
    } catch (error) {
      console.error("Error deleting check-in:", error);
      toast({
        title: "Error",
        description: "Failed to delete check-in. Please try again.",
        variant: "destructive",
      });
    }
    setDeleteCheckInId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-soft pb-20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Trail</h1>
          <p className="text-sm text-muted-foreground">Your culinary journey</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="btn-press"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="btn-interactive hover:shadow-primary-glow hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Places Visited</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.placesVisited}</div>
              <p className="text-xs text-muted-foreground">Start exploring!</p>
            </CardContent>
          </Card>

          <Card className="btn-interactive hover:shadow-secondary-glow hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">Rate your visits</p>
            </CardContent>
          </Card>

          <Card className="btn-interactive hover:shadow-accent-glow hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Following</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.following}</div>
              <p className="text-xs text-muted-foreground">Connect with friends</p>
            </CardContent>
          </Card>

          <Card className="btn-interactive hover:shadow-tertiary-glow hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-tertiary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tertiary">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">New discoveries</p>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Your Restaurant Map
            </CardTitle>
            <CardDescription>
              See all your check-ins and saved restaurants on the map
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 rounded-lg overflow-hidden">
              <Map userId={user?.id} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recent Check-ins
            </CardTitle>
            <CardDescription>
              See what you and others have been eating
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length > 0 ? (
              <div className="space-y-4">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-secondary/10 transition-colors cursor-pointer"
                    onClick={() => setViewingCheckIn(checkIn)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {checkIn.restaurants?.image_url ? (
                        <img
                          src={checkIn.restaurants.image_url}
                          alt={checkIn.restaurants?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {checkIn.restaurants?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {checkIn.restaurants?.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(checkIn.visited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {checkIn.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-current text-secondary" />
                          <span className="text-sm font-medium">{checkIn.rating}</span>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleEditCheckIn(checkIn)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteCheckInId(checkIn.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No check-ins yet. Start exploring!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Details Dialog */}
      <CheckInDetailsDialog
        checkIn={viewingCheckIn}
        open={!!viewingCheckIn}
        onOpenChange={() => setViewingCheckIn(null)}
      />

      {/* Check-in Dialog */}
      <CheckInDialog
        restaurant={selectedRestaurant}
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        onCheckInComplete={handleCheckInComplete}
        editingCheckIn={editingCheckIn}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCheckInId} onOpenChange={() => setDeleteCheckInId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this check-in? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCheckInId && handleDeleteCheckIn(deleteCheckInId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageTransition>
  );
}