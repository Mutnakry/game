"use client"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token"); // Get useEffect token 
    setToken(storedToken);
    setTimeout(() => { 
      if (!storedToken) {
        router.push("/login"); // Redirect to login
      } else {
        router.push("/view/dashboard"); // Redirect to dashboard
      }
      setLoading(false);
    }, 1000); 
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl animate-pulse">Loading...</p>
      </div>
    );
  }

  return null;
}
