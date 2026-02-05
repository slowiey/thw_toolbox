import { useState, useRef, useEffect, useCallback } from 'react'

import logoBlue from '../assets/logos/THW_Logo_OV-Wesel_2025_RGB_blau_1000px_v1.0.png'
import logoWhite from '../assets/logos/THW_Logo_OV-Wesel_2025_RGB_weiss_1000px_v1.0.png'
import logoBlack from '../assets/logos/THW_Logo_OV-Wesel_2025_RGB_schwarz_1000px_v1.0.png'
import gearBlue from '../assets/logos/thw-gear-blue.png'
import gearWhite from '../assets/logos/thw-gear-white.png'
import gearBlack from '../assets/logos/thw-gear-black.png'

const LOGO_OPTIONS = [
    { id: 'blue', label: 'Logo Blau', src: logoBlue },
    { id: 'white', label: 'Logo Weiß', src: logoWhite, dark: true },
    { id: 'black', label: 'Logo Schwarz', src: logoBlack },
    { id: 'gear-blue', label: 'Zahnrad Blau', src: gearBlue },
    { id: 'gear-white', label: 'Zahnrad Weiß', src: gearWhite, dark: true },
    { id: 'gear-black', label: 'Zahnrad Schwarz', src: gearBlack },
]

const POSITIONS = [
    { id: 'top-left', label: 'Oben Links' },
    { id: 'top-right', label: 'Oben Rechts' },
    { id: 'bottom-left', label: 'Unten Links' },
    { id: 'bottom-right', label: 'Unten Rechts' },
]

// Logo sizing - pure percentage based (scales with image size)
const GEAR_PERCENTAGE = 20 // Gear logos at 25% of image width
const TEXT_LOGO_PERCENTAGE = 40 // Full logos at 40% of image width

// Default settings for new images
const DEFAULT_SETTINGS = {
    logo: 'gear-blue',
    position: 'top-right',
    photographer: '',
    showBottomBar: false,
    bottomBarText: '',
    ortsverbandText: '' // Text to display under gear logo
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9)

export default function PhotoEditor() {
    // Multi-image state - each image has its own settings
    const [images, setImages] = useState([])
    const [selectedImageId, setSelectedImageId] = useState(null)

    // Global settings template (for "Apply to All")
    const [globalSettings, setGlobalSettings] = useState({ ...DEFAULT_SETTINGS })

    // Logo object cache
    const [logoCache, setLogoCache] = useState({})
    const [isDragging, setIsDragging] = useState(false)

    const previewCanvasRef = useRef(null)

    // Get selected image
    const selectedImage = images.find(img => img.id === selectedImageId)

    // Get current settings (selected image's settings or global)
    const currentSettings = selectedImage?.settings || globalSettings

    // Preload all logos
    useEffect(() => {
        LOGO_OPTIONS.forEach(logo => {
            if (!logoCache[logo.id]) {
                const img = new Image()
                img.onload = () => {
                    setLogoCache(prev => ({ ...prev, [logo.id]: img }))
                }
                img.src = logo.src
            }
        })
    }, [])

    // Render preview canvas for selected image
    useEffect(() => {
        if (!previewCanvasRef.current || !selectedImage?.imageObj) return
        const logoObj = logoCache[currentSettings.logo]
        if (!logoObj) return
        renderImageWithBranding(previewCanvasRef.current, selectedImage.imageObj, logoObj, currentSettings)
    }, [selectedImage, logoCache, currentSettings])

    // Render branding on an image
    const renderImageWithBranding = useCallback((canvas, imageObj, logoObj, settings) => {
        const ctx = canvas.getContext('2d')

        canvas.width = imageObj.width
        canvas.height = imageObj.height

        // Draw image
        ctx.drawImage(imageObj, 0, 0)

        // Draw Blue Bar (at bottom of image, covering content)
        if (settings.showBottomBar) {
            // Height is 20% of image height
            const barHeight = Math.round(imageObj.height * 0.35)
            const barY = imageObj.height - barHeight

            // Draw Blue Bar
            ctx.fillStyle = '#003399' // THW Blue
            ctx.fillRect(0, barY, canvas.width, barHeight)

            // Draw Blue Bar Text with wrapping and auto-scaling
            if (settings.bottomBarText?.trim()) {
                const text = settings.bottomBarText
                const maxBarWidth = canvas.width * 0.9 // 5% padding on each side
                const maxBarHeight = barHeight * 0.8 // 10% vertical padding

                let fontSize = barHeight * 0.5 // Start larger to encourage using 2 lines if needed
                let lines = []
                let lineHeight = fontSize * 1.2

                // Iteratively reduce font size until text fits
                do {
                    ctx.font = `bold ${fontSize}px BundesSans, Arial, sans-serif`
                    lines = []

                    // Split by explicit newlines first
                    const paragraphs = text.split('\n')

                    paragraphs.forEach(paragraph => {
                        const words = paragraph.split(' ')
                        let currentLine = words[0]

                        for (let i = 1; i < words.length; i++) {
                            const word = words[i]
                            const width = ctx.measureText(currentLine + " " + word).width
                            if (width < maxBarWidth) {
                                currentLine += " " + word
                            } else {
                                lines.push(currentLine)
                                currentLine = word
                            }
                        }
                        lines.push(currentLine)
                    })

                    lineHeight = fontSize * 1.2
                    const totalHeight = lines.length * lineHeight

                    if (totalHeight <= maxBarHeight) {
                        // Check if any single line is too wide (e.g. one huge word)
                        const maxLineWidth = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0)
                        if (maxLineWidth <= maxBarWidth) {
                            break // Fits!
                        }
                    }

                    fontSize *= 0.9 // Reduce size by 10%
                } while (fontSize > 10)

                ctx.save()
                ctx.font = `bold ${fontSize}px BundesSans, Arial, sans-serif`
                ctx.fillStyle = '#ffffff'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.shadowColor = 'rgba(0,0,0,0.3)'
                ctx.shadowBlur = 4
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 2

                // Move text down: Center + 1/2 line height offset (less than full line to avoid clipping)
                const startY = barY + (barHeight - (lines.length * lineHeight)) / 2 + (lineHeight * 0.5)

                lines.forEach((line, i) => {
                    ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight))
                })

                ctx.restore()
            }
        }

        // Draw logo (Always on top of bar)
        if (logoObj) {
            const isGearLogo = settings.logo.includes('gear')
            const percentage = isGearLogo ? GEAR_PERCENTAGE : TEXT_LOGO_PERCENTAGE
            const logoWidth = canvas.width * (percentage / 100)
            const aspectRatio = logoObj.height / logoObj.width
            const logoHeight = logoWidth * aspectRatio
            const padding = canvas.width * 0.02

            let x, y
            switch (settings.position) {
                case 'top-left':
                    x = padding; y = padding
                    break
                case 'top-right':
                    x = canvas.width - logoWidth - padding; y = padding
                    break
                case 'bottom-left':
                    x = padding; y = canvas.height - logoHeight - padding
                    break
                case 'bottom-right':
                    x = canvas.width - logoWidth - padding; y = canvas.height - logoHeight - padding
                    break
                default:
                    x = canvas.width - logoWidth - padding; y = padding
            }

            // Draw logo with shadow for better visibility on any background
            ctx.save()
            ctx.shadowColor = 'rgba(0,0,0,0.3)'
            ctx.shadowBlur = 4
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 2
            ctx.drawImage(logoObj, x, y, logoWidth, logoHeight)
            ctx.restore()

            // Draw Ortsverband text under gear logo if text is provided
            if (isGearLogo && settings.ortsverbandText?.trim()) {
                const text = settings.ortsverbandText.trim()
                // Font size relative to logo width
                let fontSize = logoWidth * 0.15
                const maxTextWidth = logoWidth * 1.5

                ctx.save()
                ctx.font = `bold ${fontSize}px BundesSans, Arial, sans-serif`

                // Scale down if text is too wide
                let textWidth = ctx.measureText(text).width
                while (textWidth > maxTextWidth && fontSize > 10) {
                    fontSize *= 0.9
                    ctx.font = `bold ${fontSize}px BundesSans, Arial, sans-serif`
                    textWidth = ctx.measureText(text).width
                }

                // Determine text color based on logo type
                const isWhiteLogo = settings.logo.includes('white')
                ctx.fillStyle = isWhiteLogo ? '#ffffff' : '#003399' // White for white logo, THW blue otherwise
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'

                // Add shadow for visibility
                ctx.shadowColor = isWhiteLogo ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
                ctx.shadowBlur = 3
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 1

                // Position text centered under the logo
                const textX = x + logoWidth / 2
                const textY = y + logoHeight + (logoHeight * 0.05) // Small gap under logo

                ctx.fillText(text, textX, textY)
                ctx.restore()
            }
        }

        // Draw photographer credit (Always on top)
        if (settings.photographer.trim()) {
            const creditText = `Foto: THW / ${settings.photographer.trim()}`
            const fontSize = Math.max(18, canvas.width * 0.025)
            const padding = canvas.width * 0.015

            ctx.save()
            ctx.font = `${fontSize}px BundesSans, Arial, sans-serif`
            ctx.fillStyle = '#ffffff'
            ctx.textAlign = 'left'
            ctx.shadowColor = 'rgba(0,0,0,0.7)'
            ctx.shadowBlur = 3
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1

            // Position relative to canvas bottom (above blue bar if present)
            let creditY = canvas.height - padding
            if (settings.showBottomBar) {
                const barHeight = Math.round(imageObj.height * 0.35)
                creditY -= barHeight
            }

            ctx.translate(padding + fontSize, creditY)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText(creditText, 0, 0)
            ctx.restore()
        }
    }, [])

    // Handle file/folder upload
    const handleFiles = useCallback((files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))

        imageFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const newImage = {
                        id: generateId(),
                        file,
                        name: file.name.replace(/\.[^/.]+$/, '') + '.png', // Output as PNG
                        originalName: file.name,
                        dataUrl: e.target.result,
                        imageObj: img,
                        settings: { ...globalSettings } // Copy current global settings
                    }
                    setImages(prev => [...prev, newImage])
                }
                img.src = e.target.result
            }
            reader.readAsDataURL(file)
        })
    }, [globalSettings])

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)

        const items = e.dataTransfer.items
        if (items) {
            const files = []
            const processEntry = (entry) => {
                return new Promise((resolve) => {
                    if (entry.isFile) {
                        entry.file(file => {
                            files.push(file)
                            resolve()
                        })
                    } else if (entry.isDirectory) {
                        const reader = entry.createReader()
                        reader.readEntries(async (entries) => {
                            await Promise.all(entries.map(e => processEntry(e)))
                            resolve()
                        })
                    } else {
                        resolve()
                    }
                })
            }

            Promise.all(
                Array.from(items)
                    .filter(item => item.kind === 'file')
                    .map(item => {
                        const entry = item.webkitGetAsEntry?.()
                        return entry ? processEntry(entry) : Promise.resolve()
                    })
            ).then(() => {
                if (files.length > 0) {
                    handleFiles(files)
                } else {
                    handleFiles(e.dataTransfer.files)
                }
            })
        } else {
            handleFiles(e.dataTransfer.files)
        }
    }

    // Update selected image's settings
    const updateSelectedImageSettings = (key, value) => {
        if (!selectedImageId) return
        setImages(prev => prev.map(img =>
            img.id === selectedImageId
                ? { ...img, settings: { ...img.settings, [key]: value } }
                : img
        ))
    }

    // Apply settings (from selected image OR global) to ALL images
    const applySettingsToAll = () => {
        const sourceSettings = selectedImage ? selectedImage.settings : globalSettings

        setImages(prev => prev.map(img => ({
            ...img,
            settings: { ...sourceSettings }
        })))

        // Also update global settings so future uploads use these settings
        if (selectedImage) {
            setGlobalSettings({ ...sourceSettings })
        }
    }

    // Download single image as PNG
    const handleDownloadSingle = async () => {
        if (!selectedImage) return
        const logoObj = logoCache[currentSettings.logo]
        if (!logoObj) return

        const canvas = document.createElement('canvas')
        renderImageWithBranding(canvas, selectedImage.imageObj, logoObj, currentSettings)

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = selectedImage.name
            link.click()
            URL.revokeObjectURL(url)
        }, 'image/png')
    }

    // Download all images as individual PNGs
    const handleDownloadAll = async () => {
        for (const img of images) {
            const logoObj = logoCache[img.settings.logo]
            if (!logoObj) continue

            const canvas = document.createElement('canvas')
            renderImageWithBranding(canvas, img.imageObj, logoObj, img.settings)

            await new Promise(resolve => {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = img.name
                    link.click()
                    URL.revokeObjectURL(url)
                    setTimeout(resolve, 100) // Small delay between downloads
                }, 'image/png')
            })
        }
    }

    const handleClearAll = () => {
        setImages([])
        setSelectedImageId(null)
    }

    const handleRemoveImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id))
        if (selectedImageId === id) {
            setSelectedImageId(null)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="space-y-6">
                {/* Image Upload */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                        Bilder hochladen
                    </h3>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('photo-input').click()}
                        className={`
                            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                            ${isDragging
                                ? 'border-thw-blue bg-thw-blue/5'
                                : 'border-gray-300 hover:border-thw-blue hover:bg-gray-50'
                            }
                        `}
                    >
                        <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                        />
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium text-sm">Ordner oder Bilder hierher ziehen</p>
                        <p className="text-gray-400 text-xs mt-1">oder klicken zum Auswählen</p>
                    </div>
                    {images.length > 0 && (
                        <p className="text-sm text-thw-blue mt-3 font-medium">
                            {images.length} Bild{images.length !== 1 ? 'er' : ''} geladen
                        </p>
                    )}
                </div>

                {/* Settings Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            {selectedImage ? 'Bild-Einstellungen' : 'Globale Einstellungen'}
                        </h3>
                        {selectedImage && (
                            <span className="text-xs text-thw-blue bg-thw-blue/10 px-2 py-1 rounded">
                                {selectedImage.originalName}
                            </span>
                        )}
                    </div>

                    {/* Logo Selection */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Logo</p>
                        <div className="grid grid-cols-3 gap-2">
                            {LOGO_OPTIONS.map((logo) => (
                                <label
                                    key={logo.id}
                                    className={`
                                        relative cursor-pointer rounded-lg p-2 border-2 transition-all
                                        ${logo.dark ? 'bg-gray-800' : 'bg-white'}
                                        ${currentSettings.logo === logo.id
                                            ? 'border-thw-blue ring-2 ring-thw-blue/20'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="logo"
                                        value={logo.id}
                                        checked={currentSettings.logo === logo.id}
                                        onChange={(e) => {
                                            if (selectedImage) {
                                                updateSelectedImageSettings('logo', e.target.value)
                                            } else {
                                                setGlobalSettings(s => ({ ...s, logo: e.target.value }))
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                    <img src={logo.src} alt={logo.label} className="h-6 object-contain mx-auto" />
                                    <p className={`text-xs text-center mt-1 ${logo.dark ? 'text-white' : 'text-gray-600'}`}>
                                        {logo.label}
                                    </p>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Position */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Position</p>
                        <div className="grid grid-cols-2 gap-2">
                            {POSITIONS.map((pos) => (
                                <button
                                    key={pos.id}
                                    onClick={() => {
                                        if (selectedImage) {
                                            updateSelectedImageSettings('position', pos.id)
                                        } else {
                                            setGlobalSettings(s => ({ ...s, position: pos.id }))
                                        }
                                    }}
                                    className={`
                                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${currentSettings.position === pos.id
                                            ? 'bg-thw-blue text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {pos.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ortsverband Text (only for gear logos) */}
                    {currentSettings.logo.includes('gear') && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Text unter Logo (z.B. Ortsverband)</p>
                            <input
                                type="text"
                                value={currentSettings.ortsverbandText}
                                onChange={(e) => {
                                    if (selectedImage) {
                                        updateSelectedImageSettings('ortsverbandText', e.target.value)
                                    } else {
                                        setGlobalSettings(s => ({ ...s, ortsverbandText: e.target.value }))
                                    }
                                }}
                                placeholder="z.B. Ortsverband Wesel"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thw-blue focus:border-thw-blue outline-none text-sm"
                            />
                        </div>
                    )}

                    {/* Photographer Credit */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Fotografennachweis</p>
                        <input
                            type="text"
                            value={currentSettings.photographer}
                            onChange={(e) => {
                                if (selectedImage) {
                                    updateSelectedImageSettings('photographer', e.target.value)
                                } else {
                                    setGlobalSettings(s => ({ ...s, photographer: e.target.value }))
                                }
                            }}
                            placeholder="z.B. Max Mustermann"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thw-blue focus:border-thw-blue outline-none text-sm"
                        />
                    </div>

                    {/* Bottom Blue Bar */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={currentSettings.showBottomBar}
                                onChange={(e) => {
                                    const val = e.target.checked
                                    if (selectedImage) {
                                        updateSelectedImageSettings('showBottomBar', val)
                                    } else {
                                        setGlobalSettings(s => ({ ...s, showBottomBar: val }))
                                    }
                                }}
                                className="w-4 h-4 text-thw-blue rounded border-gray-300 focus:ring-thw-blue"
                            />
                            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Blauen Balken hinzufügen
                            </span>
                        </label>

                        {currentSettings.showBottomBar && (
                            <textarea
                                value={currentSettings.bottomBarText}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (selectedImage) {
                                        updateSelectedImageSettings('bottomBarText', val)
                                    } else {
                                        setGlobalSettings(s => ({ ...s, bottomBarText: val }))
                                    }
                                }}
                                placeholder="Text für den blauen Balken (Enter für Zeilenumbruch)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thw-blue focus:border-thw-blue outline-none text-sm min-h-[80px] resize-y"
                            />
                        )}
                    </div>

                    {/* Apply to All Button */}
                    {images.length > 0 && (
                        <button
                            onClick={applySettingsToAll}
                            className="w-full py-2 bg-thw-yellow text-gray-900 font-medium rounded-lg hover:bg-yellow-400 transition-all"
                        >
                            {selectedImage
                                ? `Einstellungen auf alle ${images.length} Bilder übertragen`
                                : `Auf alle ${images.length} Bilder anwenden`
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Gallery & Preview Panel */}
            <div className="lg:col-span-2 space-y-6">
                {/* Image Gallery */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Galerie
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadAll}
                                disabled={images.length === 0}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                                    ${images.length > 0
                                        ? 'bg-thw-blue text-white hover:bg-thw-blue-dark'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Alle downloaden
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={images.length === 0}
                                className={`
                                    px-4 py-2 rounded-lg font-medium text-sm transition-all
                                    ${images.length > 0
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                Alle löschen
                            </button>
                        </div>
                    </div>

                    {images.length === 0 ? (
                        <div className="bg-thw-gray rounded-lg min-h-[200px] flex items-center justify-center">
                            <div className="text-center text-gray-400 p-8">
                                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Bilder hochladen um die Galerie zu sehen</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {images.map((img) => (
                                <div
                                    key={img.id}
                                    onClick={() => setSelectedImageId(img.id === selectedImageId ? null : img.id)}
                                    className={`
                                        relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all
                                        ${selectedImageId === img.id
                                            ? 'ring-3 ring-thw-blue'
                                            : 'hover:ring-2 hover:ring-gray-300'
                                        }
                                    `}
                                >
                                    <img
                                        src={img.dataUrl}
                                        alt={img.originalName}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id) }}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                {selectedImage && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedImageId(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Vorschau
                                </h3>
                            </div>
                            <button
                                onClick={handleDownloadSingle}
                                className="flex items-center gap-2 px-4 py-2 bg-thw-blue text-white rounded-lg font-medium hover:bg-thw-blue-dark transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download PNG
                            </button>
                        </div>
                        <div className="bg-thw-gray rounded-lg flex items-center justify-center overflow-hidden">
                            <canvas
                                ref={previewCanvasRef}
                                className="max-w-full max-h-[500px] object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
