"use client";
import React, { useState } from "react";

const stepData = {
  profile: [
    {
      id: 1,
      title: "Contact Information",
      description: "Update your personal details — name, email and phone.",
      buttonText: "Edit Info",
    },
    {
      id: 2,
      title: "Address",
      description: "Change your service or billing address.",
      buttonText: "Change Address",
    },
    {
      id: 3,
      title: "Communication Preferences",
      description: "Manage how we contact you about your account.",
      buttonText: "Manage Preferences",
    },
  ],

  security: [
    /* 2FA - Two-factor authentication (Temporarily commented out)
    {
      id: 1,
      title: "Two-Factor Authentication",
      description: "Enable 2FA for an extra layer of account protection.",
      buttonText: "Enable 2FA",
    },
    */
    {
      id: 2,
      title: "Change Password",
      description: "Update your account password regularly.",
      buttonText: "Change Password",
    },
    {
      id: 3,
      title: "Login History",
      description: "Review recent sign-in activity on your account.",
      buttonText: "View History",
    },
    {
      id: 4,
      title: "Report Suspicious Activity",
      description: "Flag anything that doesn't look right.",
      buttonText: "Report Activity",
    },
  ],

  support: [
    {
      id: 1,
      title: "Support Ticket",
      description: "Raise a new ticket with our support team.",
      buttonText: "Create Ticket",
    },
    {
      id: 2,
      title: "Live Chat",
      description: "Chat with a support agent in real time.",
      buttonText: "Start Chat",
    },
    {
      id: 3,
      title: "Call-back Request",
      description: "Ask our team to call you back at a convenient time.",
      buttonText: "Request Call",
    },
    {
      id: 4,
      title: "Ticket History",
      description: "View all your past support tickets and their status.",
      buttonText: "View History",
    },
  ],
};

type TabId = "profile" | "security" | "support";

export default function DashboardOptions() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "profile", label: "Edit Profile" },
    { id: "security", label: "Security" },
    { id: "support", label: "Support" },
  ];

  return (
    <section
      aria-labelledby="dashboard-options-heading"
      className="bg-[#f8fafc] dark:bg-gray-900 flex flex-col py-8 px-4 sm:px-6 lg:px-8 lg:py-12 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300"
    >

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-1 md:p-2 flex gap-1 md:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 md:px-4 py-2 md:py-5 text-sm md:text-base rounded-md font-semibold md:font-bold transition
            ${
              activeTab === tab.id
                ? "bg-[#fefbf4] dark:bg-gray-700 border-b-2 border-[#ffd300] text-[#10446C] dark:text-yellow-400"
                : "text-gray-600 dark:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stepData[activeTab].map((item) => (
          <li key={item.id}>
            <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">

              <h3 className="text-base md:text-lg font-semibold text-[#10446C] dark:text-white">
                {item.title}
              </h3>

              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">
                {item.description}
              </p>

              <button className="mt-4 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-[#10446C] dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                {item.buttonText}
              </button>

            </div>
          </li>
        ))}
      </ul>

    </section>
  );
}
