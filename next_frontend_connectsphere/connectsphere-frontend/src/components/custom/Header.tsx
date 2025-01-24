import { ThemeModeToggle } from "@/components/custom/ThemeSwitcher"
import { Globe } from "lucide-react"
import Link from "next/link"

const Header = () => {
  return (
    <header className="p-4 flex justify-between items-center">
      <Link
        href="/"
        className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
        aria-label="Go to homepage"
      >
        <Globe />
        <span className="text-xl md:text-2xl font-bold">Connect Sphere</span>
      </Link>
      <ThemeModeToggle />
    </header>
  )
}

export default Header