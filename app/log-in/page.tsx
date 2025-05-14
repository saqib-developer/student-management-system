"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "./log-in.module.css";

import { signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { auth, firestore } from "@/firebase/config"; // adjust path if needed
import { doc, getDoc } from "firebase/firestore";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Sign in
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2) Fetch role from Firestore
      const userDoc = await getDoc(doc(firestore, "users", uid));
      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }
      const data = userDoc.data() as { role?: string };
      const role = data.role;

      // 3) Route based on role
      if (role === "teacher") {
        router.push("/");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      // Handle auth errors
      if (err.code === AuthErrorCodes.INVALID_PASSWORD) {
        setError("Wrong password. Try again.");
      } else if (err.code === AuthErrorCodes.USER_DELETED) {
        setError("No user found with this email.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.imagePanel}>
        <Image src="/login-illustration.jpg" alt="Background" fill className={styles.bgImage} />
      </div>

      <div className={styles.formPanel}>
        <Link href="/" className={styles.logoLink}>
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
        </Link>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Image className={styles.avatar} src="/profile-img-3.jpg" alt="User avatar" width={80} height={80} />

          <div className={styles.inputGroup}>
            <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${styles.input} ${error ? styles.errorInput : ""}`}
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </button>

          <p className={styles.signUpText}>
            Don’t have an account? <Link href="/sign-up">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
