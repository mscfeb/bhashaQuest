const USER_STORAGE_KEY = "user";

export function getStoredUserProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
    if (!data || typeof data !== "object") return null;

    const profile = data.user ?? data;
    return profile && typeof profile === "object" ? profile : null;
  } catch {
    return null;
  }
}

export function getDatabaseUserId(profile = getStoredUserProfile()) {
  const id = profile?.id;
  return typeof id === "string" && id.trim() ? id : null;
}
