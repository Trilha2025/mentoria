"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function InterceptedModal({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const overlay = useRef<HTMLDivElement>(null);

    const onDismiss = () => {
        router.back();
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onDismiss();
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "unset";
        };
    }, []);

    return (
        <div
            ref={overlay}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 md:p-10 lg:p-20 animate-in fade-in duration-300 overflow-y-auto cursor-pointer"
            onClick={(e) => {
                if (e.target === overlay.current) onDismiss();
            }}
        >
            <div className="relative w-full max-w-3xl cursor-default" onClick={(e) => e.stopPropagation()}>
                {/* Close Button UI (Optional since click outside works, but good to have) */}
                <button 
                    onClick={onDismiss}
                    className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-all md:block hidden"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="dark:bg-[#1e292d] bg-white rounded-3xl overflow-hidden shadow-2xl dark:border-white/5 border-black/5 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
