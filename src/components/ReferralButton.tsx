import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ReferralButton = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/referrals">
            <Button variant="ghost" size="icon" className="relative">
              <UserPlus className="h-5 w-5" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refer Friends</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};