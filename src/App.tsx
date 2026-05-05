/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Outlet />
      <Toaster />
    </div>
  );
}
