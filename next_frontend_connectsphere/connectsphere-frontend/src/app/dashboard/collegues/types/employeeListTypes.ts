export interface Employee {
  id: number;
  user__id: number;
  user__first_name: string | null;
  user__last_name: string | null;
  user__role_name: string;
  user__is_active: boolean;
  user__profile_picture: string | null;
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
  component: string;
}

export const getFilterKey = (component: string, department: string, search: string) => {
  return `${component}_${department}_${search}`;
};