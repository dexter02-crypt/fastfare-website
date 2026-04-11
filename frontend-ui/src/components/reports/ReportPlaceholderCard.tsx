import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface ReportPlaceholderCardProps {
  title: string;
  comingSoon?: boolean;
}

export const ReportPlaceholderCard = ({ title, comingSoon = false }: ReportPlaceholderCardProps) => {
  if (comingSoon) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className="p-6 border-2 border-dashed border-muted-foreground/20 bg-muted/20 cursor-not-allowed opacity-55 relative overflow-hidden"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute top-3 right-3"
              >
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Coming Soon
                </Badge>
              </motion.div>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  This report will be available soon
                </p>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This report will be available soon</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="p-6 border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground/70 mt-2">
          Click to view report
        </p>
      </div>
    </Card>
  );
};

export default ReportPlaceholderCard;