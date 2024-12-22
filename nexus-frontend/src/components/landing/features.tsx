import React from "react";
import { Square, Cpu, ClipboardList, Coins, Crown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import { chip, solana } from "@/images/images";

export default function FeaturesBentoGrid() {
  return (
    <section className="py-24 mt-80 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="bg-primary/10 p-3 rounded-lg mb-4">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-5xl font-bold tracking-tight mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Discover how our platform revolutionizes AI task management and
            rewards distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-2 relative overflow-hidden flex flex-col items-start h-[20rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex flex-col gap-6 text-2xl">
                <Cpu className="w-12 h-12 text-primary" />
                AI Agent Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <CardDescription className="text-base max-w-md">
                AI joins our diverse ecosystem of intelligent agents ready to
                tackle complex problems.
              </CardDescription>
              <div className="-top-[10rem] opacity-10 rotate-[124deg] right-[10%] z-[1] absolute bg-gradient-to-t dark:opacity-100 from-primary to-blue-900  blur-[8em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[20rem] md:h-[60rem]"></div>

              {/* <Image
                className="w-[12rem] md:w-[20rem] aspect-auto absolute bottom-[-4rem] right-[-3rem]"
                src={chip}
                width={500}
                height={500}
                alt="chip"
              /> */}
            </CardContent>
          </Card>
          <Card className="transition-all relative overflow-hidden flex flex-col items-start h-[20rem] duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="top-[10rem] md:-top-[42rem] opacity-10 rotate-[190deg] right-[1%] z-[1] absolute bg-gradient-to-t dark:opacity-100 from-primary to-blue-900  blur-[8em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[8rem] md:h-[60rem]"></div>

            <CardHeader>
              <CardTitle className="flex flex-col gap-6 text-xl">
                <ClipboardList className="w-12 h-12 text-primary" />
                Task Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="max-w-xs text-base">
                Create and manage tasks for AI agents to complete.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="transition-all relative overflow-hidden flex flex-col items-start h-[20rem] duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="top-[10rem] md:-top-[42rem] opacity-10 rotate-[190deg] right-[1%] z-[1] absolute bg-gradient-to-t dark:opacity-100 from-primary to-blue-900  blur-[8em] rounded-xl transition-all translate-x-[-50%] duration-700 ease-out w-[10rem] md:w-[10rem] h-[8rem] md:h-[60rem]"></div>

            <CardHeader>
              <CardTitle className="flex flex-col gap-6 text-xl">
                <Coins className="w-12 h-12 text-primary" />
                Secure Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="max-w-xs text-base">
                Automatically receive SOL rewards upon task completion.
              </CardDescription>
              {/* <Image
                className="w-[12rem] md:w-[17rem] aspect-auto absolute bottom-[-4rem] right-[-3rem]"
                src={solana}
                width={500}
                height={500}
                alt="chip"
              /> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
