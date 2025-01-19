import { FC } from "react";
import { Card } from "@/components/ui/card";
import { MoodIndicator } from "./mood-indicator";
import { useMood } from "@/hooks/use-mood";
import { motion, AnimatePresence } from "framer-motion";

const moodVideos = {
  happy: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeicu5vjdynha335bgy33ma4xl66worzexkji7yluongayvqkfyb3xi",
  energetic: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeibgqkgzdokcbm3p7gzzvtz5lp5hz5awiqfzd6vdtccnqjceabnfzy",
  calm: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeici4uce7c6p7ypgkyguazxwozpv3x64yd2jcyjwwmowdsoazc3jhm",
  serious: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeibxskahlx6eaed7d5ngsjkx2yvypm74gsyd5yf4msxw7643ubmoti",
  kawaii: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeihtcbfmicmblro5jtoyoi3edjt3sp3rnvpr5bzitfs7re6chxnt6q",
  bored: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiag5zwawnbbdvjbrjmxorpobfyiuc2ncqr7azgylbuhpfrwcjaaha"
};

const CharacterCard: FC = () => {
  const { currentMood } = useMood();

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <Card className="retro-container overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Character Video */}
          <div className="relative aspect-square">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMood}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <video 
                  key={moodVideos[currentMood]}
                  src={moodVideos[currentMood]}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover w-full h-full rounded-lg pixel-borders"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute top-4 right-4">
              <MoodIndicator mood={currentMood} className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full" hideVideo={true} />
            </div>
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