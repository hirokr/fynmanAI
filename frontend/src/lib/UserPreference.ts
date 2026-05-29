'use server'

import { UserPreference } from "@/types/user";
import { cookies } from "next/headers";

export const getUserPreference = async (): Promise<UserPreference | null> => {
  const cookie = (await cookies()).get("user_preference")?.value;
  if (!cookie) return null;

  try {
    const preference = JSON.parse(cookie) as UserPreference;
    return preference;
  } catch (err) {
    console.error("Failed to parse user preference", err);
    return null;
  }
}

export const saveUserPreference = async (preference: UserPreference) => {
  const data = JSON.stringify(preference);
  (await cookies()).set("user_preference", data, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",  
  })
} 


export const updateUserPreference = async (preference: UserPreference) => {
  const cookie = (await cookies()).get("user_preference")?.value;
  if (!cookie) {
    saveUserPreference(preference);
    return;
  }

  try {
    const existingPreference  = JSON.parse(cookie) as UserPreference;
    const updatedPreference = { ...existingPreference, ...preference };
    saveUserPreference(updatedPreference);
  } catch (err) {
    console.error("Failed to update user preference", err);
    saveUserPreference(preference); // Fallback to saving new preference
  }
} 