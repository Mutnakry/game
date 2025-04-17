"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Tab } from "@headlessui/react"
import ShowUserLogin from "@/components/ShowUserLogin"
import RandDomMultiplire from "@/components/rand-dom-multiplire"
import AdminDashBoard from "@/components/admin-dashboard"
import { GameHistory } from "@/components/game-history"
import { AddNewPresets } from "@/components/and-new-resets"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FaHome, FaUserCog } from "react-icons/fa"

const Page: React.FC = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  const menu = [
    {
      name: "Dashboard",
      icon: FaHome,
    },
    { name: "User", icon: FaUserCog },
    { name: "Rang Multiplier", icon: FaUserCog },
    { name: "Presets", icon: FaUserCog },
  ]
  const router = useRouter()

  // useEffect(() => {
  //   const token = localStorage.getItem("token")
  //   const locked = localStorage.getItem("adminLocked")

  //   if (locked === "true") {
  //     router.replace("/admin")
  //   }
  // }, [])



  const handleLogout = () => {
    localStorage.removeItem("token") // Remove token from localStorage
    router.replace("/admin")
  }

  return (
    <div className="min-h-screen max-w-screen-lg mx-auto flex flex-col text-white bg-white border-b border-gray-200">
      <div className="flex justify-between w-full my-4 px-8">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl text-gray-800"
        >
          Admin
        </motion.p>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="text-gray-700 bg-gray-200 rounded shadow text-sm px-4 py-2 hover:bg-gray-300 transition-colors"
        >
          Logout
        </motion.button>
      </div>

      <div className="w-full px-6 py-2">
        <Tab.Group selectedIndex={activeTabIndex} onChange={setActiveTabIndex}>
          <Tab.List className="md:flex gap-1 relative">
            {menu.map(({ name, icon: Icon }, index) => (
              <Tab key={name} className={`py-3 px-4 text-sm font-bold relative z-10 focus:outline-none text-gray-700`}>
                {({ selected }) => (
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{name}</span>
                    {selected && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                        layoutId="underline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Animated background */}
                    {selected && (
                      <motion.div
                        className="absolute inset-0 border-2  border-blue-500 rounded-t-md "
                        layoutId="activeTab"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                )}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Tab.Panel className="p-4 border border-dashed">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <AdminDashBoard />
                  <GameHistory />
                </motion.div>
              </Tab.Panel>
              <Tab.Panel className="p-4 border border-dashed">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <ShowUserLogin />
                </motion.div>
              </Tab.Panel>
              <Tab.Panel className="p-4 border border-dashed border-gray-300">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <RandDomMultiplire />
                  {/* <RangList/> */}
                </motion.div>
              </Tab.Panel>
              <Tab.Panel className="p-4 border border-dashed border-gray-300">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <AddNewPresets />
                  {/* <RangList/> */}
                </motion.div>
              </Tab.Panel>
            </motion.div>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

export default Page
