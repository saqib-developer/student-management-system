"use client";

import React, { useState } from "react";
import styles from "./studentDashboard.module.css";

import CourseCatalog from "./components/CourseCatalog";
import MyCourses from "./components/MyCourses";

export default function StudentDashboard() {
  const [tab, setTab] = useState<"catalog" | "myCourses">("catalog");

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <button className={`${styles.tabButton} ${tab === "catalog" ? styles.active : ""}`} onClick={() => setTab("catalog")}>
          Course Catalog
        </button>
        <button className={`${styles.tabButton} ${tab === "myCourses" ? styles.active : ""}`} onClick={() => setTab("myCourses")}>
          My Courses
        </button>
      </aside>
      <main className={styles.content}>{tab === "catalog" ? <CourseCatalog /> : <MyCourses />}</main>
    </div>
  );
}
