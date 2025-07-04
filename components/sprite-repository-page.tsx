"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Grid3X3, Download, Search, Loader2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePokemonPage, usePokemonSearch, gameVersions, type GameVersion } from "@/hooks/use-pokemon-api"

interface SpriteRepositoryPageProps {
  onPageChange: (page: "studio" | "projects" | "stencils") => void
  onLoadSprite?: (spriteData: any) => void
}

const typeColors: { [key: string]: string } = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
}

function PokemonCard({
  pokemon,
  gameVersion,
  onLoadSprite,
}: { pokemon: any; gameVersion: GameVersion; onLoadSprite?: (spriteData: any) => void }) {
  const [selectedSprite, setSelectedSprite] = useState<"front" | "back" | "front_shiny" | "back_shiny">("front")
  const [showSpriteOptions, setShowSpriteOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const spriteOptions = [
    { key: "front", label: "Front", sprite: pokemon.sprites.front_default },
    { key: "back", label: "Back", sprite: pokemon.sprites.back_default },
    { key: "front_shiny", label: "Front Shiny", sprite: pokemon.sprites.front_shiny },
    { key: "back_shiny", label: "Back Shiny", sprite: pokemon.sprites.back_shiny },
  ].filter((option) => option.sprite)

  const currentSprite =
    spriteOptions.find((option) => option.key === selectedSprite)?.sprite || pokemon.sprites.front_default

  const handleLoadSprite = async () => {
    if (!currentSprite || !onLoadSprite || isLoading) return

    setIsLoading(true)
    try {
      // For animated sprites, extract frames
      if (gameVersion.animated) {
        const spriteData = await extractAnimatedFrames(
          currentSprite,
          pokemon,
          gameVersion,
          selectedSprite,
          spriteOptions,
        )
        onLoadSprite(spriteData)
        return
      }

      // For static sprites, convert to pixel data
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = currentSprite
      })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = []

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4
          const r = imageData.data[index]
          const g = imageData.data[index + 1]
          const b = imageData.data[index + 2]
          const a = imageData.data[index + 3]

          if (a > 0) {
            const color = `rgb(${r}, ${g}, ${b})`
            pixels.push({ x, y, color })
          }
        }
      }

      const spriteData = {
        id: `pokemon-${pokemon.id}-${selectedSprite}-${gameVersion.id}`,
        name: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} (${gameVersion.name} - ${spriteOptions.find((opt) => opt.key === selectedSprite)?.label})`,
        category: "Pokemon",
        description: `Official ${pokemon.name} sprite from ${gameVersion.name}`,
        size: `${canvas.width}x${canvas.height}`,
        pixels: pixels,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        pokemonData: pokemon,
        gameVersion: gameVersion,
      }

      onLoadSprite(spriteData)
    } catch (error) {
      console.error("Failed to load sprite:", error)
      alert("Failed to load sprite. This Pokemon might not be available in the selected game version.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Card className="p-3 bg-slate-800 border-slate-600 hover:border-slate-500 transition-all h-full flex flex-col">
      <div className="space-y-2 flex-1 flex flex-col">
        <div className="w-full h-20 bg-slate-700 rounded flex items-center justify-center relative flex-shrink-0">
          {currentSprite && !imageError ? (
            <img
              src={currentSprite || "/placeholder.svg"}
              alt={pokemon.name}
              className="max-w-full max-h-full object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="text-slate-500 text-xs text-center">{imageError ? "Not available" : "No sprite"}</div>
          )}
          {gameVersion.animated && !imageError && (
            <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">GIF</div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <h3 className="font-medium text-white capitalize text-sm truncate">{pokemon.name}</h3>
          <p className="text-xs text-slate-400">#{pokemon.id.toString().padStart(3, "0")}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {pokemon.types.slice(0, 2).map((type: any) => (
              <span
                key={type.type.name}
                className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                style={{ backgroundColor: typeColors[type.type.name] || "#68A090" }}
              >
                {type.type.name}
              </span>
            ))}
          </div>
        </div>

        {spriteOptions.length > 1 && (
          <div className="relative flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSpriteOptions(!showSpriteOptions)}
              className="w-full bg-slate-700 border-slate-600 text-white text-xs justify-between h-8 px-2"
            >
              <span className="truncate">
                {spriteOptions.find((opt) => opt.key === selectedSprite)?.label || "Front"}
              </span>
              <ChevronDown className="w-3 h-3 flex-shrink-0 ml-1" />
            </Button>

            {showSpriteOptions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded z-30">
                {spriteOptions.map((option) => (
                  <button
                    key={option.key}
                    className="w-full px-3 py-2 text-left text-white text-xs hover:bg-slate-600 first:rounded-t last:rounded-b truncate"
                    onClick={() => {
                      setSelectedSprite(option.key as any)
                      setShowSpriteOptions(false)
                      setImageError(false)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full bg-green-600 border-green-600 text-white hover:bg-green-700 disabled:opacity-50 h-8 text-xs flex-shrink-0 px-2"
          onClick={handleLoadSprite}
          disabled={isLoading || imageError}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-1 flex-shrink-0" />
              <span className="truncate">Loading...</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">Load</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

// Enhanced animated frame extraction
async function extractAnimatedFrames(
  spriteUrl: string,
  pokemon: any,
  gameVersion: GameVersion,
  selectedSprite: string,
  spriteOptions: any[],
) {
  try {
    // Load the animated GIF and try to extract frame data
    const img = new Image()
    img.crossOrigin = "anonymous"

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = spriteUrl
    })

    // For now, we'll create a basic frame structure
    // In a real implementation, you'd use a GIF parsing library
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get canvas context")

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    // Extract pixel data from the first frame
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = []

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4
        const r = imageData.data[index]
        const g = imageData.data[index + 1]
        const b = imageData.data[index + 2]
        const a = imageData.data[index + 3]

        if (a > 0) {
          const color = `rgb(${r}, ${g}, ${b})`
          pixels.push({ x, y, color })
        }
      }
    }

    const spriteData = {
      id: `pokemon-${pokemon.id}-${selectedSprite}-${gameVersion.id}`,
      name: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} (${gameVersion.name} - ${spriteOptions.find((opt) => opt.key === selectedSprite)?.label})`,
      category: "Pokemon",
      description: `Animated ${pokemon.name} sprite from ${gameVersion.name}`,
      size: `${canvas.width}x${canvas.height}`,
      pixels: pixels, // First frame pixels
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      pokemonData: pokemon,
      gameVersion: gameVersion,
      spriteUrl: spriteUrl,
      isAnimated: true,
      frameCount: 2, // Most Gen 5 sprites have 2 frames
      animatedFrames: {
        0: pixels, // First frame
        1: [], // Second frame (would need GIF parsing to extract)
        2: [], // Third frame
        3: [], // Fourth frame
      },
    }

    return spriteData
  } catch (error) {
    console.error("Failed to extract animated frames:", error)
    throw error
  }
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {getVisiblePages().map((page, index) => (
        <Button
          key={index}
          size="sm"
          variant={page === currentPage ? "default" : "outline"}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={typeof page !== "number"}
          className={
            page === currentPage
              ? "bg-cyan-600 hover:bg-cyan-700"
              : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          }
        >
          {page}
        </Button>
      ))}

      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function SpriteRepositoryPage({ onPageChange, onLoadSprite }: SpriteRepositoryPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGameVersion, setSelectedGameVersion] = useState<GameVersion>(gameVersions[7]) // Default to Black/White
  const [showGameVersions, setShowGameVersions] = useState(false)

  const { pokemon, loading, error, totalPages } = usePokemonPage(currentPage, selectedGameVersion)
  const { results: searchResults, loading: searchLoading } = usePokemonSearch(searchQuery, selectedGameVersion)

  const displayPokemon = searchQuery.trim() ? searchResults : pokemon

  const handleGameVersionChange = (gameVersion: GameVersion) => {
    setSelectedGameVersion(gameVersion)
    setShowGameVersions(false)
    // Don't reset to page 1 - keep current page
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-cyan-400">Poke Sprite Generator</span>
            </div>

            <nav className="flex items-center gap-6">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => onPageChange("studio")}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Studio
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => onPageChange("projects")}
              >
                Projects
              </Button>
              <Button variant="ghost" className="text-cyan-400 bg-slate-700">
                Pokemon Repository
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => router.push("/auth/signin")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Pokemon Sprite Repository</h1>
            <p className="text-slate-400">
              Load official Pokemon sprites from different games - including animated Gen 5 sprites!
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <Input
                  placeholder="Search Pokemon by name or ID..."
                  className="pl-10 bg-slate-800 border-slate-600 text-white relative z-20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-2" />}
            </div>

            {/* Game Version Selector */}
            <div className="flex gap-4 items-center mb-4">
              <span className="text-slate-400 text-sm">Game Version:</span>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowGameVersions(!showGameVersions)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 min-w-[200px] justify-between"
                >
                  {selectedGameVersion.name}
                  {selectedGameVersion.animated && <span className="text-green-400 text-xs ml-2">ANIMATED</span>}
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {showGameVersions && (
                  <div className="absolute top-full left-0 mt-1 bg-slate-700 border border-slate-600 rounded z-50 min-w-[250px] max-h-64 overflow-y-auto">
                    {gameVersions.map((version) => (
                      <button
                        key={version.id}
                        className="w-full px-4 py-3 text-left text-white hover:bg-slate-600 first:rounded-t last:rounded-b flex items-center justify-between"
                        onClick={() => handleGameVersionChange(version)}
                      >
                        <div>
                          <div className="font-medium">{version.name}</div>
                          <div className="text-xs text-slate-400">Generation {version.generation}</div>
                        </div>
                        {version.animated && <span className="text-green-400 text-xs">ANIMATED</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8 text-center">
              <p className="text-red-400 mb-2">Error loading Pokemon: {error}</p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Retry
              </Button>
            </div>
          )}

          {/* Pokemon Grid - Fixed layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 mb-8 auto-rows-fr">
            {displayPokemon.map((poke) => (
              <PokemonCard
                key={`${poke.id}-${selectedGameVersion.id}`}
                pokemon={poke}
                gameVersion={selectedGameVersion}
                onLoadSprite={onLoadSprite}
              />
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                <span className="text-slate-400">Loading Pokemon...</span>
                <p className="text-slate-500 text-sm mt-1">Loading {selectedGameVersion.name} sprites</p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!searchQuery && !loading && totalPages > 1 && (
            <div className="flex flex-col items-center gap-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages} • Showing 75 Pokemon per page
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No Pokemon found for "{searchQuery}"</p>
              <p className="text-slate-500 text-sm mt-2">Try searching by name or Pokedex number</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
