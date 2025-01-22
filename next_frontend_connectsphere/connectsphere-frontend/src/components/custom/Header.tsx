import { ThemeModeToggle } from "@/components/custom/ThemeSwitcher"
import Image from "next/image"
import Link from "next/link"

const Header = () => {
  return (
    <header className="p-4 flex justify-between items-center">
      <Link
        href="/"
        className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
        aria-label="Go to homepage"
      >
        <Image
          src="/logo.svg"
          alt="Connect Sphere Logo"
          width={40}
          height={40}
        />
        <span className="text-2xl font-bold">Connect Sphere</span>
      </Link>
      <ThemeModeToggle />
    </header>
  )
}

export default Header