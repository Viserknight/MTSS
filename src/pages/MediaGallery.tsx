import { Link } from "react-router-dom";
import { ArrowLeft, Image, Video, Calendar, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Placeholder data - in a real app, this would come from the database
const photos = [
  { id: 1, title: "Sports Day 2024", date: "2024-03-15", placeholder: true },
  { id: 2, title: "Science Fair", date: "2024-02-20", placeholder: true },
  { id: 3, title: "Cultural Festival", date: "2024-01-10", placeholder: true },
  { id: 4, title: "Graduation Ceremony", date: "2023-12-01", placeholder: true },
  { id: 5, title: "Parent Meeting", date: "2023-11-15", placeholder: true },
  { id: 6, title: "Tree Planting", date: "2023-10-25", placeholder: true },
];

const videos = [
  { id: 1, title: "Annual Day Performance", date: "2024-02-28", placeholder: true },
  { id: 2, title: "Sports Day Highlights", date: "2024-03-15", placeholder: true },
  { id: 3, title: "School Tour", date: "2023-09-01", placeholder: true },
];

const MediaGallery = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Media Gallery</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">School Events Gallery</h2>
            <p className="text-muted-foreground">
              Explore photos and videos from our school events and activities
            </p>
          </div>

          {/* Tabs for Photos and Videos */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
            </TabsList>

            {/* Photos Tab */}
            <TabsContent value="photos">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <AspectRatio ratio={4 / 3}>
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Photo coming soon</p>
                          </div>
                        </div>
                      </AspectRatio>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {photo.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(photo.date).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <AspectRatio ratio={16 / 9}>
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Video coming soon</p>
                          </div>
                        </div>
                      </AspectRatio>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(video.date).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Empty State / Upload Prompt */}
          <div className="mt-12 text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Want to add media?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Teachers and admins can upload photos and videos from school events
            </p>
            <Link to="/login">
              <Button variant="outline">Login to Upload</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MediaGallery;
