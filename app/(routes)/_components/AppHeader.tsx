"use client";
import React from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import logo from "@/app/_assets/intervie-logo.png";
import Link from "next/link";

const MenuOptions = [
    {
        name: "Dashboard",
        path: "/dashboard"
    },
    {
        name: "Upgrade",
        path: "/upgrade"
    },
    {
        name: "How it Works?",
        path: "/"
    }
]

function AppHeader() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center justify-center">
                        <Image
                            src={logo}
                            alt="AI-powered interview platform logo"
                            className="w-16 h-16 -mr-2"
                        />
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Intervie
                        </span>
                    </div>
                    <div>
                        <ul className="max-md:hidden flex gap-5 items-center">
                            {
                                MenuOptions.map((opt, idx) => {
                                    return (
                                        <Link href={opt.path} key={idx} className="text-md hover:scale-105 hover:text-blue-600 transition-all cursor-pointer ">
                                            {opt.name}
                                        </Link>
                                    )
                                })
                            }
                        </ul>
                    </div>
                    <div className="flex items-center">
                        <UserButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default AppHeader