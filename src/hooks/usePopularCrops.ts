import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Default hardcoded crops that always appear
const DEFAULT_CROPS = [
  "Maize",
  "Beans",
  "Tomatoes",
  "Potatoes",
  "Cabbages",
  "Onions",
  "Carrots",
];

export const usePopularCrops = () => {
  const [crops, setCrops] = useState<string[]>(DEFAULT_CROPS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularCrops = async () => {
      try {
        const { data, error } = await supabase.rpc("get_popular_crops");
        
        if (error) throw error;

        if (data && data.length > 0) {
          // Get popular crop names and capitalize them
          const popularCrops = data.map((item: any) => 
            item.crop_name.charAt(0).toUpperCase() + item.crop_name.slice(1)
          );
          
          // Merge with defaults, removing duplicates
          const allCrops = Array.from(new Set([...DEFAULT_CROPS, ...popularCrops]));
          
          // Sort alphabetically
          allCrops.sort();
          
          setCrops(allCrops);
        }
      } catch (error) {
        console.error("Error fetching popular crops:", error);
        // Keep default crops on error
      } finally {
        setLoading(false);
      }
    };

    fetchPopularCrops();
  }, []);

  return { crops, loading };
};

