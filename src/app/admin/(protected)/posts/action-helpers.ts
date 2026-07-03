const SAFE_FORM_ERROR_MESSAGES = new Set(["Title is required."]);

export function isDeleteConfirmed(formData: FormData): boolean {
  return formData.get("confirmDelete") === "delete";
}

export function isDuplicateSlugError(error: unknown): boolean {
  if (!isRecord(error) || error.code !== "P2002") {
    return false;
  }

  const target = isRecord(error.meta) ? error.meta.target : undefined;

  if (Array.isArray(target)) {
    return target.includes("slug");
  }

  return target === "slug";
}

export function getAdminFormErrorMessage(error: unknown): string | null {
  if (isDuplicateSlugError(error)) {
    return "Slug already exists.";
  }

  if (error instanceof Error && SAFE_FORM_ERROR_MESSAGES.has(error.message)) {
    return error.message;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
