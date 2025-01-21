"use server";
import { signIn } from "next-auth/react";

interface CustomAuthError {
  type: string;
  message?: string;
}

function formDataToObject(formData: FormData): Record<string, string> {
  const object: Record<string, string> = {};
  formData.forEach((value, key) => {
    object[key] = value.toString();
  });
  return object;
}


export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const credentials = formDataToObject(formData);
    await signIn("credentials", credentials);
    return undefined; // Indicate success
  } catch (error) {
    if (error && typeof error === "object" && "type" in error) {
      const authError = error as CustomAuthError;
      switch (authError.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
