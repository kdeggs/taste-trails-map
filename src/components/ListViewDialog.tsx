import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Heart, MapPin, Star, Trash2, Edit, DollarSign } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  price_range?: number;
  image_url?: string;
  cuisine_type?: string;
}

interface RestaurantList {
  id: string;
  name: string;
  description?: string;
  color_theme: string;
  is_public: boolean;
  created_at: string;
}

interface ListViewDialogProps {
  list: RestaurantList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListUpdated: () => void;
}

export function ListViewDialog({ list, open, onOpenChange, onListUpdated }: ListViewDialogProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color_theme: '#ff6b9d',
    is_public: false
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && list) {
      loadListRestaurants();
      setEditForm({
        name: list.name,
        description: list.description || '',
        color_theme: list.color_theme,
        is_public: list.is_public
      });
    }
  }, [open, list]);

  const loadListRestaurants = async () => {
    if (!list) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_list_items')
        .select(`
          restaurants(*)
        `)
        .eq('list_id', list.id);

      if (error) throw error;
      
      const restaurantData = data?.map(item => item.restaurants).filter(Boolean) || [];
      setRestaurants(restaurantData);
    } catch (error) {
      console.error('Error loading list restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromList = async (restaurantId: string) => {
    if (!list) return;

    try {
      const { error } = await supabase
        .from('restaurant_list_items')
        .delete()
        .eq('list_id', list.id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      toast({
        title: "Removed from list",
        description: "Restaurant has been removed from your list",
      });

      loadListRestaurants();
    } catch (error) {
      console.error('Error removing from list:', error);
      toast({
        title: "Error",
        description: "Failed to remove restaurant",
        variant: "destructive",
      });
    }
  };

  const updateList = async () => {
    if (!list) return;

    try {
      const { error } = await supabase
        .from('restaurant_lists')
        .update({
          name: editForm.name,
          description: editForm.description,
          color_theme: editForm.color_theme,
          is_public: editForm.is_public
        })
        .eq('id', list.id);

      if (error) throw error;

      toast({
        title: "List updated",
        description: "Your list has been updated successfully",
      });

      setEditing(false);
      onListUpdated();
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: "Error",
        description: "Failed to update list",
        variant: "destructive",
      });
    }
  };

  const deleteList = async () => {
    if (!list || !confirm('Are you sure you want to delete this list?')) return;

    try {
      const { error } = await supabase
        .from('restaurant_lists')
        .delete()
        .eq('id', list.id);

      if (error) throw error;

      toast({
        title: "List deleted",
        description: "Your list has been deleted",
      });

      onOpenChange(false);
      onListUpdated();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error",
        description: "Failed to delete list",
        variant: "destructive",
      });
    }
  };

  const formatPriceRange = (range?: number) => {
    if (!range) return null;
    return '$'.repeat(range);
  };

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: list.color_theme }}
              />
              {editing ? 'Edit List' : list.name}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(!editing)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteList}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogDescription>
            {editing ? 'Edit your list details' : `${restaurants.length} restaurants in this list`}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">List Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="color">Color Theme</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  id="color"
                  value={editForm.color_theme}
                  onChange={(e) => setEditForm({ ...editForm, color_theme: e.target.value })}
                  className="w-8 h-8 rounded border"
                />
                <span className="text-sm text-muted-foreground">{editForm.color_theme}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={editForm.is_public}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_public: checked })}
              />
              <Label htmlFor="public">Make list public</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={updateList}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {list.description && (
              <p className="text-sm text-muted-foreground">{list.description}</p>
            )}

            {loading ? (
              <p className="text-center py-4">Loading restaurants...</p>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No restaurants in this list yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the "Add to List" button when searching restaurants to add them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {restaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="hover:bg-secondary/10 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {restaurant.image_url && (
                          <img
                            src={restaurant.image_url}
                            alt={restaurant.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold truncate">{restaurant.name}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromList(restaurant.id)}
                              className="text-destructive hover:text-destructive ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {restaurant.address && (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{restaurant.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {restaurant.price_range && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatPriceRange(restaurant.price_range)}
                              </Badge>
                            )}
                            {restaurant.cuisine_type && (
                              <Badge variant="outline" className="capitalize">
                                {restaurant.cuisine_type.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}