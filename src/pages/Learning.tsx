/**
 * LEARNING HUB PAGE
 * 
 * Educational resource library for farmers covering sustainable practices,
 * crop management, marketing strategies, and agricultural techniques.
 * 
 * @page
 * @example
 * ```tsx
 * <Route path="/learning" element={<Learning />} />
 * ```
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, Clock } from "lucide-react";

const Learning = () => {
  const resources = [
    {
      id: 1,
      title: "Climate-Smart Farming Basics",
      description: "Learn sustainable farming techniques to adapt to changing weather patterns",
      type: "article",
      duration: "15 min",
      category: "Sustainability",
    },
    {
      id: 2,
      title: "Maximizing Maize Yields",
      description: "Best practices for increasing your maize harvest with proper soil management",
      type: "video",
      duration: "8 min",
      category: "Crop Management",
    },
    {
      id: 3,
      title: "Market Timing Strategies",
      description: "Understanding market cycles to sell your produce at the best prices",
      type: "article",
      duration: "12 min",
      category: "Marketing",
    },
    {
      id: 4,
      title: "Organic Pest Control Methods",
      description: "Natural ways to protect your crops without harmful chemicals",
      type: "article",
      duration: "10 min",
      category: "Pest Control",
    },
    {
      id: 5,
      title: "Water Conservation Techniques",
      description: "Efficient irrigation methods to save water and reduce costs",
      type: "video",
      duration: "12 min",
      category: "Water Management",
    },
    {
      id: 6,
      title: "Post-Harvest Handling",
      description: "Proper storage and handling to minimize losses and maximize profits",
      type: "article",
      duration: "18 min",
      category: "Post-Harvest",
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Learning Hub</h1>
        <p className="text-muted-foreground">Expand your farming knowledge</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{resource.category}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {resource.type === "video" ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </div>
              </div>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{resource.duration}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Learning;
