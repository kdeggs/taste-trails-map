import { Badge } from "@/components/ui/badge"

const cuisineCategories = [
  { name: "All", emoji: "🍽️", value: "" },
  { name: "Italian", emoji: "🍝", value: "italian" },
  { name: "Asian", emoji: "🍜", value: "asian" },
  { name: "Mexican", emoji: "🌮", value: "mexican" },
  { name: "American", emoji: "🍔", value: "american" },
  { name: "Indian", emoji: "🍛", value: "indian" },
  { name: "French", emoji: "🥐", value: "french" },
  { name: "Mediterranean", emoji: "🫒", value: "mediterranean" },
  { name: "Japanese", emoji: "🍣", value: "japanese" },
  { name: "Thai", emoji: "🌶️", value: "thai" },
  { name: "Chinese", emoji: "🥟", value: "chinese" },
]

interface CuisineCategoriesProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CuisineCategories({ selectedCategory, onCategoryChange }: CuisineCategoriesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Cuisine Types</h3>
      <div className="flex flex-wrap gap-2">
        {cuisineCategories.map((category) => (
          <Badge
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "secondary"}
            className="cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-2 text-sm"
            onClick={() => onCategoryChange(category.value)}
          >
            <span className="mr-1">{category.emoji}</span>
            {category.name}
          </Badge>
        ))}
      </div>
    </div>
  )
}