import { FC } from "react";
import { Card } from "@/components/ui/card";

const CharacterCard: FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <Card className="retro-container overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Character Image */}
          <div className="relative aspect-square">
            <img 
              src="https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeigjl6vws6sezux4o5toqxrdltwt4yjy2u5v3jredstwc45uvdmlgy"
              alt="Akiba - AI AMV DJ"
              className="object-cover w-full h-full rounded-lg pixel-borders"
            />
          </div>
          
          {/* Character Info */}
          <div className="flex flex-col justify-center space-y-4">
            <h2 className="text-4xl font-bold glow-text">Akiba</h2>
            <p className="text-xl text-muted-foreground">El DJ que transforma clásicos en anime vibes</p>
            
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">
                Un humanoide estilizado y carismático con un look urbano-futurista inspirado en el anime y el cyberpunk. 
                Con su inteligencia artificial avanzada, puede transformar cualquier melodía en una obra maestra al estilo anime.
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 text-sm bg-sidebar-accent rounded-full">Creativo</span>
                <span className="px-3 py-1 text-sm bg-sidebar-accent rounded-full">Emocional</span>
                <span className="px-3 py-1 text-sm bg-sidebar-accent rounded-full">Vibrante</span>
              </div>
              
              <blockquote className="italic text-sm border-l-4 border-primary pl-4 mt-4">
                "Cada canción tiene una historia, y yo le doy un nuevo capítulo en clave anime."
              </blockquote>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CharacterCard;
