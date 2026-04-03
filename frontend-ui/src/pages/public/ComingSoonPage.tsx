import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ComingSoonPage = () => {
  const location = useLocation();

  // Extract a readable title from the URL path
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pageTitle = pathParts
    .map(part => part.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
    .join(" — ");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Construction className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            {pageTitle || "Coming Soon"}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            This section is coming soon. We're working hard to bring you something amazing.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/">
              <Button className="gap-2 gradient-primary text-primary-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoonPage;
