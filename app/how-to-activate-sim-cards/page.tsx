diff --git a/app/recharge/success/page.jsx b/app/recharge/success/page.jsx
index 0a4adb8..386e805 100644
--- a/app/recharge/success/page.jsx
+++ b/app/recharge/success/page.jsx
@@ -1,11 +1,33 @@
 "use client";
 
-import { useEffect, useState } from "react";
+import { Suspense, useEffect, useState } from "react";
 import { useSearchParams } from "next/navigation";
 import { getOrderStatus } from "../api";
 import styles from "../recharge.module.css";
 
 export default function RechargeSuccessPage() {
+  return (
+    <Suspense
+      fallback={
+        <div className={styles.page}>
+          <div className={styles.container}>
+            <div className={styles.simCard}>
+              <div className={styles.centered}>
+                <div className={styles.spinnerLarge} />
+                <h3>Processing Payment...</h3>
+                <p>Please wait while we process your recharge.</p>
+              </div>
+            </div>
+          </div>
+        </div>
+      }
+    >
+      <RechargeSuccessContent />
+    </Suspense>
+  );
+}
+
+function RechargeSuccessContent() {
   const searchParams = useSearchParams();
   const orderRef = searchParams.get("ref");
