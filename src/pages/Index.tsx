import { useState, useEffect } from "react";
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Star, Users, TrendingUp, Search, Heart, Plus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { RestaurantSearch } from "@/components/RestaurantSearch";
import { CreateListDialog } from "@/components/CreateListDialog";
import { CheckInDialog } from "@/components/CheckInDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { ListViewDialog } from "@/components/ListViewDialog";
import Map from "@/components/Map";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id?: string
  google_place_id?: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  rating?: number
  price_level?: number
  image_url?: string
  cuisine_type?: string
}

interface RestaurantList {
  id: string
  name: string
  description?: string
  color_theme: string
  is_public: boolean
  created_at: string
  restaurant_count?: number
}

interface CheckIn {
  id: string
  visited_at: string
  notes?: string
  rating?: number
  images?: string[]
  restaurant: {
    id: string
    name: string
    address: string
    image_url?: string
  }
  profile: {
    display_name?: string
    username?: string
  }
}

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [addToListDialogOpen, setAddToListDialogOpen] = useState(false);
  const [listViewDialogOpen, setListViewDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<RestaurantList | null>(null);
  const [lists, setLists] = useState<RestaurantList[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);
  const [stats, setStats] = useState({
    placesVisited: 0,
    averageRating: 0,
    following: 0,
    thisMonth: 0
  });
  const { toast } = useToast();

  // Redirect to auth if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      loadUserLists();
      loadRecentCheckIns();
      loadStats();
    }
  }, [user]);

  const loadUserLists = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_lists')
        .select(`
          *,
          restaurant_list_items(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listsWithCount = data.map(list => ({
        ...list,
        restaurant_count: list.restaurant_list_items?.[0]?.count || 0
      }));

      setLists(listsWithCount);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          restaurants(id, name, address, image_url)
        `)
        .order('visited_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedCheckIns = data?.map(checkIn => ({
        ...checkIn,
        restaurant: checkIn.restaurants,
        profile: { display_name: 'You', username: 'you' } // Simplified for now
      })) || [];

      setRecentCheckIns(formattedCheckIns);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get check-ins count
      const { count: placesVisited } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get average rating
      const { data: ratings } = await supabase
        .from('check_ins')
        .select('rating')
        .eq('user_id', user?.id)
        .not('rating', 'is', null);

      const averageRating = ratings?.length 
        ? ratings.reduce((sum, item) => sum + (item.rating || 0), 0) / ratings.length 
        : 0;

      // Get following count
      const { count: following } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user?.id);

      // Get this month's check-ins
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: thisMonth } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('visited_at', startOfMonth.toISOString());

      setStats({
        placesVisited: placesVisited || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        following: following || 0,
        thisMonth: thisMonth || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCheckInDialogOpen(true);
  };

  const handleAddToList = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setAddToListDialogOpen(true);
  };

  const handleViewList = (list: RestaurantList) => {
    setSelectedList(list);
    setListViewDialogOpen(true);
  };

  const handleCheckInComplete = () => {
    loadRecentCheckIns();
    loadStats();
    toast({
      title: "Check-in successful!",
      description: "Your check-in has been added to your feed.",
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-white/10 glass-dark">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-xl">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Taste Trails
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, {user?.user_metadata?.display_name || 'Food Explorer'}!
            </span>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="border-white/20 hover:bg-white/10 transition-smooth"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass border-0 mb-8">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="lists" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              My Lists
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="glass border-0 shadow-soft hover:shadow-primary transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Places Visited</CardTitle>
                <MapPin className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {stats.placesVisited}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Start exploring!
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-soft hover:shadow-secondary transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                <Star className="w-4 h-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
                {stats.averageRating || '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rate your visits
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-soft hover:shadow-accent transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Following</CardTitle>
                <Users className="w-4 h-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                {stats.following}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Connect with friends
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                <TrendingUp className="w-4 h-4 text-tertiary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tertiary">
                {stats.thisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                New discoveries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card className="glass border-0 shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Your Restaurant Map
            </CardTitle>
            <CardDescription>
              See all your check-ins and saved restaurants on the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Map userId={user?.id} />
          </CardContent>
        </Card>

          <TabsContent value="discover" className="space-y-6">
            <Card className="glass border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Restaurants
                </CardTitle>
                <CardDescription>
                  Search for restaurants and check in to your favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RestaurantSearch 
                  onSelectRestaurant={handleSelectRestaurant} 
                  onAddToList={handleAddToList}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lists" className="space-y-6">
            <Card className="glass border-0 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    My Restaurant Lists
                  </CardTitle>
                  <CardDescription>
                    Organize your favorite restaurants into custom lists
                  </CardDescription>
                </div>
                <CreateListDialog onListCreated={loadUserLists} />
              </CardHeader>
              <CardContent>
                {loadingLists ? (
                  <p>Loading your lists...</p>
                ) : lists.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't created any lists yet.</p>
                    <CreateListDialog onListCreated={loadUserLists} />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {lists.map((list) => (
                      <Card 
                        key={list.id} 
                        className="cursor-pointer hover:bg-accent/50 transition-colors glass border-0"
                        onClick={() => handleViewList(list)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{list.name}</h3>
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: list.color_theme }}
                            />
                          </div>
                          {list.description && (
                            <p className="text-sm text-muted-foreground mb-2">{list.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {list.restaurant_count} restaurants
                            </span>
                            {list.is_public && (
                              <Badge variant="secondary" className="text-xs">Public</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feed" className="space-y-6">
            <Card className="glass border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Check-ins
                </CardTitle>
                <CardDescription>
                  See what you and others have been eating
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCheckIns ? (
                  <p>Loading recent check-ins...</p>
                ) : recentCheckIns.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No check-ins yet. Start exploring restaurants!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCheckIns.map((checkIn) => (
                      <Card key={checkIn.id} className="glass border-0">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {checkIn.restaurant.image_url && (
                              <img
                                src={checkIn.restaurant.image_url}
                                alt={checkIn.restaurant.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{checkIn.restaurant.name}</h3>
                                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                    <MapPin className="h-3 w-3" />
                                    {checkIn.restaurant.address}
                                  </div>
                                </div>
                                {checkIn.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{checkIn.rating}</span>
                                  </div>
                                )}
                              </div>
                              {checkIn.notes && (
                                <p className="text-sm mt-2 text-muted-foreground">{checkIn.notes}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(checkIn.visited_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="glass border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Profile settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <CheckInDialog
        restaurant={selectedRestaurant}
        open={checkInDialogOpen}
        onOpenChange={setCheckInDialogOpen}
        onCheckInComplete={handleCheckInComplete}
      />

      <AddToListDialog
        restaurant={selectedRestaurant}
        open={addToListDialogOpen}
        onOpenChange={setAddToListDialogOpen}
        onSuccess={() => {
          loadUserLists();
          toast({
            title: "Restaurant added!",
            description: "Restaurant has been added to your list.",
          });
        }}
      />

      <ListViewDialog
        list={selectedList}
        open={listViewDialogOpen}
        onOpenChange={setListViewDialogOpen}
        onListUpdated={loadUserLists}
      />
    </div>
  );
};

export default Index;
