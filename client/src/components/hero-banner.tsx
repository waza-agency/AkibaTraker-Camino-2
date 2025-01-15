import { FC } from "react";

const HeroBanner: FC = () => {
  return (
    <div className="relative h-[300px] overflow-hidden rounded-lg mb-8">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("/Leonardo_Phoenix_10_create_an_anime_inspired_header_for_a_site_1.jpg")',
          filter: 'brightness(0.7)'
        }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-5xl font-bold glow-text bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI AMV Generator
        </h1>
        <p className="text-lg mt-4 text-white/90 max-w-2xl text-center">
          Create stunning anime music videos with AI - Blend your vision with retro gaming aesthetics
        </p>
      </div>
    </div>
  );
};

export default HeroBanner;