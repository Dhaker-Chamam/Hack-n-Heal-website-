"use client";

import { useEffect } from "react";

/** Drops the registration draft (it holds an email and a phone number) once the form went through. */
export function ClearDraft() {
  useEffect(() => {
    localStorage.removeItem("hnh-inscription-v1");
  }, []);
  return null;
}
