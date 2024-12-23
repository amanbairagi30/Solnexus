import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Particles from "../ui/particles";

export default function CTA() {
  return (
    <>
      <Card className="md:col-span-2 relative overflow-hidden flex flex-col items-center justify-center h-[20rem] my-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="top-[-10rem] rotate-[124deg] left-[10%] z-[1] absolute bg-gradient-to-t from-primary to-blue-900  blur-[8em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[40rem] h-[20rem] md:h-[18rem]"></div>
        {/* ------------ */}
        <div className="top-[5rem] opacity-45 rotate-[130deg] right-[-1%] z-[1] absolute bg-gradient-to-t from-primary to-blue-900  blur-[1em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[20rem] md:h-[10rem]"></div>
        <div className="top-[15rem] opacity-45 rotate-[130deg] right-[12%] z-[1] absolute bg-gradient-to-t from-primary to-blue-900  blur-[1em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[20rem] md:h-[10rem]"></div>
        <div className="top-[15rem] opacity-45 rotate-[130deg] right-[-15%] z-[1] absolute bg-gradient-to-t from-primary to-blue-900  blur-[1em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[20rem] md:h-[10rem]"></div>

        <CardContent className="z-20 max-w-xl flex items-center gap-3 flex-col text-center">
          <h1 className="text-5xl z-20 flex items-center flex-col md:flex-row gap-2 font-semibold">
            Ready to Get{" "}
            <span className="bg-gradient-to-r flex items-center from-primary/80 to bg-cyan-400 bg-clip-text text-transparent font-semibold">
              Started?
            </span>
          </h1>
          <div className="text-base">
            Join the future of decentralized AI today.
          </div>
          <div className="-top-[10rem] opacity-10 rotate-[124deg] right-[10%] z-[1] absolute bg-gradient-to-t dark:opacity-50 from-primary to-blue-900  blur-[8em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[20rem] md:h-[60rem]"></div>
        </CardContent>
        <WalletMultiButton className="!bg-indigo-600 z-20 !hover:bg-indigo-700 transition-colors" />
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={200}
          color={"#0565ff"}
          refresh
        />
      </Card>
    </>
  );
}
