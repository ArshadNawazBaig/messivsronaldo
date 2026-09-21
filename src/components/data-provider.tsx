"use client";
import { createContext, useContext, type ReactNode } from "react";
import { type PublishedData } from "@/lib/published-data";
const Context = createContext<PublishedData | null>(null);
export function DataProvider({value,children}:{value:PublishedData;children:ReactNode}) { return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useFootballData() { const value = useContext(Context); if (!value) throw new Error("Football data provider is missing"); return value; }
