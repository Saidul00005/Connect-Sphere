export interface Employee {
  id: number;
  user_id: number;
  user__first_name: string | null;
  user__last_name: string | null;
  user__role_name: string;
  designation: string | null;
  department__name: string | null;
}

export interface EmployeeResponse {
  results: Employee[];
  next: string | null;
  previous: string | null;
  count: number;
}

export interface PageData {
  results: Employee[];
  next: string | null;
  previous: string | null;
  count: number;
}

export interface EmployeeState {
  pages: { [key: string]: { [page: string]: PageData } };
  currentPage: { [key: string]: string };
  loading: boolean;
  error: string | null;
}

export interface FetchEmployeeParams {
  pageUrl: string | null;
  department: string;
  search: string;
}

export const getFilterKey = (department: string, search: string): string => {
  return `dept=${department || ""}&search=${search || ""}`;
};