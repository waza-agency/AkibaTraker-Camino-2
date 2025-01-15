import { FC } from "react";

const HeroBanner: FC = () => {
  return (
    <div className="relative h-[500px] overflow-hidden rounded-lg mb-8 retro-container">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: 'url("https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeihuyqjzv4elqd4ypj5kakapnjdy54nqdodbqqijbxjogwxzktegxu")',
          filter: 'brightness(0.6)',
        }}
      />
      <div 
        className="relative z-10 h-full flex flex-col items-center justify-end pb-16 text-white p-6"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
        }}
      >
        <h1 className="text-6xl font-bold glow-text mb-4 text-center">
          Bienvenidx a mi mundo, <br />¿qué aventura quieres vivir hoy?
        </h1>
      </div>
    </div>
  );
};

export default HeroBanner;