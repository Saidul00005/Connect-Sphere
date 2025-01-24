import Link from "next/link"

export default function Footer() {
  return (
    <footer className="text-sm md:text-md bg-secondary/10 text-secondary-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <p>&copy; 2024 Connect Sphere™. All Rights Reserved.</p>
        </div>
        <nav className="flex space-x-4">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/license" className="hover:underline">
            License
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}