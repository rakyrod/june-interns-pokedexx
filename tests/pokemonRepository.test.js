import { jest } from "@jest/globals";

// Mock axios to avoid real HTTP requests
jest.unstable_mockModule("axios", () => ({ default: { get: jest.fn() } }));

const axios = await import("axios");
const repo = await import("../src/repositories/pokemonRepository.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("pokemonRepository", () => {
  test("getAllPokemon returns response data", async () => {
    axios.default.get.mockResolvedValue({
      data: { count: 2, results: [{ name: "a" }, { name: "b" }] },
    });

    const res = await repo.getAllPokemon(2, 0);

    expect(axios.default.get).toHaveBeenCalledWith(
      expect.stringContaining("/pokemon"),
      {
        params: { limit: 2, offset: 0 },
      },
    );
    expect(res).toEqual({ count: 2, results: [{ name: "a" }, { name: "b" }] });
  });

  test("getPokemonByNameOrId returns data and null on 404", async () => {
    axios.default.get.mockResolvedValueOnce({ data: { id: 1, name: "a" } });
    const data = await repo.getPokemonByNameOrId("a");
    expect(data).toEqual({ id: 1, name: "a" });

    const err = new Error("not found");
    err.response = { status: 404 };
    axios.default.get.mockRejectedValueOnce(err);
    const notFound = await repo.getPokemonByNameOrId("missing");
    expect(notFound).toBeNull();
  });

  test("getPokemonSpecies returns data and null on 404", async () => {
    axios.default.get.mockResolvedValueOnce({
      data: { flavor_text_entries: [] },
    });
    const data = await repo.getPokemonSpecies("a");
    expect(data).toEqual({ flavor_text_entries: [] });

    const err = new Error("not found");
    err.response = { status: 404 };
    axios.default.get.mockRejectedValueOnce(err);
    const notFound = await repo.getPokemonSpecies("missing");
    expect(notFound).toBeNull();
  });

  test("searchPokemon filters results", async () => {
    const all = {
      data: {
        results: [
          { name: "pikachu" },
          { name: "raichu" },
          { name: "bulbasaur" },
        ],
      },
    };
    axios.default.get.mockResolvedValueOnce(all);

    const res = await repo.searchPokemon("pi", 100);
    expect(axios.default.get).toHaveBeenCalledWith(
      expect.stringContaining("/pokemon"),
      { params: { limit: 100, offset: 0 } },
    );
    expect(res.count).toBe(1);
    expect(res.results).toEqual([{ name: "pikachu" }]);
  });

  test("getPokemonTypes returns results", async () => {
    axios.default.get.mockResolvedValueOnce({
      data: { results: [{ name: "electric" }] },
    });
    const res = await repo.getPokemonTypes();
    expect(res).toEqual([{ name: "electric" }]);
  });

  test("getPokemonByType returns mapped list and null on 404", async () => {
    axios.default.get.mockResolvedValueOnce({
      data: {
        pokemon: [
          { pokemon: { name: "pikachu" } },
          { pokemon: { name: "raichu" } },
        ],
      },
    });
    const res = await repo.getPokemonByType("electric");
    expect(res).toEqual([{ name: "pikachu" }, { name: "raichu" }]);

    const err = new Error("not found");
    err.response = { status: 404 };
    axios.default.get.mockRejectedValueOnce(err);
    const notFound = await repo.getPokemonByType("unknown");
    expect(notFound).toBeNull();
  });
});
