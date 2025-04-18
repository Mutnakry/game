"use client"
import { useState } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc } from "firebase/firestore"
import { Trash2 } from "lucide-react"

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default function Page() {
  const [name, setName] = useState("")
  const [colors, setColors] = useState([""])
  const [images, setImages] = useState([""])

  const handleColorChange = (index: number, value: string) => {
    const updated = [...colors]
    updated[index] = value
    setColors(updated)
  }

  const handleImageChange = (index: number, value: string) => {
    const updated = [...images]
    updated[index] = value
    setImages(updated)
  }

  const deleteColor = (index: number) => {
    if (colors.length <= 1) return
    setColors(colors.filter((_, i) => i !== index))
  }

  const deleteImage = (index: number) => {
    if (images.length <= 1) return
    setImages(images.filter((_, i) => i !== index))
  }

  const addProduct = async () => {
    if (!name.trim()) {
      alert("Item name is required")
      return
    }

    const cleanedColors = colors.filter((color) => color.trim() !== "")
    const cleanedImages = images.filter((image) => image.trim() !== "")

    try {
      await addDoc(collection(db, "products"), {
        name,
        colors: cleanedColors,
        images: cleanedImages,
        createdAt: new Date(),
      })

      alert("✅ Product added successfully!")
      setName("")
      setColors([""])
      setImages([""])
    } catch (error) {
      console.error("❌ Error adding product:", error)
    }
  }

  return (
    <div className="max-w-screen-lg mx-auto bg-black min-h-screen p-6 text-white">
      <h2 className="text-2xl mb-4 font-semibold">Add New Product</h2>

      <label className="text-lg">Item Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-2 mb-6 w-full rounded-lg text-black border border-gray-300"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        {/* Colors */}
        <div>
          <label className="text-lg">Colors</label>
          {colors.map((color, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                placeholder={`Color ${index + 1}`}
                className="px-4 py-2 w-full rounded-lg text-black border border-gray-300"
              />
              <button
                onClick={() => deleteColor(index)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                disabled={colors.length <= 1}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setColors([...colors, ""])}
            className="text-sm text-blue-400 hover:text-blue-500"
          >
            + Add Color
          </button>
        </div>

        {/* Images */}
        <div>
          <label className="text-lg">Image URLs</label>
          {images.map((img, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                value={img}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder={`Image URL ${index + 1}`}
                className="px-4 py-2 w-full rounded-lg text-black border border-gray-300"
              />
              <button
                onClick={() => deleteImage(index)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                disabled={images.length <= 1}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setImages([...images, ""])}
            className="text-sm text-blue-400 hover:text-blue-500"
          >
            + Add Image URL
          </button>
        </div>
      </div>

      <button
        onClick={addProduct}
        className="px-6 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-white"
      >
        ➕ Add New
      </button>
    </div>
  )
}
