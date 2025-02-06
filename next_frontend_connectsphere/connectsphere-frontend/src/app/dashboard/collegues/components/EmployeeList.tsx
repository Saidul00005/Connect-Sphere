"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/app/redux/store";
import {
  fetchEmployees,
  resetEmployees,
  setCurrentPage
} from "@/app/redux/slices/employeeListForUserSlice";
import { getFilterKey } from "@/app/dashboard/collegues/types/employeeListTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { Employee } from "@/app/dashboard/collegues/types/employeeListTypes";
import EmployeeProfileForUser from "./EmployeeProfileForUser"
import { fetchDepartments } from "@/app/redux/slices/DepartmentListSliceForUser";


export default function EmployeeList() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/");
    },
  });

  const dispatch = useAppDispatch();
  const {
    pages,
    currentPage,
    loading: employeeListLoading,
    error: employeeListError,
  } = useAppSelector((state) => state.employees);

  const {
    list,
    loading: departmentListLoading,
    error: departmentListError,
  } = useAppSelector((state) => state.departments);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState<number | null>(null);

  const filterKey = getFilterKey(department, searchTerm);
  const currentPageNumber = parseInt(currentPage[filterKey] || "1");
  const pageData = pages[filterKey]?.[currentPage[filterKey] || "1"];
  const employees: Employee[] = pageData ? pageData.results : [];
  const nextPageUrl = pageData?.next;
  const previousPageUrl = pageData?.previous;
  const pageSize = 10;
  const totalPages = pageData ? Math.ceil(pageData.count / pageSize) : 1;

  useEffect(() => {
    if (status === "authenticated" && employees.length === 0) {
      dispatch(resetEmployees());
      dispatch(fetchEmployees({ pageUrl: null, department, search: searchTerm }));
    }
  }, [status, department, searchTerm, dispatch]);

  useEffect(() => {
    if (status === "authenticated" && list.length === 0 && !departmentListLoading && !departmentListError) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, status, departmentListLoading, departmentListError]);

  const handlePreviousPage = useCallback(() => {
    if (previousPageUrl && !employeeListLoading && !departmentListLoading) {
      const prevPageNumber =
        new URL(previousPageUrl, window.location.origin).searchParams.get(
          "page"
        ) || "1";

      if (!pages[filterKey]?.[prevPageNumber]) {
        dispatch(
          fetchEmployees({
            pageUrl: previousPageUrl,
            department,
            search: searchTerm,
          })
        );
      } else {
        dispatch(setCurrentPage({ [filterKey]: prevPageNumber }));
      }
    }
  }, [
    previousPageUrl,
    employeeListLoading,
    dispatch,
    pages,
    department,
    searchTerm,
    filterKey,
  ]);


  const handleNextPage = useCallback(() => {
    if (nextPageUrl && !employeeListLoading && !departmentListLoading) {
      const nextPageNumber =
        new URL(nextPageUrl, window.location.origin).searchParams.get("page") ||
        "1";
      if (!pages[filterKey]?.[nextPageNumber]) {
        dispatch(
          fetchEmployees({
            pageUrl: nextPageUrl,
            department,
            search: searchTerm,
          })
        );
      } else {
        dispatch(setCurrentPage({ [filterKey]: nextPageNumber }));
      }
    }
  }, [
    nextPageUrl,
    employeeListLoading,
    dispatch,
    pages,
    department,
    searchTerm,
    filterKey,
  ]);

  const handleSearch = () => {
    if (searchInputRef.current) {
      setSearchTerm(searchInputRef.current.value);
    }
  };

  const handleSort = (value: string) => {
    setDepartment(value);
    dispatch(resetEmployees());
    dispatch(fetchEmployees({ pageUrl: null, department: value, search: searchTerm }));
  };

  const handleClearFilters = () => {
    setDepartment("");
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    dispatch(resetEmployees());
    dispatch(fetchEmployees({ pageUrl: null, department: "", search: "" }));
  };

  const isLoading = (status === "loading" || employeeListLoading) && !employeeListError && !departmentListError

  if (employeeListError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="flex items-center space-x-4 p-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Error Loading Employees</h3>
              <p className="text-destructive">{employeeListError}</p>
              <Button
                className="mt-4"
                onClick={() => dispatch(fetchEmployees({
                  pageUrl: null,
                  department,
                  search: searchTerm
                }))}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search employees by name"
            className="w-full bg-background"
          />
          <Button
            onClick={handleSearch}
            className="absolute right-0 top-0 bottom-0 rounded-l-none"
          >
            Search
          </Button>
        </div>
        <Select onValueChange={handleSort} value={department}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Sort by department" />
          </SelectTrigger>
          <SelectContent>
            {departmentListLoading ? (
              <SelectItem value="Loading" disabled>Loading...</SelectItem>
            ) : (
              list.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>

      <div className="space-y-2">
        {employees.map((employee) => (
          <Card key={employee.id} className="bg-card hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {employee.user__first_name} {employee.user__last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Company role: {employee.user__role_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Department designation: {employee.designation}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Department: {employee.department__name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => setSelectedEmployeeUserId(employee.id)}
                  >
                    View Profile
                  </Button>
                  <Button
                    className="flex-1 sm:flex-none"
                    onClick={() => console.log("Chat with:", employee.id)}
                  >
                    Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <>
            {[...Array(3)].map((_, index) => (
              <Card key={`skeleton-${index}`} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-muted rounded"></div>
                    <div className="h-4 w-32 bg-muted rounded"></div>
                    <div className="h-4 w-24 bg-muted rounded"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-9 flex-1 bg-muted rounded"></div>
                    <div className="h-9 flex-1 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button onClick={handlePreviousPage} disabled={!previousPageUrl}>
          Previous
        </Button>
        <span>
          Page {currentPageNumber} of {totalPages}
        </span>
        <Button onClick={handleNextPage} disabled={!nextPageUrl}>
          Next
        </Button>
      </div>

      {selectedEmployeeUserId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] sm:inset-x-auto sm:left-[50%] sm:translate-x-[-50%] sm:max-w-2xl h-[90vh] bg-background rounded-lg shadow-lg overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <EmployeeProfileForUser userId={selectedEmployeeUserId} />
              <div className="sticky bottom-0 pt-4 bg-background">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedEmployeeUserId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
