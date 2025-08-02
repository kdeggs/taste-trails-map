import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus } from "lucide-react";

interface Restaurant {
  google_place_id?: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  price_level?: number;
  image_url?: string;
  cuisine_type?: string;
}

interface RestaurantList {
  id: string;
  name: string;
  description?: string;
  color_theme: string;
  is_public: boolean;
  restaurant_count?: number;
}

interface AddToListDialogProps {
  restaurant: Restaurant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddToListDialog({ restaurant, open, onOpenChange, onSuccess }: AddToListDialogProps) {
  const [lists, setLists] = useState<RestaurantList[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      loadUserLists();
    }
  }, [open, user]);

  const loadUserLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_lists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error loading lists:', error);
      toast({
        title: "Error",
        description: "Failed to load your lists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToList = async (listId: string) => {
    if (!restaurant || !user) return;

    setSubmitting(true);
    try {
      // First, check if restaurant exists in our database
      let restaurantId: string;
      
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('name', restaurant.name)
        .eq('address', restaurant.address)
        .single();

      if (existingRestaurant) {
        restaurantId = existingRestaurant.id;
      } else {
        // Create the restaurant
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: restaurant.name,
            address: restaurant.address,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            image_url: restaurant.image_url,
            cuisine_type: restaurant.cuisine_type,
            price_range: restaurant.price_level,
          })
          .select('id')
          .single();

        if (restaurantError) throw restaurantError;
        restaurantId = newRestaurant.id;
      }

      // Check if restaurant is already in the list
      const { data: existingItem } = await supabase
        .from('restaurant_list_items')
        .select('id')
        .eq('list_id', listId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (existingItem) {
        toast({
          title: "Already in list",
          description: "This restaurant is already in the selected list",
        });
        return;
      }

      // Add to list
      const { error: listError } = await supabase
        .from('restaurant_list_items')
        .insert({
          list_id: listId,
          restaurant_id: restaurantId,
        });

      if (listError) throw listError;

      toast({
        title: "Added to list!",
        description: `${restaurant.name} has been added to your list`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding to list:', error);
      toast({
        title: "Error",
        description: "Failed to add restaurant to list",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Add to List
          </DialogTitle>
          <DialogDescription>
            Add {restaurant.name} to one of your restaurant lists
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading your lists...</p>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't created any lists yet.</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <Plus className="h-4 w-4 mr-2" />
                Create a list first
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lists.map((list) => (
                <Card key={list.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-3" onClick={() => addToList(list.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: list.color_theme }}
                        />
                        <div>
                          <h4 className="font-medium">{list.name}</h4>
                          {list.description && (
                            <p className="text-sm text-muted-foreground">{list.description}</p>
                          )}
                        </div>
                      </div>
                      {list.is_public && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}