'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Library", href: "/" },
    { label: "Add New", href: "/books/new" },
    { label: "Pricing", href: "/subscriptions" },
];

const Navbar = () => {
    const pathName = usePathname();
    const { user } = useUser();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 20) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 70) {
                // Scrolling down -> hide
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up -> show
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <header
            className={cn(
                "w-full fixed top-0 left-0 right-0 z-50 bg-(--bg-primary) transition-transform duration-300 ease-in-out",
                isVisible ? "translate-y-0" : "-translate-y-full"
            )}
        >
            <div className="wrapper navbar-height py-4 flex justify-between items-center">
                <Link href="https://bookified-now.vercel.app" className="flex gap-0.5 items-center">
                    <Image src="/assets/logo.png" alt="Bookified" width={42} height={26} />
                    <span className="logo-text">Bookified</span>
                </Link>

                <nav className="w-fit flex gap-7.5 items-center">
                    {navItems.map(({ label, href }) => {
                        const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));

                        return (
                            <Link href={href} key={label} className={cn('nav-link-base', isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}>
                                {label}
                            </Link>
                        );
                    })}

                    <div className="flex gap-7.5 items-center">
                        <SignedOut>
                            <SignInButton mode="modal" />
                        </SignedOut>
                        <SignedIn>
                            <div className="nav-user-link">
                                <UserButton />
                                {(user?.firstName || user?.lastName) && (
                                    <Link href="/subscriptions" className="nav-user-name">
                                        {user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ")}
                                    </Link>
                                )}
                            </div>
                        </SignedIn>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
