import { useState, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, List as ListIcon, Lock, Globe } from "lucide-react";
import { CreateListDialog } from "@/components/CreateListDialog";
import { ListViewDialog } from "@/components/ListViewDialog";

interface RestaurantList {
  id: string;
  name: string;
  description?: string;
  color_theme: string;
  is_public: boolean;
  created_at: string;
  _count?: {
    restaurant_list_items: number;
  };
}

export default function Lists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userLists, setUserLists] = useState<RestaurantList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedList, setSelectedList] = useState<RestaurantList | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadUserLists();
  }, [user, navigate]);

  const loadUserLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("restaurant_lists")
        .select(`
          *,
          restaurant_list_items (count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const listsWithCount = data?.map(list => ({
        ...list,
        _count: {
          restaurant_list_items: list.restaurant_list_items?.length || 0
        }
      })) || [];

      setUserLists(listsWithCount);
    } catch (error) {
      console.error("Error loading lists:", error);
      toast({
        title: "Error",
        description: "Failed to load your lists. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewList = (list: RestaurantList) => {
    setSelectedList(list);
    setShowViewDialog(true);
  };

  const handleCreateComplete = () => {
    loadUserLists();
    toast({
      title: "List created!",
      description: "Your new restaurant list has been created.",
    });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center pb-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-soft pb-20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Lists</h1>
          <p className="text-sm text-muted-foreground">Organize your favorite restaurants</p>
        </div>
        <CreateListDialog onListCreated={handleCreateComplete} />
      </header>

      <div className="p-4">
        {userLists.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userLists.map((list) => (
              <Card
                key={list.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-soft hover:-translate-y-1 btn-press"
                onClick={() => handleViewList(list)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ListIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base truncate">{list.name}</CardTitle>
                    </div>
                    {list.is_public ? (
                      <Globe className="h-4 w-4 text-accent" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {list.description && (
                    <CardDescription className="text-sm line-clamp-2">
                      {list.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {list._count?.restaurant_list_items || 0} restaurants
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(list.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No lists yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first restaurant list to get started
            </p>
            <CreateListDialog onListCreated={handleCreateComplete} />
          </div>
        )}
      </div>

      {/* Dialogs */}
        <ListViewDialog
          list={selectedList}
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          onListUpdated={loadUserLists}
        />
      </div>
    </PageTransition>
  );
}