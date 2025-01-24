"use client"
import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const paths = pathname.split("/").filter((path) => path)

  const formatPath = (str: string) => {
    return str
      .replace(/-/g, " ")
      .replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild><Link href='/dashboard'>Dashboard</Link></BreadcrumbLink>
        </BreadcrumbItem>
        {paths.slice(1).map((path, index) => {
          const href = `/dashboard/${paths.slice(1, index + 2).join("/")}`
          const isLast = index === paths.length - 2

          return (
            <React.Fragment key={path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatPath(path)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild><Link href={href}>{formatPath(path)}</Link></BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}