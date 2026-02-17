import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navitems from "@/components/Navitems";
import UserDropdowns from "@/components/UserDropdowns";


const Header = () => {
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                {/* 2. Capitalized Link */}
                <Link href="/">
                    <Image
                        src="/public/assets/icons/logo.svg" // Added the extra /public/
                        alt="logo"
                        width={140}
                        height={32}
                        className="h-8 w-auto cursor-pointer"
                    />
                </Link>
                <nav className="sm:block hidden">
                    <Navitems/>
                </nav>
                <UserDropdowns/>
            </div>
        </header>
    )
}
export default Header