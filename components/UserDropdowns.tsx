'use client';
import React from 'react'
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {router} from "next/client";
import {LogOut} from "lucide-react";
import NavItems from "@/components/Navitems";
const handleSignOut: () => void = async () => {
    router.push("/sign-in");
}

const UserDropdowns = () => {
    const router = useRouter();
    const user ={name:'John',email:'contact@jsmastery.com'}
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-blue-800 hover:accent-violet-500">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="data:image/png;base64,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" />
                        <AvatarFallback className="bg-gray-100 text-black text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>


                    <div className='hidden md:flex flex-col items-start'>
                        <span className="text-base font-medium text-gray-400">
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>

                <DropdownMenuContent className="text-gray-400">
                    <DropdownMenuLabel>
                        <div className="flex relative items-center gap-3 py-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="data:image/png;base64,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" />
                                <AvatarFallback className="bg-gray-100 text-black text-sm font-bold">
                                    {user.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col'>
                        <span className="text-base font-medium text-gray-400">
                            {user.name}
                        </span>
                                <span className="text-smtext-gray-500">{user.email}</span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-600" />

                    <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md fonts-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2 hidden sm-block"/>
                        LogOut
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="hidden sm:block bg-gray-600" />

                    <nav className="sm:hidden">
                        <NavItems />
                    </nav>

                </DropdownMenuContent>


        </DropdownMenu>
    )
}
export default UserDropdowns
