"use client"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token"); // Get useEffect token 
    setToken(storedToken);
    if (!storedToken) {
      router.push("/login"); // Redirect to login 
    } else {
      router.push("/view/dashboard"); // Redirect to dashboard 
    }
  }, [router]);

  return null;
}
