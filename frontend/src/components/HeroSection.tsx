import { motion } from "motion/react";
import { useState, useEffect } from "react";

const textContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const charItem = {
  hidden: { opacity: 0, y: "100%" },
  show: { opacity: 1, y: "0%", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
};

function AnimatedLine({ line }: { line: string }) {
  return (
    <>
      {line.split(" ").map((word, i, arr) => (
        <span key={i} className="inline-block">
          <span className="inline-block overflow-hidden pt-1 pb-3 -mb-3 mt-1 -mt-1">
            {word.split("").map((char, j) => (
              <motion.span key={j} variants={charItem} className="inline-block">
                {char}
              </motion.span>
            ))}
          </span>
          {i !== arr.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </>
  );
}

const VERSES = [
  { text: "Camina por fe, no por vista.", author: "2 Corintios 5:7" },
  { text: "Todo lo puedo en Cristo que me fortalece.", author: "Filipenses 4:13" },
  { text: "El Señor es mi pastor, nada me faltará.", author: "Salmo 23:1" },
  { text: "No temas, porque yo estoy contigo.", author: "Isaías 41:10" },
  { text: "Confía en el Señor de todo corazón.", author: "Proverbios 3:5" },
  { text: "El amor todo lo sufre, todo lo cree, todo lo espera.", author: "1 Corintios 13:7" }
];

const NATURE_IMAGES = [
  "https://picsum.photos/id/1018/1920/1080",
  "https://picsum.photos/id/1036/1920/1080",
  "https://picsum.photos/id/1043/1920/1080",
  "https://picsum.photos/id/1044/1920/1080",
];

export default function HeroSection() {
  const [verseIndex, setVerseIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const dayOfYear = Math.floor(Date.now() / 86400000);
    setVerseIndex(dayOfYear % VERSES.length);
    const hour = new Date().getHours();
    setImageIndex(Math.floor(hour / 6) % NATURE_IMAGES.length);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[200vh] md:h-screen w-full relative p-2 gap-2 font-sans bg-[#050505]">
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-gradient-to-br from-[#FFECC7] via-[#FF9800] to-[#E65100] rounded-2xl relative overflow-hidden shrink-0">
        <div className="absolute top-[35%] left-0 w-full px-6 md:pr-14 lg:pr-20 xl:pr-24 z-10 flex flex-col items-center md:items-end text-center md:text-right">
          <motion.h1 variants={textContainer} initial="hidden" animate="show" className="text-[32px] sm:text-[40px] md:text-[46px] lg:text-[4rem] xl:text-[4.5rem] leading-[1.05] font-serif tracking-tight text-[#2A1D11]">
            <AnimatedLine line={VERSES[verseIndex]?.text.split(',')[0] + (VERSES[verseIndex]?.text.includes(',') ? ',' : '') || ""} />
            {VERSES[verseIndex]?.text.includes(',') && <br />}
            {VERSES[verseIndex]?.text.includes(',') && <AnimatedLine line={VERSES[verseIndex]?.text.split(',').slice(1).join(',').trim() || ""} />}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="mt-4 md:mt-6 text-[#2A1D11]/70 font-sans font-bold tracking-[0.15em] uppercase text-xs md:text-sm">
            — {VERSES[verseIndex]?.author}
          </motion.p>
        </div>
      </div>
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative rounded-2xl overflow-hidden bg-[#111] shrink-0">
        <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
          <img src={NATURE_IMAGES[imageIndex]} alt="Nature" className="w-full h-full object-cover opacity-95" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>
        <div className="absolute top-[35%] left-0 w-full px-6 md:pl-14 lg:pl-20 xl:pl-24 z-10 flex flex-col items-center md:items-start text-white text-center md:text-left">
          <motion.h2 variants={textContainer} initial="hidden" animate="show" className="text-[32px] sm:text-[40px] md:text-[46px] lg:text-[4rem] xl:text-[4.5rem] leading-[1.05] font-serif tracking-tight mb-4 md:mb-6 drop-shadow-md">
            <AnimatedLine line="Bienvenido" /><br /><AnimatedLine line="Diego." />
          </motion.h2>
          <p className="text-[15px] sm:text-base lg:text-[1.125rem] opacity-90 mb-8 md:mb-10 font-light leading-relaxed max-w-[420px] drop-shadow-md mx-auto md:mx-0 font-inter">
            Scrittapp es tu espacio personal para organizar tus pensamientos, registrar tus hábitos diarios y alcanzar tus metas paso a paso.
          </p>
        </div>
      </div>
    </div>
  );
}
