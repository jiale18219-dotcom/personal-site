import { describe, expect, it } from "vitest";

import {
  getAdminFormErrorMessage,
  isDeleteConfirmed,
  isDuplicateSlugError,
} from "../action-helpers";

describe("admin post action helpers", () => {
  it("requires the exact delete confirmation text", () => {
    const formData = new FormData();
    formData.set("confirmDelete", "delete");

    expect(isDeleteConfirmed(formData)).toBe(true);

    formData.set("confirmDelete", "Delete");
    expect(isDeleteConfirmed(formData)).toBe(false);
  });

  it("maps post validation errors to safe form messages", () => {
    expect(getAdminFormErrorMessage(new Error("Title is required."))).toBe(
      "Title is required.",
    );
  });

  it("recognizes duplicate slug Prisma errors", () => {
    const error = { code: "P2002", meta: { target: ["slug"] } };

    expect(isDuplicateSlugError(error)).toBe(true);
    expect(getAdminFormErrorMessage(error)).toBe("Slug already exists.");
  });
});
