import { FC } from "react";
import { motion } from "framer-motion";
import { translations } from "@/lib/translations";

const HeroBanner: FC = () => {
  // Text animation variants
  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.1,
      },
    }),
  };

  // Split text for character animation
  const welcomeText = translations.home.welcomeText;
  const questionText = translations.home.questionText;

  // Features list
  const features = translations.home.features;

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
      {/* Background image with neon flicker effect */}
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

      {/* Neon flicker overlay - main glow effect */}
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

      {/* Intense flicker effect */}
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

      {/* Bright flash effect */}
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

      {/* Bright pop effect for background */}
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

      {/* Content overlay */}
      <div 
        className="relative z-10 h-full flex flex-col items-center justify-end text-white p-6"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
        }}
      >
        <div className="text-center absolute bottom-6 w-full px-4">
          {/* First line with character animation */}
          <div className="overflow-hidden mb-1">
            <motion.div
              initial={{ y: 20 }}
              animate={{ 
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: "easeOut"
                }
              }}
              className="flex justify-center"
            >
              {welcomeText.split("").map((char, index) => (
                <motion.span
                  key={`welcome-${index}`}
                  custom={index}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-3xl font-bold inline-block"
                  style={{ 
                    textShadow: "0 0 5px rgba(124, 58, 237, 0.7), 0 0 10px rgba(124, 58, 237, 0.5)"
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Second line with wave animation */}
          <div className="overflow-hidden mb-6">
            <motion.div
              initial={{ y: 20 }}
              animate={{ 
                y: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.3,
                  ease: "easeOut"
                }
              }}
              className="flex flex-wrap justify-center relative"
            >
              {/* Main text */}
              <div className="relative">
                {questionText.split("").map((char, index) => (
                  <motion.span
                    key={`question-${index}`}
                    className="text-3xl font-bold inline-block"
                    animate={{
                      x: [0, 0, 0, 0, 0, 0, -1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                      y: [0, 0, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                      filter: [
                        "none", 
                        "none", 
                        "none", 
                        "none", 
                        "blur(0.5px)", 
                        "none", 
                        "none", 
                        "none", 
                        "none", 
                        "none"
                      ],
                      opacity: [
                        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                      ]
                    }}
                    transition={{
                      duration: 3,
                      times: [
                        0, 0.1, 0.2, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.4, 
                        0.5, 0.6, 0.7, 0.8, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 
                        0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 1
                      ],
                      repeat: Infinity,
                      repeatDelay: Math.random() * 2
                    }}
                    style={{
                      textShadow: "0 0 5px rgba(124, 58, 237, 0.7), 0 0 10px rgba(124, 58, 237, 0.5)"
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>

              {/* Glitch effect overlay 1 - Red channel */}
              <motion.div 
                className="absolute top-0 left-0 w-full text-[#ff0000] mix-blend-screen opacity-50 text-3xl font-bold"
                animate={{
                  x: [0, -2, 0, 2, 0, -1, 0, 1, 0],
                  opacity: [0, 0.5, 0, 0.3, 0, 0.2, 0, 0.1, 0],
                  display: ["none", "inline-block", "none", "inline-block", "none", "inline-block", "none", "inline-block", "none"]
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1],
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                {questionText}
              </motion.div>

              {/* Glitch effect overlay 2 - Blue channel */}
              <motion.div 
                className="absolute top-0 left-0 w-full text-[#0000ff] mix-blend-screen opacity-50 text-3xl font-bold"
                animate={{
                  x: [0, 2, 0, -2, 0, 1, 0, -1, 0],
                  opacity: [0, 0.5, 0, 0.3, 0, 0.2, 0, 0.1, 0],
                  display: ["none", "inline-block", "none", "inline-block", "none", "inline-block", "none", "inline-block", "none"]
                }}
                transition={{
                  duration: 4,
                  times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1],
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                {questionText}
              </motion.div>
            </motion.div>
          </div>

          {/* Features list with staggered fade-in */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={`feature-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 1.5 + (index * 0.2),
                  duration: 0.4
                }}
                className="bg-purple-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30"
              >
                <motion.span
                  animate={{
                    textShadow: [
                      "0 0 2px rgba(124, 58, 237, 0.5)",
                      "0 0 4px rgba(124, 58, 237, 0.8)",
                      "0 0 2px rgba(124, 58, 237, 0.5)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: index * 0.3
                  }}
                  className="text-sm font-medium"
                >
                  {feature}
                </motion.span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroBanner;