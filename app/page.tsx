"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/firebase/config";
import styles from "./page.module.css";
import TeacherDashboard from "./teacher/TeacherDashboard";
import StudentDashboard from "./student/StudentDashboard";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
}

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserData | null>(null);

  // 1. Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // 2. Fetch profile from Firestore
        const docRef = doc(firestore, "users", firebaseUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Omit<UserData, "id">;
          setProfile({ id: firebaseUser.uid, ...data });
        } else {
          // no profile -> redirect to onboarding or sign-out
          console.warn("No profile found, signing out.");
          await signOut(auth);
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/log-in");
  };

  // 3. Render loading state
  if (loading) {
    return (
      <div className={styles.center}>
        <p>Loading…</p>
      </div>
    );
  }

  // 4. Not logged in view
  if (!user || !profile) {
    return (
      <main className={styles.main}>
        <div className={styles.contentContainer}>
          <div className={styles.loginContainer}>
            <Image src="/not-logged-in.png" alt="Not logged in" width={200} height={200} />
            <p className={styles.notLoggedInText}>Login to view your data</p>
          </div>
          <div className={styles.descriptionContainer}>
            <p>This platform allows students to enroll and teachers to manage courses.</p>
          </div>
          <Link href="/log-in" className={styles.btn}>
            Go to Log In
          </Link>
        </div>
      </main>
    );
  }

  // 5. Logged in — role-based dashboards
  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logoContainer}>
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
        </Link>
        <nav className={styles.navigationBar}>
          <button className={styles.btn} onClick={handleLogout}>
            Sign out
          </button>
          <div className={styles.nameContainer}>
            <Image src="/profile-img-3.jpg" alt="Avatar" width={40} height={40} />
            <p>{profile.name}</p>
          </div>
        </nav>
      </header>

      <main className={styles.main}>{profile.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}</main>
    </>
  );
}
