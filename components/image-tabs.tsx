"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type ActiveTabs = "organize" | "hired" | "boards";

export default function ImageTabs() {
    const [activeTab, setActiveTab] = useState<ActiveTabs>("organize");

    return (
        <section className="border-t bg-white py-16">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Tabs */}
                    <div className="flex gap-2 justify-center mb-8">
                        <Button
                            className={`rounded-lg px-6 py-3 text-sm font-medium transition-colors ${activeTab === "organize" ? "bg-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                            onClick={() => setActiveTab("organize")}
                        >Organize Applications</Button>

                        <Button
                            className={`rounded-lg px-6 py-3 text-sm font-medium transition-colors ${activeTab === "hired" ? "bg-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                            onClick={() => setActiveTab("hired")}
                        >Get Hired</Button>

                        <Button
                            className={`rounded-lg px-6 py-3 text-sm font-medium transition-colors ${activeTab === "boards" ? "bg-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                            onClick={() => setActiveTab("boards")}
                        >Manage Boards</Button>
                    </div>

                    {/* Tabs Image */}
                    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-gray-200 shadow-xl">
                        {activeTab === "organize" && <Image
                            src="/hero-images/hero1.png"
                            alt="Organize Applications"
                            width={1200}
                            height={800}
                        />}

                        {activeTab === "hired" && <Image
                            src="/hero-images/hero2.png"
                            alt="Get Hired"
                            width={1200}
                            height={800}
                        />}

                        {activeTab === "boards" && <Image
                            src="/hero-images/hero3.png"
                            alt="Manage Boards"
                            width={1200}
                            height={800}
                        />}
                    </div>
                </div>
            </div>
        </section>
    )
}
