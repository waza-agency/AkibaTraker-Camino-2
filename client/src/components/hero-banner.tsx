import { FC } from "react";
import { motion } from "framer-motion";

const HeroBanner: FC = () => {
  return (
    <motion.div 
      className="relative h-[500px] overflow-hidden rounded-lg mb-8 retro-container neon-screen"
      animate={{
        boxShadow: [
          "0 0 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.5)",
          "0 0 15px rgba(0, 0, 0, 0.5), 0 0 60px rgba(124, 58, 237, 1)",
          "0 0 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.5)"
        ]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeihuyqjzv4elqd4ypj5kakapnjdy54nqdodbqqijbxjogwxzktegxu")',
        }}
        animate={{
          filter: [
            'brightness(0.7)',
            'brightness(0.4)',
            'brightness(0.7)',
            'brightness(1.2)',
            'brightness(0.7)'
          ]
        }}
        transition={{
          duration: 4,
          times: [0, 0.3, 0.6, 0.65, 1],
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.4) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0.9, 0.1, 0.9, 0, 0.9, 0.3, 0.9],
        }}
        transition={{
          duration: 3,
          times: [0, 0.2, 0.4, 0.41, 0.6, 0.8, 1],
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute inset-0 z-[1] bg-purple-600/40 pointer-events-none"
        animate={{
          opacity: [0, 0, 0, 0.8, 0, 0, 0.6, 0]
        }}
        transition={{
          duration: 1,
          times: [0, 0.3, 0.4, 0.41, 0.42, 0.7, 0.71, 1],
          repeat: Infinity,
          repeatDelay: 1.5
        }}
      />
      <motion.div
        className="absolute inset-0 z-[1] bg-white/30 pointer-events-none"
        animate={{
          opacity: [0, 0, 0.6, 0]
        }}
        transition={{
          duration: 0.5,
          times: [0, 0.4, 0.41, 1],
          repeat: Infinity,
          repeatDelay: 2.5
        }}
      />
      <motion.div
        className="absolute inset-0 z-[1] bg-white/10 pointer-events-none"
        animate={{
          opacity: [0, 0, 0.8, 0.2, 0]
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.5, 0.52, 0.6, 1],
          repeat: Infinity,
          repeatDelay: 4
        }}
      />
      <div 
        className="relative z-10 h-full flex flex-col items-center justify-end text-white p-6"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
        }}
      >
        <h1 className="text-3xl font-bold glow-text mb-4 text-center absolute bottom-6">
          Bienvenidx a mi mundo, <br />¿qué aventura quieres vivir hoy?
        </h1>
      </div>
    </motion.div>
  );
};

export default HeroBanner;