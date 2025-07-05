"use client"

import { useState, useEffect } from "react"

interface PokemonSprite {
  id: number
  name: string
  sprites: {
    front_default: string | null
    back_default: string | null
    front_shiny: string | null
    back_shiny: string | null
    versions?: any
  }
  types: Array<{
    type: {
      name: string
    }
  }>
  height: number
  weight: number
}

interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Array<{
    name: string
    url: string
  }>
}

export interface GameVersion {
  id: string
  name: string
  generation: number
  spriteBase: string
  animated?: boolean
}

export const gameVersions: GameVersion[] = [
  // Gen 3
  {
    id: "ruby-sapphire",
    name: "Ruby/Sapphire",
    generation: 3,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire",
  },
  {
    id: "emerald",
    name: "Emerald",
    generation: 3,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald",
  },
  {
    id: "firered-leafgreen",
    name: "FireRed/LeafGreen",
    generation: 3,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen",
  },
  // Gen 4
  {
    id: "diamond-pearl",
    name: "Diamond/Pearl",
    generation: 4,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl",
  },
  {
    id: "platinum",
    name: "Platinum",
    generation: 4,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum",
  },
  {
    id: "heartgold-soulsilver",
    name: "HeartGold/SoulSilver",
    generation: 4,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver",
  },
  // Gen 5
  {
    id: "black-white",
    name: "Black/White",
    generation: 5,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white",
  },
  {
    id: "black-white-animated",
    name: "Black/White (Animated)",
    generation: 5,
    spriteBase:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated",
    animated: true,
  },
  // Default
  {
    id: "default",
    name: "Default (Latest)",
    generation: 8,
    spriteBase: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon",
  },
]

export function usePokemonPage(page: number, gameVersion: GameVersion) {
  const [pokemon, setPokemon] = useState<PokemonSprite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [cache, setCache] = useState<Map<string, PokemonSprite[]>>(new Map())

  const pokemonPerPage = 75
  const offset = (page - 1) * pokemonPerPage

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true)
        setError(null)

        const cacheKey = `${page}-${gameVersion.id}`
        if (cache.has(cacheKey)) {
          const cachedData = cache.get(cacheKey)!
          setPokemon(cachedData)
          setLoading(false)
          return
        }

        // Fetch the list of Pokemon
        const listResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${pokemonPerPage}&offset=${offset}`)
        if (!listResponse.ok) throw new Error("Failed to fetch Pokemon list")

        const listData: PokemonListResponse = await listResponse.json()
        setTotalPages(Math.ceil(listData.count / pokemonPerPage))

        // Fetch detailed data for each Pokemon with game-specific sprites
        const pokemonPromises = listData.results.map(async (poke) => {
          try {
            const response = await fetch(poke.url)
            if (!response.ok) throw new Error(`Failed to fetch ${poke.name}`)

            const data = await response.json()

            // Build custom sprites based on selected game version
            const customSprites = {
              front_default: `${gameVersion.spriteBase}/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
              back_default: `${gameVersion.spriteBase}/back/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
              front_shiny: `${gameVersion.spriteBase}/shiny/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
              back_shiny: `${gameVersion.spriteBase}/back/shiny/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
              versions: data.sprites.versions,
            }

            return {
              id: data.id,
              name: data.name,
              sprites: customSprites,
              types: data.types,
              height: data.height,
              weight: data.weight,
            }
          } catch (error) {
            console.warn(`Failed to load ${poke.name}:`, error)
            return null
          }
        })

        const pokemonResults = await Promise.all(pokemonPromises)
        const pokemonData = pokemonResults.filter(Boolean) as PokemonSprite[]

        // Cache the results
        setCache((prev) => new Map(prev).set(cacheKey, pokemonData))
        setPokemon(pokemonData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch Pokemon")
      } finally {
        setLoading(false)
      }
    }

    fetchPokemon()
  }, [page, gameVersion, offset, pokemonPerPage])

  return { pokemon, loading, error, totalPages, currentPage: page }
}

export function usePokemonSearch(query: string, gameVersion: GameVersion) {
  const [results, setResults] = useState<PokemonSprite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchCache, setSearchCache] = useState<Map<string, PokemonSprite>>(new Map())

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchPokemon = async () => {
      const searchKey = `${query.toLowerCase().trim()}-${gameVersion.id}`

      // Check cache first
      if (searchCache.has(searchKey)) {
        setResults([searchCache.get(searchKey)!])
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`)

        if (!response.ok) {
          throw new Error("Pokemon not found")
        }

        const data = await response.json()

        // Build custom sprites based on selected game version
        const customSprites = {
          front_default: `${gameVersion.spriteBase}/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
          back_default: `${gameVersion.spriteBase}/back/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
          front_shiny: `${gameVersion.spriteBase}/shiny/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
          back_shiny: `${gameVersion.spriteBase}/back/shiny/${data.id}.${gameVersion.animated ? "gif" : "png"}`,
          versions: data.sprites.versions,
        }

        const pokemon: PokemonSprite = {
          id: data.id,
          name: data.name,
          sprites: customSprites,
          types: data.types,
          height: data.height,
          weight: data.weight,
        }

        // Cache the result
        setSearchCache((prev) => new Map(prev).set(searchKey, pokemon))
        setResults([pokemon])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed")
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchPokemon, 800)
    return () => clearTimeout(debounceTimer)
  }, [query, gameVersion])

  return { results, loading, error }
}
