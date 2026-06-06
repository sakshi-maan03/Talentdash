/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Badge({ children, className = "", id }: BadgeProps) {
  return (
    <span
      id={id}
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold tracking-wide uppercase transition-all duration-150 ${className}`}
    >
      {children}
    </span>
  );
}
