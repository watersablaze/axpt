"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const WelcomeScreen = () => {
  const router = useRouter();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      router.push("/dashboard"); // Redirect to dashboard after 4 seconds
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-white"
    >
      <motion.div
        className="text-center p-6 bg-white text-black rounded-2xl shadow-xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-3xl font-bold">🎉 Welcome to the Platform!</h1>
        <p className="text-lg mt-2">We're excited to have you here.</p>
        <motion.div
          className="mt-4 text-lg font-semibold text-indigo-600"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Redirecting to your dashboard...
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;