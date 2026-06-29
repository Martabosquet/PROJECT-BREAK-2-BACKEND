import { jest } from "@jest/globals"

const saveMock = jest.fn()
const WishlistMock = jest.fn().mockImplementation((data) => ({ ...data, save: saveMock }))
WishlistMock.find = jest.fn()
WishlistMock.findByIdAndDelete = jest.fn()
const prismaMock = { product: { findUnique: jest.fn() } }

await jest.unstable_mockModule("../../models/wishlist.model.js", () => ({
  __esModule: true,
  Wishlist: WishlistMock,
}))
await jest.unstable_mockModule("../../config/prismaClient.js", () => ({
  __esModule: true,
  default: prismaMock,
}))

const { default: prisma } = await import("../../config/prismaClient.js")
const {
  addToWishlist,
  getWishlistByUser,
  removeFromWishlist,
  addMovieToWishlist,
  removeMovieFromWishlist,
  isMovieInWishlist,
} = await import("../../services/wishlist.service.js")

describe("wishlist.service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("database operations", () => {
    it("throws when the product does not exist", async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(addToWishlist("user-1", "product-1")).rejects.toThrow("El producto no existe")
    })

    it("adds an item to the wishlist when the product exists", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: "product-1", title: "Película" })
      saveMock.mockResolvedValue({ id: "wishlist-1", userId: "user-1", productId: "product-1" })

      const result = await addToWishlist("user-1", "product-1")

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: "product-1" } })
      expect(WishlistMock).toHaveBeenCalledWith({ userId: "user-1", productId: "product-1" })
      expect(saveMock).toHaveBeenCalled()
      expect(result).toEqual({ id: "wishlist-1", userId: "user-1", productId: "product-1" })
    })

    it("returns the wishlist for a user", async () => {
      const wishlistItems = [{ userId: "user-1", productId: "product-1" }]
      WishlistMock.find.mockResolvedValue(wishlistItems)

      const result = await getWishlistByUser("user-1")

      expect(WishlistMock.find).toHaveBeenCalledWith({ userId: "user-1" })
      expect(result).toBe(wishlistItems)
    })

    it("removes an item from the wishlist", async () => {
      const removedItem = { id: "wishlist-1", userId: "user-1", productId: "product-1" }
      WishlistMock.findByIdAndDelete.mockResolvedValue(removedItem)

      const result = await removeFromWishlist("wishlist-1")

      expect(WishlistMock.findByIdAndDelete).toHaveBeenCalledWith("wishlist-1")
      expect(result).toBe(removedItem)
    })
  })

  describe("pure helper functions", () => {
    it("adds a movie to the wishlist when it is not already present", () => {
      expect(addMovieToWishlist(["1", "2"], "3")).toEqual(["1", "2", "3"])
    })

    it("does not duplicate a movie already in the wishlist", () => {
      expect(addMovieToWishlist(["1", "2"], "2")).toEqual(["1", "2"])
    })

    it("removes a movie from the wishlist", () => {
      expect(removeMovieFromWishlist(["1", "2", "3"], "2")).toEqual(["1", "3"])
    })

    it("checks if a movie is in the wishlist", () => {
      expect(isMovieInWishlist(["1", "2"], "2")).toBe(true)
      expect(isMovieInWishlist(["1", "2"], "3")).toBe(false)
    })
  })
})
