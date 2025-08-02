import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { EnhancedRestaurantSearch } from "@/components/EnhancedRestaurantSearch";
import { CheckInDialog } from "@/components/CheckInDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { toast } from "@/hooks/use-toast";

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleSelectRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setShowCheckInDialog(true);
  };

  const handleAddToList = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setShowAddToListDialog(true);
  };

  const handleCheckInComplete = () => {
    setShowCheckInDialog(false);
    setSelectedRestaurant(null);
    toast({
      title: "Check-in saved!",
      description: "Your restaurant visit has been recorded.",
    });
  };

  const handleAddToListComplete = () => {
    setShowAddToListDialog(false);
    setSelectedRestaurant(null);
    toast({
      title: "Added to list!",
      description: "Restaurant has been added to your list.",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-soft pb-20">
      {/* Header */}
      <header className="p-4 pt-8">
        <h1 className="text-2xl font-bold text-foreground">Discover</h1>
        <p className="text-sm text-muted-foreground">Find amazing restaurants near you</p>
      </header>

      {/* Search Component */}
      <div className="p-4">
        <EnhancedRestaurantSearch
          onSelectRestaurant={handleSelectRestaurant}
          onAddToList={handleAddToList}
        />
      </div>

      {/* Dialogs */}
      <CheckInDialog
        restaurant={selectedRestaurant}
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        onCheckInComplete={handleCheckInComplete}
      />

      <AddToListDialog
        restaurant={selectedRestaurant}
        open={showAddToListDialog}
        onOpenChange={setShowAddToListDialog}
        onSuccess={handleAddToListComplete}
      />
      </div>
    </PageTransition>
  );
}