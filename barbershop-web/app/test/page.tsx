"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function Home() {
const [progress, setProgress] = useState(0);
const [pageLoaded, setPageLoaded] = useState(false);
const [minTimeDone, setMinTimeDone] = useState(false);
const [isLoading, setIsLoading] = useState(true);

// 1. Deteta o carregamento real da página
useEffect(() => {
if (document.readyState === "complete") {
    setPageLoaded(true);
} else {
    const handleLoad = () => setPageLoaded(true);
    window.addEventListener("load", handleLoad);
    return () => window.removeEventListener("load", handleLoad);
}
}, []);

// 2. Tempo mínimo de ecrã para a animação respirar
useEffect(() => {
const timer = setTimeout(() => {
    setMinTimeDone(true);
}, 2000);
return () => clearTimeout(timer);
}, []);

// 3. Orquestrador do progresso
useEffect(() => {
const timer = setInterval(() => {
    setProgress((prev) => {
    if (pageLoaded && minTimeDone) {
        if (prev >= 100) {
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 400); 
        return 100;
        }
        return prev + 5;
    } else {
        if (prev < 90) return prev + 1;
        return prev;
    }
    });
}, 20);

return () => clearInterval(timer);
}, [pageLoaded, minTimeDone]);

return (
<div className="relative min-h-screen bg-neutral-950 text-white font-sans overflow-hidden">
    
    {/* TELA DE LOADING */}
    <AnimatePresence>
    {isLoading && (
        <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950"
        >
        {/* Contentor do Ícone com o layoutId para o efeito de deslize */}
        <motion.div
            layoutId="barber-brand-icon"
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
        >
            <BarberIcon className="w-24 h-24" progress={progress} />
        </motion.div>

        {/* Percentagem */}
        <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 text-xl font-mono font-bold tracking-widest text-neutral-500"
        >
            {progress}%
        </motion.p>
        </motion.div>
    )}
    </AnimatePresence>


    {/* CONTEÚDO PRINCIPAL */}
    <motion.main
    initial={{ opacity: 0 }}
    animate={{ opacity: isLoading ? 0 : 1 }}
    transition={{ duration: 1, delay: 0.4 }}
    className="pt-32 flex flex-col items-center justify-center text-center px-4"
    >
    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
        O estilo clássico com a precisão moderna.
    </h1>
    <p className="mt-4 text-neutral-400 max-w-md">
        Your premium barbershop experience is ready. Book your appointment now.
    </p>
    </motion.main>
</div>
);
}

// Componente Mágico que trata a imagem PNG como se fosse um vetor dinâmico
function BarberIcon({ className, progress }: { className: string; progress: number }) {
return (
<div className={`${className} relative select-none pointer-events-none`}>
    {/* 1. IMAGEM DE FUNDO: Como o ícone original é preto, usamos a classe 'invert' do Tailwind 
        para o tornar branco, e 'opacity-15' para dar o aspeto de "vazio" */}
    <img
    src="https://cdn-icons-png.flaticon.com/512/1/1930.png"
    alt="Barber Icon Base"
    className="absolute inset-0 w-full h-full object-contain invert opacity-15"
    />

    {/* 2. MÁSCARA DE REVELAÇÃO: Este bloco esconde a imagem de topo e vai revelando-a 
        na vertical através do clip-path progressivo (de baixo para cima) */}
    <div
    className="absolute inset-0 w-full h-full overflow-hidden transition-all duration-100 ease-out"
    style={{ clipPath: `inset(${100 - progress}% 0% 0% 0%)` }}
    >
    {/* 3. IMAGEM DE TOPO: Totalmente branca e sólida que representa a parte carregada */}
    <img
        src="https://cdn-icons-png.flaticon.com/512/1/1930.png"
        alt="Barber Icon Filled"
        className="absolute inset-0 w-full h-full object-contain invert"
    />
    </div>
</div>
);
}