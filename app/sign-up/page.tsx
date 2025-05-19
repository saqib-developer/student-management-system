"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "./sign-up.module.css";

import { createUserWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { auth, firestore } from "@/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // If they chose "teacher", load the single doc users/teacher
      if (role === "teacher") {
        const teacherDocRef = doc(firestore, "users", "teacher");
        const teacherSnap = await getDoc(teacherDocRef);

        if (!teacherSnap.exists()) {
          setError("🚫 Teacher list not found. Contact admin.");
          setLoading(false);
          return;
        }

        // data is an object like { '0': 'raees@gmail.com', '1': 'some@gmail.com', ... }
        const teacherData = teacherSnap.data();
        const teacherEmails = Object.values(teacherData) as string[];

        if (!teacherEmails.includes(email)) {
          setError("🚫 You are not authorized as a teacher.");
          setLoading(false);
          return;
        }
      }

      // 1) Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2) Save profile to Firestore
      await setDoc(doc(firestore, "users", uid), {
        name,
        email,
        role,
        createdAt: Date.now(),
      });

      // 3) Redirect (you can customize per-role)
      router.push("/");
    } catch (err: any) {
      if (err.code === AuthErrorCodes.WEAK_PASSWORD) {
        setError("Password should be at least 6 characters.");
      } else if (err.code === AuthErrorCodes.EMAIL_EXISTS) {
        setError("This email is already in use.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.imagePanel}>
        <Image src="/login-illustration.jpg" alt="Background" fill className={styles.bgImage} />
      </div>

      <div className={styles.formPanel}>
        <Link href="/" className={styles.logoLink}>
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
        </Link>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Image className={styles.avatar} src="/profile-img-3.jpg" alt="User avatar" width={80} height={80} />

          <label className={styles.label} htmlFor="name">
            Name*
          </label>
          <input id="name" className={styles.input} type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />

          <label className={styles.label} htmlFor="email">
            Email*
          </label>
          <input id="email" className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label className={styles.label} htmlFor="password">
            Password*
          </label>
          <input
            id="password"
            className={`${styles.input} ${error.toLowerCase().includes("password") ? styles.errorInput : ""}`}
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className={styles.label} htmlFor="role">
            I am a*
          </label>
          <select id="role" className={styles.input} value={role} onChange={(e) => setRole(e.target.value as "student" | "teacher")}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Signing up…" : "Sign Up"}
          </button>

          <p className={styles.switchText}>
            Already have an account? <Link href="/log-in">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
