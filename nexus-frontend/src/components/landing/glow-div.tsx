import { cn } from "@/lib/utils";
import React from "react";

export default function GlowDiv({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
}) {
  return (
    <>
      <section
        className={cn(
          `z-40 items-center justify-center drop-shadow-[0_60px_100px_#0565ff] flex`,
          className
        )}
      >
        <div
          className="relative flex items-center border-4 border-primary/50 justify-center overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-cyan-600 h-36 w-36"
          style={{
            boxShadow:
              "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
          }}
        >
          <div className="borer-2 w-fit rounded-3xl px-4 py-4">{children}</div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-900 opacity-30" />

          {/* <div
            className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent opacity-90"
            style={{
              mixBlendMode: "soft-light",
            }}
          /> */}

          <div
            className="bg-gradient-radial absolute inset-0 from-blue-100 to-transparent opacity-50"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)",
            }}
          />

          {/* <div
            className="absolute inset-0 animate-pulse opacity-30"
            style={{
              background:
                'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient 3s ease infinite',
            }}
          /> */}

          {/* <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 to-transparent opacity-30" /> */}
        </div>
      </section>
    </>
  );
}
