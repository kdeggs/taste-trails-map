import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Star, Users, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();

  // Redirect to auth if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-rainbow bg-clip-text text-transparent">
            Your Culinary Journey
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track restaurants, create lists, share experiences, and discover your next favorite meal
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-gradient-primary hover:shadow-primary transition-all duration-300 transform hover:scale-105">
              Discover Restaurants
            </Button>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
              View My Map
            </Button>
          </div>
        </div>

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
                0
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
                -
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
                0
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
                0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                New discoveries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🗺️</span>
                <span>Your Restaurant Map</span>
              </CardTitle>
              <CardDescription>
                View all your saved restaurants and check-ins on an interactive map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gradient-soft rounded-lg flex items-center justify-center border border-white/10">
                <p className="text-muted-foreground">Interactive map coming soon...</p>
              </div>
              <Button className="w-full mt-4 bg-gradient-primary hover:shadow-primary transition-all duration-300">
                Open Map View
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📝</span>
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Your latest check-ins, reviews, and discoveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity yet.</p>
                  <p className="text-sm mt-2">Start by checking into a restaurant!</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10">
                Check In Somewhere
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
