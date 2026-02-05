import React from 'react'
import { Button } from "../components/ui/button";

const Page = () => {
    return (
        <div className="flex justify-center items-center h-screen">
            {/* Use the capital 'B' component you imported */}
            <Button variant="default">
                Click me
            </Button>
        </div>
    )
}
export default Page