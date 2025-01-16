import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { SelectVideo } from "@db/schema";
import VideoGallery from "@/components/video-gallery";
import Navbar from "@/components/navbar";

export default function ProfilePage() {
  const { user } = useUser();
  const { data: videos } = useQuery<SelectVideo[]>({
    queryKey: ["/api/videos"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <Navbar />
      
      <div className="container py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <p className="text-lg">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Member Since</label>
                <p className="text-lg">
                  {new Date(user?.createdAt ?? "").toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Your Generated Content</h2>
          <VideoGallery />
        </div>
      </div>
    </div>
  );
}
